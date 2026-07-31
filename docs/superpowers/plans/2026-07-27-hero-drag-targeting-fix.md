# Hero Drag Targeting Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every visible workflow fragment reliably draggable without letting pointer-proximity motion move the intended target out from under the cursor.

**Architecture:** Keep scroll progress authoritative and preserve proximity-driven resolution for neighboring fragments. Track the fragment directly under a fine pointer and hold that fragment at its scroll-defined base pose until drag begins; once dragging, pointer capture owns the gesture and the fragment follows the pointer through its existing temporary offset. Also disable pointer hits for fully receded manual fragments.

**Tech Stack:** Astro 4, strict TypeScript, Pointer Events, requestAnimationFrame, Vitest, existing headless-browser verification.

**Branch and PR:** `feat/hero-untangler`, PR #4  
**Starting commit:** `da8ca5c5570c2a48df78dad30afb03264796636a`  
**Root-cause evidence:** `src/components/hero-workflow/workflow-controller.ts:133-147` applies maximum local resolution to the fragment nearest the pointer. In the independent 1440×900 reproduction, `request` moved from approximately `(772, 95)` to `(679, 174)` as the pointer approached; `pointerdown` then landed on the SVG layer and `data-dragging` was never set.

## Required execution skills

1. Use `executing-plans` because this is one narrow sequential fix.
2. Use `systematic-debugging` to reproduce the failure before editing.
3. Use `test-driven-development` for the targeting policy.
4. Use `frontend-ui-engineering` and `emil-design-eng` for the hover/drag behavior.
5. Use `verification-before-completion` before updating PR #4.
6. Use `requesting-code-review` after all automated and browser checks pass.

## Global Constraints

- Work only in the existing `.worktrees/hero-untangler` worktree on `feat/hero-untangler`.
- Do not merge PR #4 in this session; update the PR branch and leave the merge for a fresh review.
- Preserve the approved scroll transformation, touch tap behavior, touch drag prohibition, reduced-motion fallback, no-JavaScript fallback, copy, layout, and workflow geometry.
- The hovered fine-pointer target must stay under the cursor; neighboring fragments may continue resolving around it.
- The actively dragged fragment must not receive proximity-driven base-pose movement.
- Releasing a drag must keep the existing interruptible spring back to the scroll-defined state.
- Fully transparent receded fragments must not intercept pointer hits.
- Do not add dependencies or change `package.json`/`package-lock.json`.
- Do not edit `HeroWorkflow.astro` beyond the single hover-border rule specified below.
- Preserve unrelated worktree files and do not stage `.superpowers/`.

## File structure

- Modify `src/components/hero-workflow/workflow-controller.ts`: targeting policy, hover identity, drag identity, and receded-fragment pointer events.
- Modify `src/components/HeroWorkflow.astro`: subtle stable hover acknowledgement.
- Modify `tests/hero-workflow/workflow-controller.test.ts`: policy regression coverage.

---

### Task 1: Reproduce and codify the targeting policy

**Files:**
- Modify: `tests/hero-workflow/workflow-controller.test.ts`
- Modify: `src/components/hero-workflow/workflow-controller.ts`

**Interfaces:**
- Produces:
  - `localTargetForFragment(fragmentId, hoverId, dragId, localProgress, tapActive): number`
  - `pointerEventsForOpacity(opacity): 'auto' | 'none'`
- Keeps:
  - `pointerInteraction(pointerType, finePointer): 'tap' | 'drag'`
  - `setupWorkflow(root): () => void`

- [ ] **Step 1: Reproduce the current browser failure**

At 1440×900 and scroll position 0:

1. Load the production preview.
2. Move the pointer slowly to the center of `Email request`.
3. Attempt to press and drag it 70px right and 35px down.
4. Inspect `[data-fragment="request"]`.

Expected before the fix:

- The fragment moves substantially toward its resolved pose before the press.
- The press can land on `.workflow-lines`.
- `data-dragging` is not set.

Record the initial and post-hover bounding boxes in the session notes.

- [ ] **Step 2: Add failing policy tests**

Replace the imports at the top of
`tests/hero-workflow/workflow-controller.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  localTargetForFragment,
  pauseWorkflowFrame,
  pointerEventsForOpacity,
  pointerInteraction,
} from '../../src/components/hero-workflow/workflow-controller'
```

Append:

```ts
describe('workflow fragment targeting policy', () => {
  it('holds the fine-pointer hover target at its scroll-defined pose', () => {
    expect(
      localTargetForFragment('request', 'request', null, 1, false),
    ).toBe(0)
  })

  it('holds the active drag target at its scroll-defined pose', () => {
    expect(
      localTargetForFragment('request', null, 'request', 1, false),
    ).toBe(0)
  })

  it('continues resolving neighboring fragments', () => {
    expect(
      localTargetForFragment('details', 'request', null, 0.7, false),
    ).toBe(0.7)
  })

  it('preserves the localized touch-tap strength', () => {
    expect(
      localTargetForFragment('request', null, null, 0.75, true),
    ).toBeCloseTo(0.615)
  })

  it('removes pointer hits only from fully receded fragments', () => {
    expect(pointerEventsForOpacity(0)).toBe('none')
    expect(pointerEventsForOpacity(0.049)).toBe('none')
    expect(pointerEventsForOpacity(0.05)).toBe('auto')
    expect(pointerEventsForOpacity(1)).toBe('auto')
  })
})
```

- [ ] **Step 3: Run the focused test and confirm RED**

Run:

```bash
npm test -- tests/hero-workflow/workflow-controller.test.ts
```

Expected: FAIL because `localTargetForFragment` and
`pointerEventsForOpacity` are not exported.

- [ ] **Step 4: Add the pure targeting helpers**

Add immediately below `pointerInteraction` in
`src/components/hero-workflow/workflow-controller.ts`:

```ts
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
```

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run:

```bash
npm test -- tests/hero-workflow/workflow-controller.test.ts
```

Expected: 8 tests pass in `workflow-controller.test.ts`.

---

### Task 2: Keep the intended fine-pointer target stable

**Files:**
- Modify: `src/components/hero-workflow/workflow-controller.ts`
- Modify: `src/components/HeroWorkflow.astro`

**Interfaces:**
- Consumes `localTargetForFragment` and `pointerEventsForOpacity` from Task 1.
- Adds private controller state `hoverId: string | null`.
- Does not change the public `setupWorkflow` signature.

- [ ] **Step 1: Track fine-pointer hover identity**

Add beside the existing `dragId` state:

```ts
let hoverId: string | null = null
let dragId: string | null = null
```

At the start of `onPointerMove`, after calculating pointer coordinates, add:

```ts
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
```

This deliberately does not assign `hoverId` for touch input, so a touch tap
still resolves the tapped area.

- [ ] **Step 2: Use the stable-target policy during render**

Replace:

```ts
const localTarget =
  now < tapUntil
    ? localProgress * 0.82
    : localProgress
```

with:

```ts
const localTarget = localTargetForFragment(
  definition.id,
  hoverId,
  dragId,
  localProgress,
  now < tapUntil,
)
```

After setting the fragment opacity, add:

```ts
item.element.style.pointerEvents = pointerEventsForOpacity(pose.opacity)
```

- [ ] **Step 3: Reset hover state at gesture boundaries**

In `endDrag`, immediately before clearing `dragId`, add:

```ts
hoverId = null
```

In `onPointerLeave`, after the drag/tap guard and before resetting pointer
coordinates, add:

```ts
hoverId = null
```

In the cleanup function, no extra listener removal is needed because
`hoverId` is controller-local state.

- [ ] **Step 4: Add a restrained hover acknowledgement**

In `src/components/HeroWorkflow.astro`, immediately before the existing
`[data-dragging='true']` rule, add:

```css
@media (pointer: fine) {
  .workflow-fragment:hover {
    border-color: color-mix(
      in oklch,
      var(--color-ink) 58%,
      transparent
    );
  }
}
```

Do not add transform, scale, shadow, or autonomous motion to the hover state.

- [ ] **Step 5: Run focused and full automated verification**

Run:

```bash
npm test -- tests/hero-workflow/workflow-controller.test.ts
npm test
./node_modules/.bin/tsc --noEmit
npm run build
git diff --check
```

Expected:

- 8 controller tests pass.
- 19 total tests pass.
- TypeScript exits 0 with no output.
- Astro builds 8 pages.
- `git diff --check` returns no output.

---

### Task 3: Browser regression gate and PR update

**Files:**
- Verify only; do not create repository files.

**Interfaces:**
- Validates the complete browser behavior at PR #4 head.

- [ ] **Step 1: Verify desktop proximity and drag at 1440×900**

At scroll position 0:

1. Move slowly onto each of the five visible/essential fragment types,
   starting with `Email request`.
2. Confirm the hovered fragment remains under the pointer.
3. Confirm neighboring fragments still move toward their resolved poses.
4. Press and drag `Email request` 70px right and 35px down.
5. Confirm `data-dragging="true"` appears during the press.
6. Release, move the pointer away, and wait one second.
7. Confirm the fragment settles back within 15px of its pre-drag scroll pose.
8. Re-grab it while settling and confirm the motion remains continuous.

Expected: every drag begins on the intended fragment; no press lands on the
SVG connection layer.

- [ ] **Step 2: Verify resolved-state hit testing**

Scroll to the end of the 135dvh hero stage and inspect the three receded
manual fragments:

- `sheet`
- `copy`
- `reminder`

Expected:

```text
opacity: 0
pointer-events: none
```

The five visible resolved fragments must retain `pointer-events: auto`.

- [ ] **Step 3: Verify unaffected modes**

Verify:

- Touch tap still creates localized resolution.
- Touch drag remains disabled.
- Native vertical touch scrolling still works.
- Reduced motion shows only the static resolved fallback.
- JavaScript disabled shows the static workflow and four-link primary nav.
- The Process link remains usable on desktop and mobile.
- No page errors or console errors occur.

- [ ] **Step 4: Commit the fix**

Run:

```bash
git add \
  src/components/hero-workflow/workflow-controller.ts \
  src/components/HeroWorkflow.astro \
  tests/hero-workflow/workflow-controller.test.ts
git commit --author="Gt-ace <arthur.s7@gmx.de>" \
  -m "fix: stabilize untangler drag targets"
```

- [ ] **Step 5: Run a fresh completion gate after the commit**

Run:

```bash
npm test
./node_modules/.bin/tsc --noEmit
npm run build
git diff --check HEAD^..HEAD
git status --short
```

Expected:

- 19 tests pass.
- TypeScript exits 0.
- Astro builds 8 pages.
- The committed diff is whitespace-clean.
- The worktree contains no uncommitted implementation changes.

- [ ] **Step 6: Push the existing PR branch**

Run:

```bash
git push origin feat/hero-untangler
gh pr view 4 --json state,headRefOid,mergeable,mergeStateStatus,url
```

Expected:

- Push succeeds without force.
- PR #4 remains open.
- `headRefOid` matches the new local `HEAD`.
- `mergeable` is `MERGEABLE` and `mergeStateStatus` is not `DIRTY`.

- [ ] **Step 7: Hand off for fresh review**

Report:

- New commit SHA
- 19/19 test result
- TypeScript/build results
- Desktop drag reproduction before and after
- Touch/reduced-motion/no-JavaScript results
- PR #4 URL

Do not merge; request a fresh reviewer to repeat the drag gate and merge only
after it passes.
