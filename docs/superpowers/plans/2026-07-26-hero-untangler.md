# Interactive “Untangler” Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the reactive dot grid with an editorial workflow scene that locally resolves around pointer interaction and globally resolves during normal scrolling.

**Architecture:** A framework-free Astro component renders eight semantic workflow fragments above an SVG connection layer. Pure TypeScript modules own workflow data and interpolation/spring math; a focused controller combines authoritative scroll progress with temporary pointer and drag offsets. The server-rendered default is the resolved workflow, so reduced motion and script failure remain meaningful.

**Tech Stack:** Astro 4, strict TypeScript, semantic HTML, SVG, CSS transforms, Pointer Events, `requestAnimationFrame`, ResizeObserver, IntersectionObserver, Vitest.

**Approved spec:** `docs/superpowers/specs/2026-07-26-hero-untangler-design.md`

**Recommended execution profile:** `gpt-5.6-sol` with `high` reasoning for implementation and review. The feature combines animation architecture, interaction edge cases, responsive composition, and visual judgment; use `gpt-5.6-terra` with `high` reasoning only when cost is more important than the final polish.

## Required execution skills

Use these skills in this order:

1. `using-git-worktrees` before changing implementation files.
2. `test-driven-development` for Tasks 1–3.
3. `impeccable` and `frontend-ui-engineering` before editing the rendered hero. The Impeccable flow must load `reference/craft-floor.md` immediately before the first UI edit.
4. `emil-design-eng` while tuning drag, spring, and scroll motion.
5. `systematic-debugging` before attempting fixes for any unexpected test, build, runtime, or visual behavior.
6. `verification-before-completion` before claiming the feature is complete.
7. `requesting-code-review` after all verification passes.
8. `finishing-a-development-branch` after review fixes are complete.

## Global Constraints

- Preserve the current `AVP Software` title, tagline, navigation, Process link, monochrome palette, Bodoni Moda display face, and Geist body face.
- The hero demonstrates `Request → Check details → Approval → Sync systems → Done`; it does not turn into `Map → Design → Build → Run`.
- Render exactly eight fragments; manual artifacts recede rather than becoming extra resolved steps.
- No React island, canvas, node-editor package, general-purpose physics engine, scroll hijacking, autonomous idle motion, correct/incorrect drop targets, persisted layout, or user-authored nodes.
- Scroll progress is the authoritative state. Pointer proximity, tap, and drag add temporary local influence and must settle back to the scroll state.
- Touch drag is disabled. Touch tap may trigger local resolution; scroll remains the primary touch experience.
- With `prefers-reduced-motion: reduce`, render the resolved workflow statically and run no scroll interpolation, spring, or pointer animation.
- Without JavaScript, the title, tagline, navigation, Process link, and static resolved workflow remain visible and usable.
- Animate only transforms, opacity, and SVG line endpoints. Do not perform layout reads inside the animation loop.
- Preserve unrelated working-tree changes. In particular, do not stage `.gitignore`, `.agents/`, `.claude/`, `.codex/`, or `.superpowers/`.
- Use commit author `VanPetegem <arthur.s7@gmx.de>` to match the project’s existing plan convention.

## File structure

- Create `src/components/hero-workflow/workflow-model.ts`: fragment and connection definitions plus responsive layout selection.
- Create `src/components/hero-workflow/workflow-motion.ts`: pure interpolation, proximity, scroll-progress, and spring functions.
- Create `src/components/hero-workflow/workflow-controller.ts`: DOM lifecycle, pointer/tap/drag handling, scroll composition, SVG updates, and cleanup.
- Create `src/components/HeroWorkflow.astro`: server-rendered workflow markup, component styles, and controller initialization.
- Create `tests/hero-workflow/workflow-model.test.ts`: data-integrity and resolved-sequence tests.
- Create `tests/hero-workflow/workflow-motion.test.ts`: pure motion and geometry tests.
- Modify `src/pages/index.astro`: replace `HeroDots`, add the extended sticky hero stage, and preserve existing copy/link behavior.
- Modify `package.json` and `package-lock.json`: add Vitest and test scripts.
- Modify `DESIGN.md`: replace the obsolete dot-grid section with the implemented Untangler behavior.
- Delete `src/components/HeroDots.astro`: remove the superseded canvas component.

---

### Task 1: Test harness and pure motion primitives

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/hero-workflow/workflow-motion.ts`
- Create: `tests/hero-workflow/workflow-motion.test.ts`

**Interfaces:**
- Produces: `Point`, `Pose`, `SpringState`, `clamp01`, `smoothstep01`, `interpolatePose`, `proximityProgress`, `scrollProgress`, and `stepSpring`.
- Consumes: no browser globals; every export must remain directly testable in Node.

- [ ] **Step 1: Install the test runner and add scripts**

Run:

```bash
npm install --save-dev vitest
```

Add these scripts to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Expected: `vitest` appears in `devDependencies`, `package-lock.json` updates,
and `npm test -- --help` exits 0.

- [ ] **Step 2: Write the failing motion tests**

Create `tests/hero-workflow/workflow-motion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  clamp01,
  interpolatePose,
  proximityProgress,
  scrollProgress,
  stepSpring,
} from '../../src/components/hero-workflow/workflow-motion'

describe('workflow motion', () => {
  it('clamps values to normalized progress', () => {
    expect(clamp01(-0.25)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(1.25)).toBe(1)
  })

  it('interpolates position, rotation, and opacity', () => {
    expect(
      interpolatePose(
        { x: 10, y: 20, rotation: -8, opacity: 1 },
        { x: 50, y: 60, rotation: 0, opacity: 0 },
        0.5,
      ),
    ).toEqual({ x: 30, y: 40, rotation: -4, opacity: 0.5 })
  })

  it('creates a smooth local influence inside the radius', () => {
    expect(proximityProgress({ x: 0, y: 0 }, { x: 0, y: 0 }, 200)).toBe(1)
    expect(proximityProgress({ x: 200, y: 0 }, { x: 0, y: 0 }, 200)).toBe(0)
    expect(proximityProgress({ x: 100, y: 0 }, { x: 0, y: 0 }, 200)).toBeCloseTo(0.5)
  })

  it('maps the sticky travel distance to scroll progress', () => {
    expect(scrollProgress(0, 1080, 1350)).toBe(0)
    expect(scrollProgress(-135, 1080, 1350)).toBeCloseTo(0.5)
    expect(scrollProgress(-270, 1080, 1350)).toBe(1)
  })

  it('advances an offset spring toward rest without overshooting wildly', () => {
    const next = stepSpring(
      { value: 80, velocity: 0 },
      0,
      1 / 60,
      { stiffness: 180, damping: 24 },
    )
    expect(next.value).toBeLessThan(80)
    expect(next.value).toBeGreaterThan(0)
    expect(next.velocity).toBeLessThan(0)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run:

```bash
npm test -- tests/hero-workflow/workflow-motion.test.ts
```

Expected: FAIL because
`src/components/hero-workflow/workflow-motion.ts` does not exist.

- [ ] **Step 4: Implement the pure motion module**

Create `src/components/hero-workflow/workflow-motion.ts`:

```ts
export type Point = { x: number; y: number }

export type Pose = Point & {
  rotation: number
  opacity: number
}

export type SpringState = {
  value: number
  velocity: number
}

export type SpringConfig = {
  stiffness: number
  damping: number
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function smoothstep01(value: number) {
  const n = clamp01(value)
  return n * n * (3 - 2 * n)
}

export function interpolatePose(from: Pose, to: Pose, progress: number): Pose {
  const n = smoothstep01(progress)
  const mix = (start: number, end: number) => start + (end - start) * n

  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    rotation: mix(from.rotation, to.rotation),
    opacity: mix(from.opacity, to.opacity),
  }
}

export function proximityProgress(point: Point, pointer: Point, radius: number) {
  if (radius <= 0) return 0
  const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y)
  return smoothstep01(1 - distance / radius)
}

export function scrollProgress(
  stageTop: number,
  viewportHeight: number,
  stageHeight: number,
) {
  const travel = Math.max(1, stageHeight - viewportHeight)
  return clamp01(-stageTop / travel)
}

export function stepSpring(
  state: SpringState,
  target: number,
  deltaSeconds: number,
  config: SpringConfig,
): SpringState {
  const dt = Math.min(deltaSeconds, 1 / 30)
  const acceleration =
    (target - state.value) * config.stiffness -
    state.velocity * config.damping
  const velocity = state.velocity + acceleration * dt

  return {
    value: state.value + velocity * dt,
    velocity,
  }
}
```

- [ ] **Step 5: Run the motion tests**

Run:

```bash
npm test -- tests/hero-workflow/workflow-motion.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 6: Commit the test foundation**

```bash
git add package.json package-lock.json \
  src/components/hero-workflow/workflow-motion.ts \
  tests/hero-workflow/workflow-motion.test.ts
git commit --author="VanPetegem <arthur.s7@gmx.de>" \
  -m "test: add hero workflow motion primitives"
```

---

### Task 2: Workflow content and responsive geometry

**Files:**
- Create: `src/components/hero-workflow/workflow-model.ts`
- Create: `tests/hero-workflow/workflow-model.test.ts`

**Interfaces:**
- Consumes: `Pose` from `workflow-motion.ts`.
- Produces: `LayoutMode`, `FragmentDefinition`, `ConnectionDefinition`,
  `fragments`, `connections`, and `layoutModeForWidth(width)`.
- `FragmentDefinition.id` is the stable key used by markup, controller state,
  and SVG connections.

- [ ] **Step 1: Write the failing model tests**

Create `tests/hero-workflow/workflow-model.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  connections,
  fragments,
  layoutModeForWidth,
} from '../../src/components/hero-workflow/workflow-model'

describe('workflow model', () => {
  it('contains the approved eight fragments', () => {
    expect(fragments).toHaveLength(8)
    expect(fragments.map((item) => item.messyLabel)).toEqual([
      'Email request',
      'Missing details',
      'Spreadsheet',
      'Copy/paste',
      'Approval?',
      'Reminder',
      'Accounting system',
      'Done',
    ])
  })

  it('resolves to the approved five-step client workflow', () => {
    expect(
      fragments
        .filter((item) => item.resolved.wide.opacity === 1)
        .sort((a, b) => a.resolved.wide.x - b.resolved.wide.x)
        .map((item) => item.resolvedLabel),
    ).toEqual([
      'Request',
      'Check details',
      'Approval',
      'Sync systems',
      'Done',
    ])
  })

  it('references valid fragment ids in every connection', () => {
    const ids = new Set(fragments.map((item) => item.id))
    for (const connection of connections) {
      expect(ids.has(connection.from)).toBe(true)
      expect(ids.has(connection.to)).toBe(true)
    }
  })

  it('uses the compact layout below 768px', () => {
    expect(layoutModeForWidth(767)).toBe('compact')
    expect(layoutModeForWidth(768)).toBe('wide')
  })
})
```

- [ ] **Step 2: Run the model tests to verify they fail**

Run:

```bash
npm test -- tests/hero-workflow/workflow-model.test.ts
```

Expected: FAIL because
`src/components/hero-workflow/workflow-model.ts` does not exist.

- [ ] **Step 3: Implement the workflow model**

Create `src/components/hero-workflow/workflow-model.ts`:

```ts
import type { Pose } from './workflow-motion'

export type LayoutMode = 'wide' | 'compact'

export type ResponsivePose = {
  wide: Pose
  compact: Pose
}

export type FragmentDefinition = {
  id: string
  messyLabel: string
  resolvedLabel: string
  messy: ResponsivePose
  resolved: ResponsivePose
}

export type ConnectionDefinition = {
  id: string
  from: string
  to: string
  state: 'messy' | 'resolved'
}

const pose = (
  x: number,
  y: number,
  rotation: number,
  opacity = 1,
): Pose => ({ x, y, rotation, opacity })

export const fragments: FragmentDefinition[] = [
  {
    id: 'request',
    messyLabel: 'Email request',
    resolvedLabel: 'Request',
    messy: {
      wide: pose(58, 13, -6),
      compact: pose(18, 10, -5),
    },
    resolved: {
      wide: pose(42, 34, 0),
      compact: pose(20, 10, 0),
    },
  },
  {
    id: 'details',
    messyLabel: 'Missing details',
    resolvedLabel: 'Check details',
    messy: {
      wide: pose(77, 17, 5),
      compact: pose(61, 15, 4),
    },
    resolved: {
      wide: pose(54, 34, 0),
      compact: pose(58, 19, 0),
    },
  },
  {
    id: 'sheet',
    messyLabel: 'Spreadsheet',
    resolvedLabel: 'Spreadsheet',
    messy: {
      wide: pose(68, 32, -3),
      compact: pose(27, 26, -4),
    },
    resolved: {
      wide: pose(58, 34, 0, 0),
      compact: pose(40, 24, 0, 0),
    },
  },
  {
    id: 'copy',
    messyLabel: 'Copy/paste',
    resolvedLabel: 'Copy/paste',
    messy: {
      wide: pose(86, 39, 7),
      compact: pose(68, 31, 5),
    },
    resolved: {
      wide: pose(63, 34, 0, 0),
      compact: pose(40, 28, 0, 0),
    },
  },
  {
    id: 'approval',
    messyLabel: 'Approval?',
    resolvedLabel: 'Approval',
    messy: {
      wide: pose(55, 48, 4),
      compact: pose(17, 43, 4),
    },
    resolved: {
      wide: pose(66, 34, 0),
      compact: pose(20, 31, 0),
    },
  },
  {
    id: 'reminder',
    messyLabel: 'Reminder',
    resolvedLabel: 'Reminder',
    messy: {
      wide: pose(78, 54, -7),
      compact: pose(65, 49, -6),
    },
    resolved: {
      wide: pose(70, 34, 0, 0),
      compact: pose(40, 36, 0, 0),
    },
  },
  {
    id: 'sync',
    messyLabel: 'Accounting system',
    resolvedLabel: 'Sync systems',
    messy: {
      wide: pose(88, 66, 3),
      compact: pose(25, 60, 3),
    },
    resolved: {
      wide: pose(78, 34, 0),
      compact: pose(58, 43, 0),
    },
  },
  {
    id: 'done',
    messyLabel: 'Done',
    resolvedLabel: 'Done',
    messy: {
      wide: pose(65, 70, -4),
      compact: pose(65, 65, -3),
    },
    resolved: {
      wide: pose(89, 34, 0),
      compact: pose(20, 55, 0),
    },
  },
]

export const connections: ConnectionDefinition[] = [
  { id: 'm-request-sheet', from: 'request', to: 'sheet', state: 'messy' },
  { id: 'm-sheet-copy', from: 'sheet', to: 'copy', state: 'messy' },
  { id: 'm-copy-details', from: 'copy', to: 'details', state: 'messy' },
  { id: 'm-details-approval', from: 'details', to: 'approval', state: 'messy' },
  { id: 'm-approval-reminder', from: 'approval', to: 'reminder', state: 'messy' },
  { id: 'm-reminder-sync', from: 'reminder', to: 'sync', state: 'messy' },
  { id: 'm-sync-done', from: 'sync', to: 'done', state: 'messy' },
  { id: 'r-request-details', from: 'request', to: 'details', state: 'resolved' },
  { id: 'r-details-approval', from: 'details', to: 'approval', state: 'resolved' },
  { id: 'r-approval-sync', from: 'approval', to: 'sync', state: 'resolved' },
  { id: 'r-sync-done', from: 'sync', to: 'done', state: 'resolved' },
]

export function layoutModeForWidth(width: number): LayoutMode {
  return width < 768 ? 'compact' : 'wide'
}
```

- [ ] **Step 4: Run the focused tests and full suite**

Run:

```bash
npm test -- tests/hero-workflow/workflow-model.test.ts
npm test
```

Expected: 4 model tests pass; full suite reports 9 passing tests.

- [ ] **Step 5: Commit the workflow model**

```bash
git add src/components/hero-workflow/workflow-model.ts \
  tests/hero-workflow/workflow-model.test.ts
git commit --author="VanPetegem <arthur.s7@gmx.de>" \
  -m "feat: define untangler workflow model"
```

---

### Task 3: Interaction controller

**Files:**
- Create: `src/components/hero-workflow/workflow-controller.ts`
- Modify: `tests/hero-workflow/workflow-motion.test.ts`

**Interfaces:**
- Consumes: `fragments`, `connections`, `layoutModeForWidth`, and all pure
  helpers from Tasks 1–2.
- Produces: `setupWorkflow(root: HTMLElement): () => void`; the returned
  function removes listeners, observers, and animation frames.
- Expects root descendants with `[data-workflow-stage]`, `[data-workflow-scene]`,
  `[data-fragment="<id>"]`, and `[data-connection="<id>"]`.

- [ ] **Step 1: Add failing composition tests**

Add `composedProgress` to the existing import from
`workflow-motion`, then append:

```ts

describe('composed workflow progress', () => {
  it('lets global scroll progress remain authoritative', () => {
    expect(composedProgress(0.7, 0.2)).toBe(0.7)
  })

  it('lets local interaction temporarily reveal more clarity', () => {
    expect(composedProgress(0.2, 0.8)).toBe(0.8)
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- tests/hero-workflow/workflow-motion.test.ts
```

Expected: FAIL because `composedProgress` is not exported.

- [ ] **Step 3: Add the minimal composition helper**

Append to `src/components/hero-workflow/workflow-motion.ts`:

```ts
export function composedProgress(scroll: number, local: number) {
  return Math.max(clamp01(scroll), clamp01(local))
}
```

- [ ] **Step 4: Run the motion tests**

Run:

```bash
npm test -- tests/hero-workflow/workflow-motion.test.ts
```

Expected: 7 motion tests pass.

- [ ] **Step 5: Implement `setupWorkflow`**

Create `src/components/hero-workflow/workflow-controller.ts` with these
concrete responsibilities:

```ts
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
  center: Point
  resolve: SpringState
  offsetX: SpringState
  offsetY: SpringState
}

const SPRING = { stiffness: 180, damping: 24 }
const POINTER_RADIUS = 220
const TAP_HOLD_MS = 650

export function setupWorkflow(root: HTMLElement) {
  if (root.dataset.ready === 'true') return () => {}
  root.dataset.ready = 'true'

  const stage = root.closest<HTMLElement>('[data-workflow-stage]')
  const scene = root.querySelector<HTMLElement>('[data-workflow-scene]')
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const fineQuery = matchMedia('(pointer: fine)')
  if (!stage || !scene) return () => {}
  if (reducedQuery.matches) {
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
      center: { x: 0, y: 0 },
      resolve: { value: 0, velocity: 0 },
      offsetX: { value: 0, velocity: 0 },
      offsetY: { value: 0, velocity: 0 },
    })
  }

  const pointer: Point = { x: -10_000, y: -10_000 }
  let scrollValue = 1
  let tapUntil = 0
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

    for (const definition of fragments) {
      const item = runtime.get(definition.id)
      if (!item) continue

      const localTarget =
        now < tapUntil
          ? 0.82
          : proximityProgress(item.center, pointer, POINTER_RADIUS)
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
      item.element.style.setProperty('--resolve-progress', String(progress))
      item.element.dataset.state = progress > 0.55 ? 'resolved' : 'messy'
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
    if (!target) {
      if (!fineQuery.matches) {
        tapUntil = performance.now() + TAP_HOLD_MS
        requestFrame()
      }
      return
    }

    if (!fineQuery.matches) {
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
    dragId = null
    requestFrame()
  }

  const onPointerLeave = () => {
    if (dragId) return
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
    else cancelAnimationFrame(frame)
  })
  intersectionObserver.observe(stage)

  const onReducedChange = () => {
    root.dataset.reducedMotion = String(reducedQuery.matches)
    if (reducedQuery.matches) cancelAnimationFrame(frame)
    else requestFrame()
  }

  addEventListener('scroll', updateScroll, { passive: true })
  scene.addEventListener('pointermove', onPointerMove)
  scene.addEventListener('pointerdown', onPointerDown)
  scene.addEventListener('pointerup', endDrag)
  scene.addEventListener('pointercancel', endDrag)
  scene.addEventListener('pointerleave', onPointerLeave)
  reducedQuery.addEventListener('change', onReducedChange)

  root.dataset.enhanced = 'true'
  measure()
  updateScroll()
  onReducedChange()

  return () => {
    cancelAnimationFrame(frame)
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
```

- [ ] **Step 6: Type-check and run the suite**

Run:

```bash
npm test
npm run build
```

Expected: 11 tests pass and the Astro build exits 0.

- [ ] **Step 7: Commit the controller**

```bash
git add src/components/hero-workflow/workflow-motion.ts \
  src/components/hero-workflow/workflow-controller.ts \
  tests/hero-workflow/workflow-motion.test.ts
git commit --author="VanPetegem <arthur.s7@gmx.de>" \
  -m "feat: add untangler interaction controller"
```

---

### Task 4: Workflow component and hero integration

**Files:**
- Create: `src/components/HeroWorkflow.astro`
- Modify: `src/pages/index.astro:2-79`
- Modify: `src/pages/index.astro:194-272`
- Delete: `src/components/HeroDots.astro`

**Interfaces:**
- Consumes: `fragments`, `connections`, and
  `setupWorkflow(root: HTMLElement): () => void`.
- Produces: `<HeroWorkflow />`, which fills its positioned hero scene and
  server-renders the resolved state.
- Keeps: the existing `.hero-content`, `.hero-title`, `.hero-tagline`,
  `.hero-scroll`, and `#process` contract.

- [ ] **Step 1: Create a deliberate failing integration**

In `src/pages/index.astro`, replace:

```astro
import HeroDots from '../components/HeroDots.astro'
```

with:

```astro
import HeroWorkflow from '../components/HeroWorkflow.astro'
```

Replace `<HeroDots />` with `<HeroWorkflow />`.

Run:

```bash
npm run build
```

Expected: FAIL because `src/components/HeroWorkflow.astro` does not exist.

- [ ] **Step 2: Create the semantic component markup**

Create `src/components/HeroWorkflow.astro`:

```astro
---
import {
  connections,
  fragments,
} from './hero-workflow/workflow-model'

const resolvedSteps = fragments
  .filter((fragment) => fragment.resolved.wide.opacity === 1)
  .sort((a, b) => a.resolved.wide.x - b.resolved.wide.x)
---

<div class="workflow" data-workflow-root>
  <ol class="workflow-fallback" aria-label="A clear client workflow">
    {resolvedSteps.map((fragment) => (
      <li>{fragment.resolvedLabel}</li>
    ))}
  </ol>

  <div class="workflow-scene" data-workflow-scene aria-hidden="true">
    <svg class="workflow-lines" aria-hidden="true">
      {connections.map((connection) => (
        <line
          data-connection={connection.id}
          data-connection-state={connection.state}
        />
      ))}
      <line data-process-tail />
    </svg>

    <ol class="workflow-fragments">
      {fragments.map((fragment) => (
        <li
          class="workflow-fragment"
          data-fragment={fragment.id}
          data-state="resolved"
        >
          <span class="workflow-label workflow-label--messy">
            {fragment.messyLabel}
          </span>
          <span class="workflow-label workflow-label--resolved">
            {fragment.resolvedLabel}
          </span>
        </li>
      ))}
    </ol>
  </div>
</div>

<script>
  import { setupWorkflow } from './hero-workflow/workflow-controller'

  const cleanups = new WeakMap<HTMLElement, () => void>()

  function armWorkflow() {
    document
      .querySelectorAll<HTMLElement>('[data-workflow-root]')
      .forEach((root) => {
        cleanups.get(root)?.()
        cleanups.set(root, setupWorkflow(root))
      })
  }

  armWorkflow()
  document.addEventListener('astro:page-load', armWorkflow)
</script>
```

- [ ] **Step 3: Add the component styling**

In the same component, add a scoped `<style>` implementing these exact states:

```css
.workflow,
.workflow-scene {
  position: absolute;
  inset: 0;
}

.workflow {
  z-index: 1;
  pointer-events: none;
}

.workflow-scene {
  display: none;
  overflow: hidden;
  pointer-events: auto;
  touch-action: pan-y;
}

.workflow[data-enhanced='true'] .workflow-scene {
  display: block;
}

.workflow-fallback {
  position: absolute;
  top: 34%;
  right: 8vw;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  list-style: none;
}

.workflow-fallback li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.workflow-fallback li:not(:last-child)::after {
  content: '→';
  color: var(--color-muted);
}

.workflow[data-enhanced='true'] .workflow-fallback {
  display: none;
}

.workflow-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.workflow-lines line {
  stroke: var(--color-ink);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  opacity: 0;
}

.workflow-lines line[data-connection-state='resolved'] {
  opacity: 0.42;
}

.workflow-fragments {
  list-style: none;
}

.workflow-fragment {
  --resolve-progress: 1;
  position: absolute;
  left: 0;
  top: 0;
  display: grid;
  min-width: max-content;
  padding: 0.55rem 0.7rem;
  border: 1px solid color-mix(in oklch, var(--color-ink) 32%, transparent);
  border-radius: 0.2rem;
  background: color-mix(in oklch, var(--color-bg) 94%, transparent);
  box-shadow: 0 0.35rem 1rem oklch(10% 0.005 260 / 5%);
  font-family: var(--font-body);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.09em;
  line-height: 1;
  text-transform: uppercase;
  cursor: grab;
  user-select: none;
  will-change: transform, opacity;
}

.workflow-fragment[data-dragging='true'] {
  cursor: grabbing;
  border-color: var(--color-ink);
  box-shadow: 0 0.7rem 1.8rem oklch(10% 0.005 260 / 10%);
}

.workflow-label {
  grid-area: 1 / 1;
}

.workflow-label--messy {
  opacity: calc(1 - var(--resolve-progress));
}

.workflow-label--resolved {
  opacity: var(--resolve-progress);
}

@media (pointer: coarse) {
  .workflow-fragment {
    cursor: default;
  }
}

@media (max-width: 767px) {
  .workflow-fallback {
    top: 8%;
    right: auto;
    left: 8vw;
    flex-direction: column;
    align-items: flex-start;
  }

  .workflow-fallback li {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .workflow-fallback li:not(:last-child)::after {
    content: '↓';
  }

  .workflow-scene {
    bottom: 38%;
  }

  .workflow-fragment {
    padding: 0.48rem 0.58rem;
    font-size: 0.625rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workflow-fragment {
    will-change: auto;
  }

  .workflow-scene {
    display: none !important;
  }

  .workflow-fallback {
    display: flex !important;
  }
}
```

Before accepting this CSS, use the Impeccable craft-floor checks to correct
any prohibited pattern and confirm that the fragment treatment remains
editorial rather than resembling an editor node.

- [ ] **Step 4: Add the extended sticky stage without scroll hijacking**

Wrap the existing hero section in `src/pages/index.astro`:

```astro
<div class="hero-stage" data-workflow-stage>
  <section class="hero">
    <HeroWorkflow />
    <!-- unchanged hero-content and hero-scroll -->
  </section>
</div>
```

Replace the current `.hero` sizing rules with:

```css
.hero-stage {
  position: relative;
  min-height: 135dvh;
  background: var(--color-bg);
}

.hero {
  position: sticky;
  top: 0;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--color-bg);
}

.hero-content,
.hero-scroll {
  z-index: 2;
}

@media (max-width: 767px) {
  .hero-stage {
    min-height: 125dvh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-stage {
    min-height: 100dvh;
  }

  .hero {
    position: relative;
  }
}
```

Keep all existing title, tagline, scroll-link, and entrance-animation rules.

- [ ] **Step 5: Verify reduced motion and no-JavaScript defaults**

Run:

```bash
rg -n "reducedQuery.matches|data-workflow-root|workflow-fallback|data-enhanced" \
  src/components/HeroWorkflow.astro \
  src/components/hero-workflow/workflow-controller.ts
```

Expected: the initial reduced-motion branch returns before event listeners are
attached, the fallback sequence is server-rendered, and the interactive scene
is shown only after `data-enhanced="true"` is set.

- [ ] **Step 6: Remove the superseded dot component**

Delete:

```text
src/components/HeroDots.astro
```

Run:

```bash
rg "HeroDots|hero-dots" src
```

Expected: no matches.

- [ ] **Step 7: Test and build**

Run:

```bash
npm test
npm run build
```

Expected: 11 tests pass and Astro builds all pages successfully.

- [ ] **Step 8: Commit the integrated hero**

```bash
git add src/components/HeroWorkflow.astro \
  src/components/hero-workflow/workflow-controller.ts \
  src/pages/index.astro src/components/HeroDots.astro
git commit --author="VanPetegem <arthur.s7@gmx.de>" \
  -m "feat: replace dot grid with untangler hero"
```

---

### Task 5: Visual validation, resilience, and durable documentation

**Files:**
- Modify: `src/components/HeroWorkflow.astro`
- Modify: `src/components/hero-workflow/workflow-controller.ts`
- Modify: `src/components/hero-workflow/workflow-model.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Preserves every public interface from Tasks 1–4.
- Produces the production-ready responsive composition and updated design
  authority.

- [ ] **Step 1: Start the production preview**

Run:

```bash
npm run build
npm run preview
```

Expected: the build exits 0 and preview serves the generated site locally.

- [ ] **Step 2: Inspect the desktop hero at 1440×900**

Verify all of the following:

- Eight fragments are legible in the initial state.
- The title and tagline remain the dominant reading entry.
- No fragment or connection crosses the title or Process link.
- Pointer proximity partially resolves only nearby fragments.
- Pointer down works without a preceding pointer move.
- Dragged connections follow continuously.
- Release motion is interruptible and has no obvious bounce.
- Re-grabbing during settlement preserves continuity.
- Scrolling resolves the full workflow before the Process section takes over.
- The page scrolls normally with trackpad, mouse wheel, keyboard, and scrollbar.

Use the browser’s performance tools to confirm there are no repeated
`getBoundingClientRect()` calls inside a single animation frame and no
continuous animation after the hero leaves the viewport.

- [ ] **Step 3: Inspect compact layouts**

Verify at 768×1024, 390×844, and 320×568:

- The title and tagline preserve their reading order.
- The workflow stays in the upper portion of the hero.
- Labels do not clip or overlap enough to become unreadable.
- Touch scrolling remains native because the scene uses `touch-action: pan-y`.
- A tap produces a brief local response.
- Touch dragging does not move fragments.
- Orientation change recalculates geometry without stale connections.

If a label cannot fit at 320px, shorten only these two display labels:
`Accounting system` → `Accounting` and `Missing details` → `Details missing`.
Do not reduce the type below `0.625rem`.

- [ ] **Step 4: Inspect constrained and failure states**

Verify:

- Emulated `prefers-reduced-motion: reduce` shows the resolved workflow with
  no sticky extension and no animated response.
- Disabling JavaScript leaves the resolved workflow, hero copy, navigation,
  and Process link visible.
- Temporarily forcing `setupWorkflow` to throw does not prevent the rest of
  the page from rendering; restore the code immediately after the check.
- Resizing repeatedly does not duplicate listeners because the Astro
  `astro:page-load` initializer calls the previous cleanup.
- Scrolling away cancels the active frame loop; returning resumes from current
  scroll progress.

- [ ] **Step 5: Update `DESIGN.md`**

Replace the `Hero motion` section with a concise record containing:

```markdown
## Hero interaction (`src/components/HeroWorkflow.astro`)

The hero demonstrates AVP’s core transformation: a scattered manual client
workflow resolves into `Request → Check details → Approval → Sync systems →
Done`.

- Eight semantic HTML fragments sit above an SVG hairline connection layer.
- Normal scroll progress is the authoritative state inside a 135dvh desktop
  stage and 125dvh mobile stage; the viewport scene is sticky without
  capturing or slowing scroll.
- Fine-pointer proximity creates local resolution. Drag adds a temporary
  offset whose release settles through a restrained interruptible spring.
- Touch uses scroll plus a brief tap response; touch drag is disabled.
- Reduced motion and script failure render the resolved system statically.
- Animation is framework-free, pauses off-screen, and restricts per-frame work
  to transforms, opacity, and SVG endpoints.
```

Preserve every unrelated section in `DESIGN.md`.

- [ ] **Step 6: Run final automated verification**

Run:

```bash
npm test
npm run build
rg "HeroDots|hero-dots|ReactFlow|React Flow|Rete|Matter" src package.json
git diff --check
```

Expected:

- 11 tests pass.
- Astro build exits 0.
- The prohibited-library/component search returns no matches.
- `git diff --check` returns no output.

- [ ] **Step 7: Run required review skills**

Invoke `verification-before-completion` and attach the exact outputs from Step
6. Then invoke `requesting-code-review` with:

- Original request
- Approved spec path
- This plan path
- `PRODUCT.md`
- `DESIGN.md`
- Changed file list
- Desktop/mobile screenshots
- Reduced-motion and no-JavaScript observations
- Test/build output

Apply only review findings that are supported by the spec or verified
behavior. Use `systematic-debugging` before changing code for any disputed or
unexpected finding.

- [ ] **Step 8: Commit the validation and documentation pass**

```bash
git add DESIGN.md src/components/HeroWorkflow.astro \
  src/components/hero-workflow/workflow-controller.ts \
  src/components/hero-workflow/workflow-model.ts
git commit --author="VanPetegem <arthur.s7@gmx.de>" \
  -m "polish: validate untangler hero interactions"
```

- [ ] **Step 9: Finish the development branch**

Invoke `finishing-a-development-branch`. Present the verified integration
options without deploying. Deployment remains out of scope unless the user
explicitly requests it.
