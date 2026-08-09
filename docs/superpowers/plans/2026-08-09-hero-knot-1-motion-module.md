# Hero Knot Phase 1: Motion Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure, Three.js-free motion module that will drive the hero wireframe knot, fully unit tested, and land the `three@0.185.1` dependency with its lockfile.

**Architecture:** All interaction policy for the hero knot lives in one plain ESM module of pure functions with no imports and no DOM access: rotation targeting, damping, convergence, segment density, placement, and the render gate. The Three.js scene code in later phases consumes these functions and holds no policy of its own. This mirrors `src/scripts/bigtype-motion.mjs`, tested by `tests/bigtype-motion.test.mjs` under the Node test runner.

**Tech Stack:** Plain ESM (`.mjs`), Node built-in test runner (`node --test`), Astro 4 project, npm.

## Global Constraints

- Design authority: `docs/superpowers/specs/2026-08-09-hero-wireframe-knot-design.md`. The prototype at `docs/superpowers/specs/2026-08-09-hero-wireframe-knot-prototype.html` is reference material only; do not copy its structure.
- Work on branch `feat/hero-wireframe-knot`.
- `three@0.185.1` is already present in `package.json` and `package-lock.json` as **uncommitted** working-tree changes. Both files MUST be committed in this phase, together, in Task 1. The Dockerfile builder runs `npm ci`; a `package.json` without a matching lockfile entry breaks the deploy. Do not skip this because phase 1 does not import `three`.
- This phase adds **no** Three.js import anywhere in `src/`. The module under `src/scripts/` must have zero imports.
- Test runner for this file is the Node built-in runner, not Vitest: top-level `tests/` directory, `.mjs` extension, `node:test` and `node:assert/strict`. `npm test` runs `node --test tests/*.test.mjs` first, and the Vitest stage explicitly excludes `**/*.test.mjs`. Do not put this test in a subdirectory and do not write it as a `.ts` Vitest file.
- No changes to `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, or any component in this phase. This phase produces no visual change to the site.
- No React, no GSAP, no Lenis usage in this feature at any phase.
- Values below are copied verbatim from the spec and are not to be tuned: base pose `(0.4, 0.6)`, cursor coefficients `0.35` (x) and `0.5` (y), scroll coefficient `1.2`, scroll denominator factor `0.8`, damping factor `0.06`, desktop segments `(220, 32)`, mobile segments `(120, 20)`, wide placement `x = 1.6, y = 0.2, cameraZ = 7.5`, narrow breakpoint `768`.

---

## File Structure

- Modify `package.json` and `package-lock.json`: commit the already-installed `three@0.185.1` entries. No other dependency changes.
- Create `src/scripts/hero-knot-motion.mjs`: every pure function the hero knot needs. No imports, no DOM, no Three.js types. Single responsibility: interaction policy as arithmetic.
- Create `tests/hero-knot-motion.test.mjs`: Node-test-runner coverage of that module, including the clamp boundary and the placement switch.

One module and one test file is the right granularity here: the functions are small, share the same constants, and are always consumed together by one caller. Splitting them across files would spread six related constants over six modules.

---

## Contract decisions locked for this phase

Later phases depend on these exact semantics. They resolve ambiguities in the spec prose; implement them literally.

1. **`calculateRotationTarget` returns absolute rotation, base pose included.** The caller assigns its return value straight to `mesh.rotation.x` / `mesh.rotation.y`. It does not return offsets.
2. **The clamp is on the summed y *offset*, upper bound only.** `yOffset = min(pointerX * 0.5 + scrollProgress * 1.2, 1.2)`, then `y = basePose.y + yOffset`. There is no lower clamp: the prototype could reach `base.y - 0.5` from cursor alone, and that stays reachable. Absolute y therefore lives in `[0.1, 1.8]` with the default base pose.
3. **x is unclamped.** `x = basePose.x + pointerY * 0.35`, range `[0.05, 0.75]`.
4. **Scroll progress is normalized by this module, not by the caller.** `getScrollProgress(scrollY, viewportHeight)` owns both the `0.8` denominator factor and the ceiling at `1`. The module still never *reads* `scrollY` or `innerHeight` itself; phase 3 passes both in. This keeps the clamp testable rather than buried in untested scene code.
5. **`shouldRender` returns the string `'animated'` or `'none'`.** There is deliberately no static-frame state.

---

### Task 1: Land the Three.js dependency

**Files:**
- Modify: `package.json` (already contains the `three` entry as an uncommitted change)
- Modify: `package-lock.json` (already contains the matching tree as an uncommitted change)

**Interfaces:**
- Consumes: nothing.
- Produces: a committed `three@^0.185.1` dependency that phase 2's dynamic `import('three')` resolves against, and a lockfile that `npm ci` can install.

- [ ] **Step 1: Confirm both files carry the dependency**

Run:

```bash
git diff --stat package.json package-lock.json
grep -n '"three"' package.json
```

Expected: `git diff --stat` lists **both** `package.json` and `package-lock.json` as modified, and `grep` prints a line containing `"three": "^0.185.1"`.

If `package-lock.json` is not listed as modified, the lockfile was never updated. Run `npm install three@0.185.1` and re-run the check before continuing. Do not proceed with only `package.json` modified.

- [ ] **Step 2: Verify a clean install works from the lockfile alone**

Run:

```bash
npm ci
```

Expected: completes without error. This is the exact command the Dockerfile builder runs; if it fails here, the deploy would fail.

- [ ] **Step 3: Record the baseline commit and verify the suite is green before any new code**

Run:

```bash
git rev-parse HEAD
npm run build && npm test
```

Expected: both commands succeed. Write the printed SHA into the acceptance section below as `<baseline>`; the branch already carries commits ahead of `main` (the spec doc and `.codex`), so `main...HEAD` is not a valid scope check for this phase. The green build establishes that any later failure is attributable to this phase's new code.

- [ ] **Step 4: Commit both files together**

```bash
git add package.json package-lock.json
git commit -m "chore: add three@0.185.1 for the hero knot

Lockfile committed alongside package.json because the Dockerfile
builder runs npm ci."
```

---

### Task 2: Rotation targeting, damping, and convergence

**Files:**
- Create: `src/scripts/hero-knot-motion.mjs`
- Create: `tests/hero-knot-motion.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces, all named exports of `src/scripts/hero-knot-motion.mjs`:
  - `BASE_POSE` — frozen object `{ x: 0.4, y: 0.6 }`
  - `DAMPING_FACTOR` — number `0.06`
  - `CONVERGENCE_EPSILON` — number `0.0005`
  - `calculateRotationTarget(pointerX, pointerY, scrollProgress, basePose = BASE_POSE)` → `{ x: number, y: number }`, absolute rotation in radians
  - `dampToward(current, target, factor = DAMPING_FACTOR)` → `number`
  - `isConverged(current, target, epsilon = CONVERGENCE_EPSILON)` → `boolean`

Phase 3 calls `calculateRotationTarget` on every pointer and scroll event, `dampToward` twice per frame, and `isConverged` on both axes to decide whether to stop the loop.

- [ ] **Step 1: Write the failing tests**

Create `tests/hero-knot-motion.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BASE_POSE,
  CONVERGENCE_EPSILON,
  DAMPING_FACTOR,
  calculateRotationTarget,
  dampToward,
  isConverged,
} from '../src/scripts/hero-knot-motion.mjs'

const close = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${message}: expected ${expected}, got ${actual}`
  )

test('neutral input holds the base pose', () => {
  const target = calculateRotationTarget(0, 0, 0)

  close(target.x, BASE_POSE.x, 'x')
  close(target.y, BASE_POSE.y, 'y')
})

test('cursor axes cross so the knot turns toward the pointer', () => {
  const target = calculateRotationTarget(1, 1, 0)

  close(target.x, BASE_POSE.x + 0.35, 'vertical cursor drives x')
  close(target.y, BASE_POSE.y + 0.5, 'horizontal cursor drives y')
})

test('negative cursor positions move the pose the other way', () => {
  const target = calculateRotationTarget(-1, -1, 0)

  close(target.x, BASE_POSE.x - 0.35, 'x')
  close(target.y, BASE_POSE.y - 0.5, 'y')
})

test('scroll alone reaches the full 1.2 rad y offset', () => {
  const target = calculateRotationTarget(0, 0, 1)

  close(target.y, BASE_POSE.y + 1.2, 'y')
  close(target.x, BASE_POSE.x, 'scroll does not touch x')
})

test('cursor and scroll sum rather than overwrite each other', () => {
  const target = calculateRotationTarget(0.5, 0, 0.25)

  close(target.y, BASE_POSE.y + 0.5 * 0.5 + 0.25 * 1.2, 'summed y offset')
})

test('the summed y offset is clamped at +1.2 rad', () => {
  const target = calculateRotationTarget(1, 0, 1)

  close(target.y, BASE_POSE.y + 1.2, 'clamped y')
})

test('the clamp is an upper bound only, so cursor can still pull y down', () => {
  const target = calculateRotationTarget(-1, 0, 0)

  close(target.y, BASE_POSE.y - 0.5, 'y below base is allowed')
})

test('x is not clamped by the y bound', () => {
  const target = calculateRotationTarget(1, 1, 1)

  close(target.x, BASE_POSE.x + 0.35, 'x')
  close(target.y, BASE_POSE.y + 1.2, 'y')
})

test('an explicit base pose overrides the default', () => {
  const target = calculateRotationTarget(0, 0, 0, { x: 1, y: 2 })

  close(target.x, 1, 'x')
  close(target.y, 2, 'y')
})

test('damping moves a fraction of the remaining distance', () => {
  close(dampToward(0, 1), DAMPING_FACTOR, 'one step')
  close(dampToward(1, 1), 1, 'no distance left')
  close(dampToward(2, 1), 2 - DAMPING_FACTOR, 'approaches from above')
})

test('damping converges without overshooting', () => {
  let current = 0
  for (let i = 0; i < 500; i += 1) current = dampToward(current, 1)

  assert.ok(current <= 1, 'never overshoots the target')
  assert.ok(isConverged(current, 1), 'settles within epsilon')
})

test('convergence is decided by the epsilon threshold', () => {
  assert.equal(isConverged(1, 1), true)
  assert.equal(isConverged(1, 1 + CONVERGENCE_EPSILON / 2), true)
  assert.equal(isConverged(1, 1 + CONVERGENCE_EPSILON * 2), false)
  assert.equal(isConverged(1, 1 - CONVERGENCE_EPSILON * 2), false)
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-motion.test.mjs`

Expected: FAIL — the module does not exist, so the import throws `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the module**

Create `src/scripts/hero-knot-motion.mjs`:

```js
export const BASE_POSE = Object.freeze({ x: 0.4, y: 0.6 })

const POINTER_X_COEFFICIENT = 0.35
const POINTER_Y_COEFFICIENT = 0.5
const SCROLL_Y_COEFFICIENT = 1.2
const MAX_Y_OFFSET = 1.2

export const DAMPING_FACTOR = 0.06
export const CONVERGENCE_EPSILON = 0.0005

export function calculateRotationTarget(
  pointerX,
  pointerY,
  scrollProgress,
  basePose = BASE_POSE
) {
  const yOffset = Math.min(
    pointerX * POINTER_Y_COEFFICIENT + scrollProgress * SCROLL_Y_COEFFICIENT,
    MAX_Y_OFFSET
  )

  return {
    x: basePose.x + pointerY * POINTER_X_COEFFICIENT,
    y: basePose.y + yOffset,
  }
}

export function dampToward(current, target, factor = DAMPING_FACTOR) {
  return current + (target - current) * factor
}

export function isConverged(current, target, epsilon = CONVERGENCE_EPSILON) {
  return Math.abs(target - current) < epsilon
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-motion.test.mjs`

Expected: PASS, all 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/hero-knot-motion.mjs tests/hero-knot-motion.test.mjs
git commit -m "feat: add hero knot rotation targeting and damping

Cursor and scroll inputs sum instead of overwriting each other, with
the combined y offset clamped at +1.2 rad, the ceiling the prototype
reached. The clamp is an upper bound only so cursor input can still
pull y below the base pose."
```

---

### Task 3: Scroll normalization, segment density, placement, and the render gate

**Files:**
- Modify: `src/scripts/hero-knot-motion.mjs`
- Modify: `tests/hero-knot-motion.test.mjs`

**Interfaces:**
- Consumes: the module created in Task 2.
- Produces, five further named exports of `src/scripts/hero-knot-motion.mjs`:
  - `NARROW_BREAKPOINT` — number `768`
  - `getScrollProgress(scrollY, viewportHeight)` → `number` in `0..1`
  - `getSegmentCounts(viewportWidth)` → `{ tubular: number, radial: number }`
  - `getPlacement(viewportWidth, viewportHeight)` → `{ x: number, y: number, cameraZ: number }`
  - `shouldRender(prefersReducedMotion, hasWebGL)` → `'animated' | 'none'`

Phase 2 calls `shouldRender` before the dynamic `import('three')`, then `getSegmentCounts` to build the geometry and `getPlacement` to position mesh and camera. Phase 3 calls `getScrollProgress` in the scroll handler and feeds its result to `calculateRotationTarget`. Phase 4 re-calls the density and placement getters on resize.

Placement rules, from the spec: at or above `NARROW_BREAKPOINT` the knot sits to the right of the reading zone at `x = 1.6, y = 0.2, cameraZ = 7.5`. Below it, the hero text spans nearly the full width, so the knot moves to the empty area above the title: horizontally near centre (`x = 0`), lifted (`y = 1.5`), and pushed back (`cameraZ = 9`) so it clears the title's top edge with margin. `viewportHeight` is part of the signature because phase 4 may need it; this phase ignores it, and the tests below assert that ignoring it is intentional and stable.

- [ ] **Step 1: Add the failing tests**

Append to `tests/hero-knot-motion.test.mjs`:

```js
import {
  NARROW_BREAKPOINT,
  getPlacement,
  getScrollProgress,
  getSegmentCounts,
  shouldRender,
} from '../src/scripts/hero-knot-motion.mjs'

test('an unscrolled hero has zero scroll progress', () => {
  close(getScrollProgress(0, 900), 0, 'progress')
})

test('scroll progress completes at 80 percent of the viewport height', () => {
  close(getScrollProgress(720, 900), 1, 'progress at 0.8 * height')
  close(getScrollProgress(360, 900), 0.5, 'progress halfway there')
})

test('scroll progress is capped at 1 past the ceiling', () => {
  close(getScrollProgress(5000, 900), 1, 'far past the hero')
})

test('desktop widths get the full-density knot', () => {
  assert.deepEqual(getSegmentCounts(1440), { tubular: 220, radial: 32 })
  assert.deepEqual(getSegmentCounts(NARROW_BREAKPOINT), {
    tubular: 220,
    radial: 32,
  })
})

test('narrow widths drop to the mobile density', () => {
  assert.deepEqual(getSegmentCounts(390), { tubular: 120, radial: 20 })
  assert.deepEqual(getSegmentCounts(NARROW_BREAKPOINT - 1), {
    tubular: 120,
    radial: 20,
  })
})

test('wide viewports place the knot beside the reading zone', () => {
  assert.deepEqual(getPlacement(1440, 900), { x: 1.6, y: 0.2, cameraZ: 7.5 })
})

test('narrow viewports lift the knot above the title and push it back', () => {
  const placement = getPlacement(390, 844)

  assert.equal(placement.x, 0, 'centred horizontally')
  assert.ok(placement.y > 0.2, 'lifted above the wide-layout position')
  assert.ok(placement.cameraZ > 7.5, 'pushed back so it clears the title')
})

test('the placement switch happens at the breakpoint, not around it', () => {
  assert.deepEqual(
    getPlacement(NARROW_BREAKPOINT, 900),
    getPlacement(1440, 900),
    'the breakpoint itself is the wide arrangement'
  )
  assert.deepEqual(
    getPlacement(NARROW_BREAKPOINT - 1, 900),
    getPlacement(390, 844),
    'one pixel below is the narrow arrangement'
  )
})

test('placement does not vary with viewport height', () => {
  assert.deepEqual(getPlacement(1440, 900), getPlacement(1440, 1600))
  assert.deepEqual(getPlacement(390, 640), getPlacement(390, 844))
})

test('the knot renders only with WebGL and no reduced-motion request', () => {
  assert.equal(shouldRender(false, true), 'animated')
})

test('reduced motion renders nothing, even with WebGL', () => {
  assert.equal(shouldRender(true, true), 'none')
})

test('missing WebGL renders nothing', () => {
  assert.equal(shouldRender(false, false), 'none')
  assert.equal(shouldRender(true, false), 'none')
})
```

Note: this file now has two `import` statements from the same module. That is valid ESM and keeps each task's diff self-contained. Merging them into one import block is an acceptable cleanup, not a requirement.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-motion.test.mjs`

Expected: FAIL — `getScrollProgress`, `getSegmentCounts`, `getPlacement`, `shouldRender`, and `NARROW_BREAKPOINT` are not exported, so the import throws `SyntaxError: The requested module ... does not provide an export named 'NARROW_BREAKPOINT'`.

- [ ] **Step 3: Extend the module**

Append to `src/scripts/hero-knot-motion.mjs`:

```js
export const NARROW_BREAKPOINT = 768

const SCROLL_RANGE_FACTOR = 0.8

const DESKTOP_SEGMENTS = Object.freeze({ tubular: 220, radial: 32 })
const MOBILE_SEGMENTS = Object.freeze({ tubular: 120, radial: 20 })

const WIDE_PLACEMENT = Object.freeze({ x: 1.6, y: 0.2, cameraZ: 7.5 })

// Provisional. Unlike every other constant in this file, these three are not
// carried over from the approved prototype, which was desktop-width only.
// Phase 4 confirms them on a real narrow viewport and may adjust them; the
// requirement they must satisfy is that the knot clears the title's top edge
// with visible margin.
const NARROW_PLACEMENT = Object.freeze({ x: 0, y: 1.5, cameraZ: 9 })

export function getScrollProgress(scrollY, viewportHeight) {
  return Math.min(1, scrollY / (viewportHeight * SCROLL_RANGE_FACTOR))
}

export function getSegmentCounts(viewportWidth) {
  const source =
    viewportWidth < NARROW_BREAKPOINT ? MOBILE_SEGMENTS : DESKTOP_SEGMENTS

  return { tubular: source.tubular, radial: source.radial }
}

export function getPlacement(viewportWidth, viewportHeight) {
  const source =
    viewportWidth < NARROW_BREAKPOINT ? NARROW_PLACEMENT : WIDE_PLACEMENT

  return { x: source.x, y: source.y, cameraZ: source.cameraZ }
}

export function shouldRender(prefersReducedMotion, hasWebGL) {
  if (prefersReducedMotion) return 'none'
  if (!hasWebGL) return 'none'
  return 'animated'
}
```

Both getters return fresh objects rather than the frozen constants so a caller cannot mutate shared state.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-motion.test.mjs`

Expected: PASS, all 24 tests.

- [ ] **Step 5: Run the whole suite and the build**

Run: `npm test && npm run build`

Expected: both succeed. `npm test` must show the new file picked up by the `node --test tests/*.test.mjs` stage, and the Vitest stage must remain green and must not attempt to run this `.mjs` file.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/hero-knot-motion.mjs tests/hero-knot-motion.test.mjs
git commit -m "feat: add hero knot scroll, density, placement, and render gate

Scroll normalization lives here rather than in the scene code so the
0.8 range factor and the ceiling at 1 stay unit tested. Placement
switches at 768px from a right-side offset to a lifted, pushed-back
position above the title, where the narrow-viewport hero text spans
nearly the full width. shouldRender has no static-frame state: reduced
motion and missing WebGL both render nothing."
```

---

## Acceptance

### Machine-checkable (the reviewer runs these)

- [ ] `npm ci` succeeds from the committed lockfile.
- [ ] `npm run build` succeeds.
- [ ] `npm test` passes, and its output shows the 24 new tests from `tests/hero-knot-motion.test.mjs`.
- [ ] `git log --oneline` shows the dependency commit and both feature commits on `feat/hero-wireframe-knot`.
- [ ] `git status --porcelain` shows no leftover uncommitted `package.json` or `package-lock.json` changes.
- [ ] `! grep -q '^import' src/scripts/hero-knot-motion.mjs` succeeds: the module has no imports, so nothing Three.js-shaped leaked into it. (Plain `grep -c` exits non-zero on no matches, which reads as a failure in a chained command.)
- [ ] `git diff --stat <baseline>..HEAD`, using the SHA recorded in Task 1 Step 3, touches only `package.json`, `package-lock.json`, `src/scripts/hero-knot-motion.mjs`, and `tests/hero-knot-motion.test.mjs`. No component, page, or layout was modified. Do **not** use `main...HEAD`: the branch already carries the spec-doc and `.codex` commits ahead of `main`, which would show as spurious out-of-scope files.
- [ ] `getScrollProgress` clamps at `1`. Confirm `getScrollProgress(5000, 900)` returns exactly `1`, so the scroll-driven y offset can never exceed its share of the `+1.2` budget.
- [ ] The clamp is an upper bound only. Confirm `calculateRotationTarget(-1, 0, 0).y` is below `BASE_POSE.y`, not clamped to it.

### Needs the user's eyes

Nothing in this phase. It produces no visual change. The first on-screen review point is phase 2.

---

## Not in this phase

- Any Three.js import, canvas element, or Astro component. That is phase 2.
- The animation loop, event listeners, `IntersectionObserver`, or disposal. That is phase 3.
- The coarse-pointer branch and the deferred mobile-density decision. That is phase 4.
- Any change to the hero title, tagline, scroll cue, or the sections below the hero, in any phase.
