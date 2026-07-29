import {
  artifacts,
  connections,
  layoutModeForWidth,
  type ArtifactId,
} from './workflow-model'
import {
  scrollProgress,
  visualStateForProgress,
  type ArtifactVisualState,
} from './workflow-motion'

type ScenePoint = { x: number; y: number }

type RuntimeArtifact = {
  element: HTMLElement
  halfWidth: number
  halfHeight: number
}

type StyleTarget = HTMLElement & {
  style?: CSSStyleDeclaration
}

export function shouldEnhanceWorkflow(reducedMotion: boolean) {
  return !reducedMotion
}

export function pauseWorkflowFrame(
  frame: number,
  cancel: (frameId: number) => void,
) {
  if (frame) cancel(frame)
  return 0
}

function setCustomProperty(
  target: StyleTarget,
  property: string,
  value: string,
) {
  target.style?.setProperty(property, value)
}

export function setupWorkflow(root: HTMLElement) {
  if (root.dataset.ready === 'true') return () => {}

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!shouldEnhanceWorkflow(reducedMotion)) return () => {}

  const stage = root.closest<HTMLElement>('[data-workflow-stage]')
  const scene = root.querySelector<HTMLElement>('[data-workflow-scene]')
  if (!stage || !scene) return () => {}

  const runtime = new Map<ArtifactId, RuntimeArtifact>()
  for (const definition of artifacts) {
    const element = root.querySelector<HTMLElement>(
      `[data-artifact="${definition.id}"]`,
    )
    if (!element) continue
    runtime.set(definition.id, {
      element,
      halfWidth: 0,
      halfHeight: 0,
    })
  }

  const lineElements = new Map<string, SVGLineElement>()
  for (const connection of connections) {
    const line = root.querySelector<SVGLineElement>(
      `[data-connection="${connection.id}"]`,
    )
    if (line) lineElements.set(connection.id, line)
  }
  const processTail = root.querySelector<SVGLineElement>('[data-process-tail]')

  let sceneSize = { width: 1, height: 1 }
  let storyValue = 0
  let visible = true
  let frame = 0

  const measure = () => {
    const sceneRect = scene.getBoundingClientRect()
    sceneSize = {
      width: Math.max(1, sceneRect.width),
      height: Math.max(1, sceneRect.height),
    }

    for (const item of runtime.values()) {
      const rect = item.element.getBoundingClientRect()
      item.halfWidth = rect.width / 2
      item.halfHeight = rect.height / 2
    }
  }

  const requestFrame = () => {
    if (!frame && visible) frame = requestAnimationFrame(render)
  }

  const updateScroll = () => {
    const stageRect = stage.getBoundingClientRect()
    const viewportHeight = typeof innerHeight === 'number' ? innerHeight : 1
    storyValue = scrollProgress(stageRect.top, viewportHeight, stageRect.height)
    requestFrame()
  }

  const render = () => {
    frame = 0
    if (!visible) return

    const mode = layoutModeForWidth(sceneSize.width)
    const positions = new Map<ArtifactId, ScenePoint>()
    const states = new Map<ArtifactId, ArtifactVisualState>()
    let cobaltValue = 0

    for (const definition of artifacts) {
      const item = runtime.get(definition.id)
      if (!item) continue

      const state = visualStateForProgress(
        definition.poses.recognition[mode],
        definition.poses.diagnosis[mode],
        definition.poses.resolved[mode],
        storyValue,
      )
      const { pose } = state
      const position = {
        x: pose.x,
        y: pose.y,
      }
      const pixelPosition = {
        x: (pose.x / 100) * sceneSize.width,
        y: (pose.y / 100) * sceneSize.height,
      }
      states.set(definition.id, state)
      positions.set(definition.id, position)
      cobaltValue = Math.max(cobaltValue, state.cobaltProgress)

      setCustomProperty(item.element, '--artifact-x', `${pixelPosition.x}px`)
      setCustomProperty(item.element, '--artifact-y', `${pixelPosition.y}px`)
      setCustomProperty(item.element, '--artifact-rotation', `${pose.rotation}deg`)
      setCustomProperty(item.element, '--artifact-scale', String(pose.scale))
      setCustomProperty(item.element, '--artifact-opacity', String(pose.opacity))
      setCustomProperty(item.element, '--annotation-opacity', String(state.annotationOpacity))
      item.element.style.pointerEvents = pose.opacity < 0.05 ? 'none' : 'auto'
    }

    setCustomProperty(root, '--story-progress', String(storyValue))
    setCustomProperty(root, '--cobalt-progress', String(cobaltValue))

    for (const connection of connections) {
      const line = lineElements.get(connection.id)
      const from = positions.get(connection.from)
      const to = positions.get(connection.to)
      if (!line || !from || !to) continue

      line.setAttribute('x1', String(from.x))
      line.setAttribute('y1', String(from.y))
      line.setAttribute('x2', String(to.x))
      line.setAttribute('y2', String(to.y))
      const fromState = states.get(connection.from)
      const toState = states.get(connection.to)
      const opacity = connection.phase === 'messy'
        ? Math.min(fromState?.messyLineOpacity ?? 0, toState?.messyLineOpacity ?? 0)
        : Math.min(fromState?.resolvedLineOpacity ?? 0, toState?.resolvedLineOpacity ?? 0)
      line.style.opacity = String(opacity)
    }

    const systemPosition = positions.get('system')
    const systemState = states.get('system')
    if (processTail && systemPosition) {
      processTail.setAttribute('x1', String(systemPosition.x))
      processTail.setAttribute('y1', String(systemPosition.y))
      processTail.setAttribute('x2', String(systemPosition.x))
      processTail.setAttribute('y2', '100')
      processTail.style.opacity = String(systemState?.resolvedLineOpacity ?? 0)
    }
  }

  const onEmphasisIn = (event: Event) => {
    const target = (event.target as { closest?: (selector: string) => Element | null } | null)
      ?.closest?.('[data-artifact]') as HTMLElement | null
    if (target) target.dataset.emphasized = 'true'
  }

  const onEmphasisOut = (event: Event) => {
    const target = (event.target as { closest?: (selector: string) => Element | null } | null)
      ?.closest?.('[data-artifact]') as HTMLElement | null
    if (target) delete target.dataset.emphasized
  }

  const resizeObserver = new ResizeObserver(() => {
    measure()
    updateScroll()
  })
  resizeObserver.observe(scene)

  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true
    if (visible) requestFrame()
    else frame = pauseWorkflowFrame(frame, cancelAnimationFrame)
  })
  intersectionObserver.observe(stage)

  addEventListener('scroll', updateScroll, { passive: true })
  root.addEventListener('focusin', onEmphasisIn)
  root.addEventListener('focusout', onEmphasisOut)
  root.addEventListener('pointerover', onEmphasisIn)
  root.addEventListener('pointerout', onEmphasisOut)

  measure()
  root.dataset.ready = 'true'
  root.dataset.enhanced = 'true'
  updateScroll()

  return () => {
    frame = pauseWorkflowFrame(frame, cancelAnimationFrame)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    removeEventListener('scroll', updateScroll)
    root.removeEventListener('focusin', onEmphasisIn)
    root.removeEventListener('focusout', onEmphasisOut)
    root.removeEventListener('pointerover', onEmphasisIn)
    root.removeEventListener('pointerout', onEmphasisOut)
    delete root.dataset.ready
    delete root.dataset.enhanced
  }
}
