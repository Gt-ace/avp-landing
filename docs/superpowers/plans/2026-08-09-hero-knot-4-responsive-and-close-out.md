# Hero Knot Phase 4: Responsive Behaviour and Close-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero knot correct on touch devices and narrow viewports, resolve the spec's one deferred decision, and bring the stacked feature branch to a state that can merge to `main`.

**Architecture:** Touch handling is a single condition around cursor listener attachment. Narrow placement is a constant change inside the already-tested motion module, re-derived against the hero's current centred layout. Nothing structural changes: no new file, no new dependency, no change to the loop or the lifecycle built in phase 3.

**Tech Stack:** Astro 4 with `ViewTransitions`, Three.js 0.185.1 via dynamic `import()`, plain ESM, Node built-in test runner.

## Global Constraints

- Design authority: `docs/superpowers/specs/2026-08-09-hero-wireframe-knot-design.md`, **including the amendment note** in its Narrow-viewport placement section. The hero copy is now vertically centred and sits further left than the spec body describes.
- Work on branch `feat/hero-knot-scene-p4`, branched from `feat/hero-knot-scene`. Open the PR **into `feat/hero-knot-scene`**. The `feat/hero-knot-scene` → `main` merge happens after this phase and is the only one that deploys.
- Phases 1 through 3 are merged. This phase is the first that is allowed to modify `src/scripts/hero-knot-motion.mjs`, and only for the narrow placement constants named in Task 2. Every other export stays exactly as it is.
- **`requestAnimationFrame` must still appear exactly twice** in `src/components/HeroKnot.astro`, and a test asserts it. If you reach for a debounced or rAF-throttled resize, stop: `ResizeObserver` already coalesces, and a third call site breaks the single-flight guarantee phase 3 depends on.
- No idle rotation, no scroll capture, no React, GSAP, Lenis, custom shaders, postprocessing, or `Line2`/`LineMaterial`.
- No change to the hero copy, the dot pattern, the navigation, or any section below the hero. Those are settled.
- Do not widen scope to rescue the mobile knot. The spec allows exactly two outcomes and no third; see Task 3.

---

## Owner decisions this phase consumes

Two calls belong to the owner, not the implementer, and both need a real browser. **Neither blocks the start of work** — Tasks 1 and 4 are independent of both, and each task below states its default so progress never stalls waiting on an answer.

1. **Narrow placement values** (Task 2). The provisional `y: 1.5, cameraZ: 9` were chosen when the hero copy sat at the bottom of the section. The copy is now vertically centred, so the empty region above the title shrank from roughly two thirds of the viewport to roughly one third. These need re-deriving on a real narrow viewport, not merely confirming.

2. **Mobile density** (Task 3). The spec's single deferred decision. Look at `(120, 20)` on a real narrow viewport and choose: keep it if it reads as intentional, or render nothing on mobile if it reads as faceted or cheap. Both branches are pre-approved and both are written out in full below. There is no third option.

---

## Decided here, not deferred again

**Geometry is not rebuilt on resize.** Segment counts are computed once at mount and stay fixed for the life of the scene; only placement updates on resize. This was left open in phases 2 and 3 and is now settled, for three reasons:

- The spec's loading rules say to create geometry once and avoid per-frame allocation. A rebuild on every breakpoint crossing is the same class of churn, triggered by a user dragging a window edge.
- Crossing 768px by resizing is a desktop behaviour, and a desktop that crosses it keeps the *denser* `(220, 32)` geometry. Denser is never visually worse, only marginally more work to draw.
- The genuine mobile case is orientation change, where a phone at 390×844 rotating to 844×390 keeps mobile density. That is correct: it is still the same device with the same GPU budget.

If Task 3's decision is "render nothing on mobile", this rule is what makes it coherent: the render gate is evaluated at mount rather than on resize, so dragging a desktop window narrow does not tear down a live knot, and a phone never builds one.

**Be precise about what "at mount" means under branch B**, because `mount()` runs on every `astro:page-load`, not only on first load. A visitor with a 700px-wide window who navigates `/work` → `/` re-enters `mount()`, the gate sees `innerWidth` of 700, and the knot does not come back for the rest of that session. **That is intended and acceptable.** A 700px window is a narrow viewport, and a remount honouring the current width is more correct than one honouring the width at first paint. The knot returns as soon as the window is widened and the page is navigated or reloaded. Do not add resize-triggered mounting to smooth this over; that reopens the teardown and context-cap problems phase 2 closed.

---

## File Structure

- Modify `src/components/HeroKnot.astro`: the coarse-pointer condition in `attachInput`, and — only if Task 3 goes that way — the viewport width passed to the render gate.
- Modify `src/scripts/hero-knot-motion.mjs`: the narrow placement constants in Task 2, and `shouldRender`'s signature only under Task 3's branch B.
- Modify `tests/hero-knot-motion.test.mjs`: placement expectations, and branch B's gate tests.
- Modify `tests/hero-knot-scene.test.mjs`: the coarse-pointer contract.

---

### Task 1: No cursor listeners on a coarse pointer

**Files:**
- Modify: `src/components/HeroKnot.astro`
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: `attachInput()` and `detachInput()` from phase 3.
- Produces: an `attachInput()` that attaches `mousemove` only on a fine pointer. `detachInput()` is unchanged and stays unconditional.

The spec: on a coarse pointer, no cursor input and **no cursor listeners attached**. Scroll alone drives the knot. `pointer` stays at `{ x: 0, y: 0 }`, so `calculateRotationTarget` receives zero for both cursor terms and the target reduces to base pose plus scroll. No special case is needed in the motion module.

Evaluate the query inside `attachInput` rather than once at module scope. `attachInput` already runs on every viewport re-entry, so a hybrid device that switches input modes is re-evaluated for free, and the check costs nothing.

`detachInput` must stay unconditional. Removing a listener that was never added is a no-op, and making removal conditional creates a leak the moment the media query result changes between attach and detach.

- [ ] **Step 1: Add the failing tests**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('a coarse pointer gets no cursor listeners at all', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const attach = source.slice(
    source.indexOf('function attachInput'),
    source.indexOf('function detachInput')
  )

  assert.match(
    attach,
    /matchMedia\('\(pointer: fine\)'\)\.matches/,
    'matched positively as fine, so a device reporting neither falls to scroll-only'
  )
  assert.ok(
    attach.indexOf("matchMedia('(pointer: fine)')") <
      attach.indexOf("addEventListener('mousemove'"),
    'the query gates the cursor listener rather than being read after it'
  )
  assert.match(
    attach,
    /addEventListener\('scroll', onScroll, \{ passive: true \}\)/,
    'scroll input is attached on every device'
  )
})

test('the coarse-pointer query is evaluated per attach, not once at module scope', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const beforeAttach = source.slice(0, source.indexOf('function attachInput'))

  assert.doesNotMatch(
    beforeAttach,
    /matchMedia\('\(pointer: fine\)'\)/,
    'attachInput runs on every viewport re-entry, so a hybrid device that switches input mode is handled for free'
  )
})

test('detachInput stays unconditional', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const detach = source.slice(source.indexOf('function detachInput'))
  const body = detach.slice(0, detach.indexOf('}'))

  assert.doesNotMatch(
    body,
    /if\s*\(|matchMedia/,
    'removing a listener that was never added is a no-op; a conditional removal leaks when the query result changes between attach and detach'
  )
  assert.match(body, /removeEventListener\('mousemove', onPointerMove\)/)
  assert.match(body, /removeEventListener\('scroll', onScroll\)/)
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — `attachInput` has no pointer query.

- [ ] **Step 3: Gate the cursor listener**

In `src/components/HeroKnot.astro`, replace `attachInput` with:

```js
  function attachInput() {
    // Re-evaluated per attach, which happens on every viewport re-entry, so a
    // hybrid device that switches input mode is picked up without a listener.
    if (matchMedia('(pointer: fine)').matches) {
      addEventListener('mousemove', onPointerMove, { passive: true })
    }

    addEventListener('scroll', onScroll, { passive: true })
  }
```

Note the query is `(pointer: fine)`, matched positively, rather than negating `(pointer: coarse)`. A device reporting neither — some assistive setups and headless contexts — then gets scroll-only, which is the safe side. The test above searches for the string `pointer: coarse` in a comment or query; write the comment so the intent is greppable:

```js
  function attachInput() {
    // A coarse pointer (touch) gets no cursor listener at all: the spec wants
    // scroll alone to drive the knot there. Matched as `pointer: fine` rather
    // than negated `pointer: coarse`, so a device reporting neither falls to
    // the scroll-only side. Re-evaluated per attach, which happens on every
    // viewport re-entry, so a hybrid device is picked up without a listener.
    if (matchMedia('(pointer: fine)').matches) {
      addEventListener('mousemove', onPointerMove, { passive: true })
    }

    addEventListener('scroll', onScroll, { passive: true })
  }
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 41 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroKnot.astro tests/hero-knot-scene.test.mjs
git commit -m "feat: drive the hero knot by scroll alone on touch

A coarse pointer gets no cursor listener at all, per the spec. The
query is matched as pointer: fine rather than negated coarse, so a
device reporting neither lands on the scroll-only side, and it is
evaluated per attach so hybrid devices need no extra handling."
```

---

### Task 2: Re-derive the narrow placement

**Files:**
- Modify: `src/scripts/hero-knot-motion.mjs`
- Modify: `tests/hero-knot-motion.test.mjs`

**Interfaces:**
- Consumes: `getPlacement`, `NARROW_BREAKPOINT` from phase 1.
- Produces: the same `getPlacement(viewportWidth, viewportHeight)` signature with re-derived narrow constants. No signature change, no new export.

**Default if the owner has not answered: `x: 0, y: 1.15, cameraZ: 10`.** These are a reasoned starting point, not a measurement — the copy moved to vertical centre, so the knot needs to sit lower in world space than the provisional `1.5` while moving further back to stay clear of the title's top edge. Ship the default, and flag in the PR that it is unconfirmed.

The requirement the values must satisfy, from the spec: the knot occupies the empty area above the title and **clears the title's top edge with margin, not merely avoiding touching it**.

How to derive them without guessing, using the running dev server:

1. Open `http://localhost:4321/` and set the viewport to 390×844 in devtools.
2. In the console, the knot's world position is reachable through the scene. Simplest loop: edit `NARROW_PLACEMENT` in `src/scripts/hero-knot-motion.mjs`, save, and let Vite hot-reload. Two or three iterations is normally enough.
3. Increasing `cameraZ` shrinks the knot and pulls it toward the optical centre. Increasing `y` lifts it. They interact, so change one at a time.
4. Stop when there is clear background between the bottom of the knot and the top of the title at both 390×844 and 360×640.

- [ ] **Step 1: Update the placement expectations**

The phase 1 tests deliberately assert the narrow arrangement loosely (`y > 0.2`, `cameraZ > 7.5`) precisely so this re-derivation would not require rewriting them. Confirm they still hold, then pin the values that changed.

In `tests/hero-knot-motion.test.mjs`: **delete the existing test named `narrow viewports lift the knot above the title and push it back`, then add both tests below.** The first is that test restored verbatim; the second is new. The net change is exactly one added test, and every count downstream in this plan assumes that. Appending without deleting gives 29 rather than 28 and puts every later number out by one.

```js
test('narrow viewports lift the knot above the title and push it back', () => {
  const placement = getPlacement(390, 844)

  assert.equal(placement.x, 0, 'centred horizontally')
  assert.ok(placement.y > 0.2, 'lifted above the wide-layout position')
  assert.ok(placement.cameraZ > 7.5, 'pushed back so it clears the title')
})

test('the narrow arrangement pins its re-derived values', () => {
  // A change detector, deliberately. These three are the only numbers in the
  // module that come from looking at a screen rather than from the spec, so
  // an accidental edit has nothing else to catch it. Update this assertion
  // together with the constant, never around it.
  assert.deepEqual(getPlacement(390, 844), { x: 0, y: 1.15, cameraZ: 10 })
})
```

If the owner supplied measured values, put those in this assertion instead of the default. The test exists to pin whatever was decided, not to argue for a particular number.

- [ ] **Step 2: Run the tests and verify the new one fails**

Run: `node --test tests/hero-knot-motion.test.mjs`

Expected: FAIL on the pinning test — it asserts the re-derived values while the module still holds the provisional `y: 1.5, cameraZ: 9`.

- [ ] **Step 3: Set the re-derived constants**

In `src/scripts/hero-knot-motion.mjs`, replace the `NARROW_PLACEMENT` constant and its comment:

```js
// Re-derived in phase 4 against the hero's centred copy. The copy sits at
// top: 50%, so the knot has roughly the top third of the viewport, not the
// top two thirds the original values assumed: it sits lower in world space
// and further back than the provisional (1.5, 9).
const NARROW_PLACEMENT = Object.freeze({ x: 0, y: 1.15, cameraZ: 10 })
```

If the owner supplied measured values, use those instead and keep the comment accurate.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-motion.test.mjs`

Expected: PASS, 28 tests.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/hero-knot-motion.mjs tests/hero-knot-motion.test.mjs
git commit -m "feat: re-derive the hero knot narrow placement

The hero copy moved to vertical centre after phase 2, so the empty band
above the title shrank from roughly two thirds of the viewport to one
third. The provisional values were chosen against bottom-anchored copy
and no longer fit."
```

---

### Task 3: The deferred mobile density decision

**Files, branch A:** none.
**Files, branch B:** `src/scripts/hero-knot-motion.mjs`, `src/components/HeroKnot.astro`, `tests/hero-knot-motion.test.mjs`.

This is the spec's single deferred decision, and the spec pre-approves exactly two outcomes. Look at `(120, 20)` on a real narrow viewport at the placement from Task 2.

**Default if the owner has not answered: branch A.** Keep `(120, 20)` and change nothing. It is the reversible option: shipping the mobile knot and removing it later is one constant change, while shipping nothing and adding it later needs this decision made anyway.

#### Branch A — the mobile knot reads as intentional

Do nothing. `getSegmentCounts` already returns `(120, 20)` below the breakpoint and is already tested. Record the decision:

- [ ] **A1: Note the outcome in the PR description**, stating the viewport sizes it was judged at.
- [ ] **A2: No code change.** Do not tune opacity, segment counts, or line colour to "improve" it. The spec fences that: there is no third option and no widening of scope to rescue it.

#### Branch B — it reads as faceted or cheap, so mobile renders nothing

Then the render gate grows a viewport term. This is the only change in this whole phase that touches `shouldRender`.

- [ ] **B1: Add the failing gate tests** to `tests/hero-knot-motion.test.mjs`:

```js
test('narrow viewports render nothing when mobile density is rejected', () => {
  assert.equal(shouldRender(false, true, 390), 'none')
  assert.equal(shouldRender(false, true, NARROW_BREAKPOINT - 1), 'none')
})

test('the breakpoint itself still renders', () => {
  assert.equal(shouldRender(false, true, NARROW_BREAKPOINT), 'animated')
  assert.equal(shouldRender(false, true, 1440), 'animated')
})

test('reduced motion and missing WebGL still win over width', () => {
  assert.equal(shouldRender(true, true, 1440), 'none')
  assert.equal(shouldRender(false, false, 1440), 'none')
})
```

- [ ] **B2: Run them and verify they fail.** `shouldRender` ignores its third argument, so the first two assertions return `'animated'`.

- [ ] **B3: Extend `shouldRender`** in `src/scripts/hero-knot-motion.mjs`:

```js
export function shouldRender(prefersReducedMotion, hasWebGL, viewportWidth) {
  if (prefersReducedMotion) return 'none'
  if (!hasWebGL) return 'none'
  if (viewportWidth < NARROW_BREAKPOINT) return 'none'
  return 'animated'
}
```

`undefined < 768` is `false`, so an omitted third argument keeps the old behaviour and no existing caller or test breaks.

- [ ] **B4: Pass the width at the call site** in `src/components/HeroKnot.astro`:

```js
    if (shouldRender(prefersReducedMotion, hasWebGL(), innerWidth) === 'none') return
```

`innerWidth` is correct here rather than the hero box: this runs before `buildScene`, so there is no measured hero yet, and the gate is a device-class question rather than a layout one.

- [ ] **B5: Run the full suite and commit.**

```bash
git add src/scripts/hero-knot-motion.mjs src/components/HeroKnot.astro tests/hero-knot-motion.test.mjs
git commit -m "feat: render no hero knot on narrow viewports

The spec's deferred decision, resolved against a real narrow viewport:
(120, 20) reads as faceted rather than intentional, so mobile gets the
unchanged hero instead of a degraded knot. Reduced motion and missing
WebGL still short-circuit first."
```

---

### Task 4: Close out the branch

**Files:**
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:** none. This task adds one regression guard and runs the full verification.

- [ ] **Step 1: Add the scope guard test**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('the single-flight loop still has exactly two frame call sites', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const frames = source.match(/requestAnimationFrame\(/g) ?? []

  assert.equal(
    frames.length,
    2,
    'the requestLoop guard and the tick re-arm. A third — a debounced or rAF-throttled resize — breaks single flight; ResizeObserver already coalesces'
  )
})

test('no idle animation survived the responsive work', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.doesNotMatch(source, /setInterval|setTimeout/)
  assert.doesNotMatch(source, /rotation\.[xy]\s*\+=/)
})
```

- [ ] **Step 2: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, 43 tests.

- [ ] **Step 3: Run the whole suite and build**

Run: `npm test && npm run build`

Expected: both succeed. Node reports 85 tests under branch A, or 88 under branch B.

- [ ] **Step 4: Commit**

```bash
git add tests/hero-knot-scene.test.mjs
git commit -m "test: guard the hero knot single-flight loop and idle silence"
```

---

## Acceptance

### Machine-checkable (the reviewer runs these)

- [ ] `npm run build` succeeds.
- [ ] `npm test` passes: 85 Node tests under branch A, 88 under branch B, plus 9 Vitest.
- [ ] `grep -c "requestAnimationFrame(" src/components/HeroKnot.astro` returns exactly `2`.
- [ ] `ls dist/_astro/three.module.*.js && ! grep -rl "three.module" dist --include='*.html'` succeeds. Never grep the bare word `three` or `TorusKnotGeometry`; both false-positive.
- [ ] `! grep -nE "0\.06|1\.2|0\.35|768|innerHeight \* 0\.8" src/components/HeroKnot.astro` succeeds, **except** under branch B, where `NARROW_BREAKPOINT` is still imported rather than inlined — confirm the literal `768` appears only in `hero-knot-motion.mjs`.
- [ ] `! grep -nE "preventDefault|scrollTo|setInterval" src/components/HeroKnot.astro` succeeds.
- [ ] `git diff --stat <baseline>..HEAD` touches only the files this plan names. Record `<baseline>` with `git rev-parse HEAD` before the first commit.
- [ ] `git diff <baseline>..HEAD -- src/pages/ src/layouts/` is empty. The hero copy, dot pattern, and layout are untouched.
- [ ] The PR targets `feat/hero-knot-scene`, not `main`.

### Needs the user's eyes — this phase

- [ ] On a narrow viewport (390×844 and 360×640), the knot sits **above** the title with clear background between them, not beside or behind it.
- [ ] Under branch A, the mobile knot reads as intentional rather than faceted. Under branch B, nothing renders on mobile and the hero is exactly today's hero.
- [ ] On a touch device or with devtools touch emulation, scrolling rotates the knot and no cursor handler fires.
- [ ] Rotating a phone between portrait and landscape neither distorts the knot nor pushes it over the copy.
- [ ] Dragging a desktop window from wide to narrow and back re-places the knot smoothly and never lands it on the copy.

### Carried debt — all of this blocks the merge to `main`

None of these have been run since phase 2 introduced them. **The `feat/hero-knot-scene` → `main` merge is the only one that deploys, so this is the last gate.**

- [ ] Eight or more `/` → `/work` → `/` round trips with the console open: the knot returns every time and no "Too many active WebGL contexts" warning appears.
- [ ] Hard reload onto `/work`, then navigate to `/`: the knot mounts. Different code path from the above.
- [ ] Reduced motion emulated in devtools: nothing renders and the `three.module` chunk is never requested in the network panel.
- [ ] WebGL disabled: the hero renders exactly as it does today, with no error state.
- [ ] Title and tagline fully readable at desktop width; the knot never overlaps them.
- [ ] The title text is still the LCP element, confirmed in devtools.
- [ ] Cursor and scroll both rotate the knot, and it stops when input stops.
- [ ] Scroll down a little, then move the cursor: no snap. This is the summed-input behaviour the spec requires be looked at before the work is called done.
- [ ] The knot leaves and re-enters idle repeatedly without freezing after the first settle.

---

## Merging to `main`

Once every box above is ticked:

1. Open a PR from `feat/hero-knot-scene` into `main` summarising all four phases.
2. Merging triggers `.github/workflows/deploy.yml`: build, push to GHCR, SSH to the box, `docker compose pull && up -d`. Nothing about this feature needs a compose or Caddy change.
3. Confirm the deploy run succeeds and check `https://avp.software` once it lands.

---

## Not in this phase

- Rebuilding geometry on resize. Decided against above; do not reopen it.
- Tuning opacity, segment counts, or line colour to rescue the mobile knot. The spec fences this explicitly.
- Any change to the hero copy, the dot pattern, the navigation, or the sections below the hero.
- A second hero concept, an A/B variant, or reintroducing the untangler narrative.
