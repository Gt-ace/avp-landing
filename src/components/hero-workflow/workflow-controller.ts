import {
  connections,
  fragments,
  layoutModeForWidth,
} from './workflow-model'
import {
  composedProgress,
  interpolatePose,
  proximityProgress,
  scrollProgress,
  stepSpring,
  type Point,
  type SpringState,
} from './workflow-motion'

type RuntimeFragment = {
  element: HTMLElement
  messyLabel: HTMLElement | null
  resolvedLabel: HTMLElement | null
  center: Point
  resolve: SpringState
  offsetX: SpringState
  offsetY: SpringState
}

const SPRING = { stiffness: 180, damping: 24 }
const POINTER_RADIUS = 220
const TAP_HOLD_MS = 650

export function pauseWorkflowFrame(
  frame: number,
  cancelFrame: (frameId: number) => void,
) {
  cancelFrame(frame)
  return 0
}

export function pointerInteraction(pointerType: string, finePointer: boolean) {
  return pointerType === 'touch' || !finePointer ? 'tap' : 'drag'
}

export function localTargetForFragment(
  fragmentId: string,
  hoverId: string | null,
  dragId: string | null,
  localProgress: number,
  tapActive: boolean,
) {
  if (fragmentId === hoverId || fragmentId === dragId) return 0
  return tapActive ? localProgress * 0.82 : localProgress
}

export function pointerEventsForOpacity(opacity: number): 'auto' | 'none' {
  return opacity < 0.05 ? 'none' : 'auto'
}

export function setupWorkflow(root: HTMLElement) {
  if (root.dataset.ready === 'true') return () => {}

  const stage = root.closest<HTMLElement>('[data-workflow-stage]')
  const scene = root.querySelector<HTMLElement>('[data-workflow-scene]')
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const fineQuery = matchMedia('(pointer: fine)')
  if (!stage || !scene) return () => {}
  if (reducedQuery.matches) {
    root.dataset.ready = 'true'
    root.dataset.reducedMotion = 'true'
    return () => {
      delete root.dataset.ready
      delete root.dataset.reducedMotion
    }
  }

  const runtime = new Map<string, RuntimeFragment>()
  for (const definition of fragments) {
    const element = root.querySelector<HTMLElement>(
      `[data-fragment="${definition.id}"]`,
    )
    if (!element) continue
    runtime.set(definition.id, {
      element,
      messyLabel: element.querySelector<HTMLElement>(
        '.workflow-label--messy',
      ),
      resolvedLabel: element.querySelector<HTMLElement>(
        '.workflow-label--resolved',
      ),
      center: { x: 0, y: 0 },
      resolve: { value: 0, velocity: 0 },
      offsetX: { value: 0, velocity: 0 },
      offsetY: { value: 0, velocity: 0 },
    })
  }

  const pointer: Point = { x: -10_000, y: -10_000 }
  let scrollValue = 1
  let tapUntil = 0
  let hoverId: string | null = null
  let dragId: string | null = null
  let dragOrigin: Point = { x: 0, y: 0 }
  let sceneSize = { width: 1, height: 1 }
  let visible = true
  let frame = 0
  let lastTime = performance.now()

  const measure = () => {
    const rect = scene.getBoundingClientRect()
    sceneSize = { width: rect.width, height: rect.height }
    const mode = layoutModeForWidth(rect.width)
    for (const definition of fragments) {
      const item = runtime.get(definition.id)
      if (!item) continue
      const pose = definition.messy[mode]
      item.center = {
        x: (pose.x / 100) * rect.width,
        y: (pose.y / 100) * rect.height,
      }
    }
  }

  const updateScroll = () => {
    const rect = stage.getBoundingClientRect()
    scrollValue = scrollProgress(rect.top, innerHeight, rect.height)
    requestFrame()
  }

  const render = (now: number) => {
    frame = 0
    if (!visible || reducedQuery.matches) return

    const { width, height } = sceneSize
    const mode = layoutModeForWidth(width)
    const delta = Math.min((now - lastTime) / 1000, 1 / 30)
    lastTime = now
    const positions = new Map<string, Point>()
    const progressById = new Map<string, number>()
    let springActive = false

    if (tapUntil && now >= tapUntil) {
      tapUntil = 0
      pointer.x = -10_000
      pointer.y = -10_000
    }

    for (const definition of fragments) {
      const item = runtime.get(definition.id)
      if (!item) continue

      const localProgress = proximityProgress(
        item.center,
        pointer,
        POINTER_RADIUS,
      )
      const localTarget = localTargetForFragment(
        definition.id,
        hoverId,
        dragId,
        localProgress,
        now < tapUntil,
      )
      item.resolve = stepSpring(item.resolve, localTarget, delta, SPRING)
      const progress = composedProgress(scrollValue, item.resolve.value)
      const pose = interpolatePose(
        definition.messy[mode],
        definition.resolved[mode],
        progress,
      )
      progressById.set(definition.id, progress)

      if (definition.id !== dragId) {
        item.offsetX = stepSpring(item.offsetX, 0, delta, SPRING)
        item.offsetY = stepSpring(item.offsetY, 0, delta, SPRING)
      }

      springActive ||= Math.abs(item.offsetX.value) > 0.1
      springActive ||= Math.abs(item.offsetY.value) > 0.1
      springActive ||= Math.abs(item.resolve.velocity) > 0.01
      springActive ||= Math.abs(item.resolve.value - localTarget) > 0.01

      const x = (pose.x / 100) * width + item.offsetX.value
      const y = (pose.y / 100) * height + item.offsetY.value
      item.center = { x, y }
      positions.set(definition.id, { x, y })
      item.element.style.transform =
        `translate3d(${x}px, ${y}px, 0) ` +
        `translate(-50%, -50%) rotate(${pose.rotation}deg)`
      item.element.style.opacity = String(pose.opacity)
      item.element.style.pointerEvents = pointerEventsForOpacity(pose.opacity)
      if (item.messyLabel) {
        item.messyLabel.style.opacity = String(1 - progress)
      }
      if (item.resolvedLabel) {
        item.resolvedLabel.style.opacity = String(progress)
      }
    }

    for (const connection of connections) {
      const line = root.querySelector<SVGLineElement>(
        `[data-connection="${connection.id}"]`,
      )
      const from = positions.get(connection.from)
      const to = positions.get(connection.to)
      if (!line || !from || !to) continue
      line.setAttribute('x1', String(from.x))
      line.setAttribute('y1', String(from.y))
      line.setAttribute('x2', String(to.x))
      line.setAttribute('y2', String(to.y))
      const edgeProgress = Math.min(
        progressById.get(connection.from) ?? scrollValue,
        progressById.get(connection.to) ?? scrollValue,
      )
      line.style.opacity =
        connection.state === 'resolved'
          ? String(edgeProgress * 0.42)
          : String((1 - edgeProgress) * 0.45)
    }

    const tail = root.querySelector<SVGLineElement>('[data-process-tail]')
    const done = positions.get('done')
    if (tail && done) {
      tail.setAttribute('x1', String(done.x))
      tail.setAttribute('y1', String(done.y))
      tail.setAttribute('x2', String(done.x))
      tail.setAttribute('y2', String(height * 0.92))
      tail.style.opacity = String(scrollValue * 0.28)
    }

    if (springActive || dragId || now < tapUntil) requestFrame()
  }

  const requestFrame = () => {
    if (!frame && visible && !reducedQuery.matches) {
      frame = requestAnimationFrame(render)
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const rect = scene.getBoundingClientRect()
    pointer.x = event.clientX - rect.left
    pointer.y = event.clientY - rect.top

    const interaction = pointerInteraction(
      event.pointerType,
      fineQuery.matches,
    )
    const hoverTarget = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-fragment]',
    )
    hoverId =
      interaction === 'drag'
        ? hoverTarget?.dataset.fragment ?? null
        : null

    if (dragId) {
      const item = runtime.get(dragId)
      if (item) {
        item.offsetX.value = pointer.x - dragOrigin.x
        item.offsetY.value = pointer.y - dragOrigin.y
      }
    }
    requestFrame()
  }

  const onPointerDown = (event: PointerEvent) => {
    const rect = scene.getBoundingClientRect()
    pointer.x = event.clientX - rect.left
    pointer.y = event.clientY - rect.top
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-fragment]',
    )
    const interaction = pointerInteraction(
      event.pointerType,
      fineQuery.matches,
    )
    if (!target) {
      if (interaction === 'tap') {
        tapUntil = performance.now() + TAP_HOLD_MS
        requestFrame()
      }
      return
    }

    if (interaction === 'tap') {
      tapUntil = performance.now() + TAP_HOLD_MS
      requestFrame()
      return
    }

    dragId = target.dataset.fragment ?? null
    if (!dragId) return
    const item = runtime.get(dragId)
    if (!item) return
    dragOrigin = {
      x: pointer.x - item.offsetX.value,
      y: pointer.y - item.offsetY.value,
    }
    target.setPointerCapture(event.pointerId)
    target.dataset.dragging = 'true'
    requestFrame()
  }

  const endDrag = (event: PointerEvent) => {
    if (!dragId) return
    const item = runtime.get(dragId)
    item?.element.removeAttribute('data-dragging')
    if (item?.element.hasPointerCapture(event.pointerId)) {
      item.element.releasePointerCapture(event.pointerId)
    }
    hoverId = null
    dragId = null
    requestFrame()
  }

  const onPointerLeave = () => {
    if (dragId || performance.now() < tapUntil) return
    hoverId = null
    pointer.x = -10_000
    pointer.y = -10_000
    requestFrame()
  }

  const resizeObserver = new ResizeObserver(() => {
    measure()
    updateScroll()
  })
  resizeObserver.observe(scene)

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) requestFrame()
    else frame = pauseWorkflowFrame(frame, cancelAnimationFrame)
  })
  intersectionObserver.observe(stage)

  const onReducedChange = () => {
    root.dataset.reducedMotion = String(reducedQuery.matches)
    if (reducedQuery.matches) {
      frame = pauseWorkflowFrame(frame, cancelAnimationFrame)
    }
    else requestFrame()
  }

  addEventListener('scroll', updateScroll, { passive: true })
  scene.addEventListener('pointermove', onPointerMove)
  scene.addEventListener('pointerdown', onPointerDown)
  scene.addEventListener('pointerup', endDrag)
  scene.addEventListener('pointercancel', endDrag)
  scene.addEventListener('pointerleave', onPointerLeave)
  reducedQuery.addEventListener('change', onReducedChange)

  root.dataset.ready = 'true'
  root.dataset.enhanced = 'true'
  measure()
  updateScroll()
  onReducedChange()

  return () => {
    frame = pauseWorkflowFrame(frame, cancelAnimationFrame)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    removeEventListener('scroll', updateScroll)
    scene.removeEventListener('pointermove', onPointerMove)
    scene.removeEventListener('pointerdown', onPointerDown)
    scene.removeEventListener('pointerup', endDrag)
    scene.removeEventListener('pointercancel', endDrag)
    scene.removeEventListener('pointerleave', onPointerLeave)
    reducedQuery.removeEventListener('change', onReducedChange)
    delete root.dataset.ready
  }
}
