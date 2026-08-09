# Hero Knot Phase 3: Motion and Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero knot respond to cursor and scroll, easing toward a summed target and stopping completely once it arrives, with an animation loop that starts and stops any number of times and detaches entirely when the hero leaves the viewport.

**Architecture:** Input handlers write to two plain state values (pointer position, scroll progress) and ask the already-tested `hero-knot-motion.mjs` for a rotation target. A single-flight `requestAnimationFrame` loop damps toward that target and stops itself on convergence. An `IntersectionObserver` detaches input handling when the hero scrolls away and reattaches when it returns. No policy arithmetic is added to the component.

**Tech Stack:** Astro 4 with `ViewTransitions`, Three.js 0.185.1 via dynamic `import()`, plain ESM, Node built-in test runner.

## Global Constraints

- Design authority: `docs/superpowers/specs/2026-08-09-hero-wireframe-knot-design.md`. The prototype is reference material only; its last-writer-wins input handling is an explicitly rejected defect.
- Work on branch `feat/hero-knot-scene-p3`, branched from `feat/hero-knot-scene`. Open the PR **into `feat/hero-knot-scene`**, never into `main`. Only the final post-phase-4 merge deploys.
- Phases 1 and 2 are merged. **Do not modify `src/scripts/hero-knot-motion.mjs`.** Every constant and every piece of arithmetic you need is already exported and tested. If you find yourself typing `0.06`, `1.2`, `0.35`, `0.5`, `0.8`, or `768` into the component, you are duplicating tested policy.
- All work happens inside `src/components/HeroKnot.astro` and its test file. No new source file, no change to `src/pages/index.astro`.
- **No idle rotation.** With no input the knot holds a fixed pose forever. There is no automatic spin, drift, breathing, or wobble anywhere in this phase.
- **Scroll is never captured.** No `preventDefault`, no pinning, no scroll-jacking, no `scrollTo`. The scroll listener is passive and read-only. The hero scrolls away normally.
- No React, GSAP, or Lenis. No custom shaders, postprocessing, or `Line2`/`LineMaterial`.
- The coarse-pointer branch and the mobile-density decision remain phase 4. This phase attaches cursor listeners unconditionally.
- No change to the hero title, tagline, scroll cue, navigation, or any section below the hero.

---

## What phase 2 left, and what must change

Read `src/components/HeroKnot.astro` before starting. Phase 2 produced a `current` record shaped `{ canvas, disposed, renderer, geometry, material, scene, camera, lines, observer, draw }`, a `mount()` behind a render gate, and a `teardown()` wired to `astro:before-swap`. Three things about that code shape this phase:

1. **`teardown()` is now incomplete.** It disposes GPU resources but knows nothing about animation frames, input listeners, or the `IntersectionObserver` this phase adds. Every resource added below must be released there too, or navigating away leaves listeners firing against a disposed renderer.

2. **`resize()` is currently called twice at mount** — once by `ResizeObserver` firing on `observe()`, and once explicitly at the end of `buildScene`. That is free today because `resize()` only draws. This phase gives `resize()` a side effect (it must restart the loop), so the redundant explicit call gets dropped in Task 1.

3. **Nothing guards the dynamic import or renderer construction.** Task 1 fixes this. It matters more here than it looks: `new WebGLRenderer(...)` throws precisely when WebGL contexts are exhausted, which is the exact failure phase 2's teardown exists to prevent. Leaving it unguarded means that failure surfaces as an unhandled promise rejection instead of the silent no-op the spec's fallback section requires.

---

## The concurrency rule this phase depends on

The loop must be **single-flight**: at most one `requestAnimationFrame` in flight at any moment. The bug this prevents is subtle and does not throw. If an input event schedules a frame while a frame is already scheduled, two `tick` chains run in parallel, each applying `dampToward` once per frame. The knot then converges at double rate — the damping reads as wrong rather than broken, and every subsequent event compounds it.

The guard is a single module-scoped handle, `frame`, holding the rAF id or `0`:

```js
function requestLoop() {
  if (frame) return
  frame = requestAnimationFrame(tick)
}
```

For this to be correct, `tick` must clear `frame` only when it decides to stop, never at the top. Walk the two interleavings; JavaScript's single-threaded task model makes both safe, and this is why the ordering below is not arbitrary:

- **An input event fires before `tick` runs.** The handler mutates `target` and calls `requestLoop()`, which returns early because `frame` is still the pending id. `tick` then reads the freshly mutated `target`, finds it unconverged, and re-arms. Correct.
- **An input event fires after `tick` has completed.** `tick` already decided convergence against the target as it stood and set `frame = 0`. The handler now calls `requestLoop()`, which schedules a fresh frame. Correct.

A handler cannot interleave *inside* `tick`, because `tick` runs to completion as one task. That property is what makes a single boolean-ish handle sufficient; do not replace it with a more elaborate scheme.

---

## File Structure

- Modify `src/components/HeroKnot.astro`: input state, target calculation, the damped loop, the `IntersectionObserver`, and an extended `teardown`. All of it lives in the existing module script.
- Modify `tests/hero-knot-scene.test.mjs`: source-level contract tests, appended to the phase 2 file. This file is the component's contract; keep it as one file.

---

### Task 1: Guard the mount path and remove the redundant resize

**Files:**
- Modify: `src/components/HeroKnot.astro`
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: `mount()`, `buildScene()`, `teardown()` from phase 2.
- Produces: a `mount()` that cannot reject, and a `buildScene()` whose only `resize()` trigger is the `ResizeObserver`.

- [ ] **Step 1: Add the failing tests**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('a failed chunk fetch or renderer construction renders nothing quietly', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const mount = source.slice(
    source.indexOf('async function mount'),
    source.indexOf('async function buildScene')
  )

  assert.match(mount, /try\s*\{/, 'the scene build is guarded')
  assert.match(mount, /await buildScene\(canvas\)/)
  assert.match(mount, /catch/, 'a rejection must not escape as an unhandled promise')
  assert.match(mount, /teardown\(\)/, 'a partial build is released on failure')
})

test('the observer is the only thing that triggers a resize', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const build = source.slice(
    source.indexOf('async function buildScene'),
    source.indexOf('function teardown')
  )

  const calls = build.match(/^\s*resize\(\)/gm) ?? []
  assert.equal(
    calls.length,
    0,
    'ResizeObserver fires on observe(); an explicit call would double-fire a function that now restarts the loop'
  )
  assert.match(build, /observer\.observe\(hero\)/)
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — `mount()` has no `try`, and `buildScene` still ends with an explicit `resize()` call.

- [ ] **Step 3: Guard the mount**

In `src/components/HeroKnot.astro`, replace the bare `await buildScene(canvas)` inside `mount()` with:

```js
    try {
      await buildScene(canvas)
    } catch {
      // Spec fallback: a failed chunk fetch, a blocked script, or a renderer
      // that throws because WebGL contexts are exhausted must render nothing
      // and leave the hero untouched. Releasing here also drops the partially
      // built record so a later teardown has nothing stale to walk.
      teardown()
    }
```

- [ ] **Step 4: Drop the redundant resize call**

At the end of `buildScene`, delete the trailing explicit call:

```js
    const observer = new ResizeObserver(resize)
    observer.observe(hero)

    Object.assign(token, { /* unchanged */ })

    resize()   // <-- delete this line only
```

`ResizeObserver` invokes its callback once on `observe()`, so the first sizing and first draw still happen. Keeping both would run `resize()` twice, and from Task 3 onward `resize()` restarts the animation loop.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 21 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroKnot.astro tests/hero-knot-scene.test.mjs
git commit -m "fix: fail the hero knot mount quietly and resize once

new WebGLRenderer() throws exactly when WebGL contexts are exhausted,
so leaving the build unguarded turned the failure phase 2's teardown
exists to prevent into an unhandled rejection instead of the silent
no-op the spec asks for.

ResizeObserver already fires on observe(), and resize() is about to
gain a loop restart, so the explicit second call goes."
```

---

### Task 2: Input state and the summed rotation target

**Files:**
- Modify: `src/components/HeroKnot.astro`
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: `BASE_POSE`, `calculateRotationTarget`, `getScrollProgress` from `src/scripts/hero-knot-motion.mjs`.
- Produces: module-scoped `pointer = { x, y }`, `scrollProgress`, `target = { x, y }`, `rotation = { x, y }`, plus `readScroll()`, `onPointerMove(event)`, `onScroll()`, `updateTarget()`, `attachInput()`, and `detachInput()`. Task 3 calls `requestLoop()` from `updateTarget()`; Task 4 calls `attachInput`/`detachInput`.

The two inputs **sum**; they do not overwrite each other. The prototype let whichever event fired last own the y rotation, so moving the cursor after scrolling snapped the knot back to a cursor-only pose. That snap is a rejected defect. `calculateRotationTarget` already implements the sum and the `+1.2` clamp, and is tested — call it with both values every time either changes.

- [ ] **Step 1: Add the failing tests**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('both inputs are re-summed whenever either one changes', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(
    source,
    /calculateRotationTarget\(\s*pointer\.x,\s*pointer\.y,\s*scrollProgress\s*\)/,
    'the target always comes from both inputs, never from one'
  )

  const updates = source.match(/calculateRotationTarget\(/g) ?? []
  assert.equal(
    updates.length,
    1,
    'a single updateTarget call site keeps the two inputs from overwriting each other'
  )
})

test('cursor position is normalised to the viewport, not the hero box', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /clientX\s*\/\s*innerWidth\s*\)\s*\*\s*2\s*-\s*1/)
  assert.match(source, /clientY\s*\/\s*innerHeight\s*\)\s*\*\s*2\s*-\s*1/)
})

test('scroll progress is delegated, never recomputed inline', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /getScrollProgress\(scrollY,\s*innerHeight\)/)
  assert.doesNotMatch(
    source,
    /innerHeight\s*\*\s*0\.8|0\.8\s*\*\s*innerHeight/,
    'the 0.8 range factor belongs to the motion module, not inlined here'
  )
})

test('a zero-height viewport cannot poison the rotation with NaN', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const readScroll = source.slice(source.indexOf('function readScroll'))

  assert.match(
    readScroll.slice(0, 300),
    /if \(!innerHeight\) return/,
    'innerHeight can be 0 pre-layout or in a hidden frame; 0/0 is NaN and NaN rotation renders nothing'
  )
})

test('the scroll listener never interferes with scrolling', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /addEventListener\('scroll',\s*onScroll,\s*\{\s*passive:\s*true\s*\}\)/)
  assert.doesNotMatch(source, /preventDefault|scrollTo|overflow\s*=/)
})

test('input attachment is symmetric so it can be detached and reattached', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const attach = source.slice(
    source.indexOf('function attachInput'),
    source.indexOf('function detachInput')
  )
  const detach = source.slice(source.indexOf('function detachInput'))

  for (const handler of ['onPointerMove', 'onScroll']) {
    assert.match(attach, new RegExp(`addEventListener\\('[a-z]+', ${handler}`))
    assert.match(detach, new RegExp(`removeEventListener\\('[a-z]+', ${handler}`))
  }
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — none of `calculateRotationTarget`, `readScroll`, or `attachInput` exist in the component yet.

- [ ] **Step 3: Extend the motion module import**

At the top of the script in `src/components/HeroKnot.astro`, extend the existing import to:

```js
  import {
    BASE_POSE,
    calculateRotationTarget,
    dampToward,
    getPlacement,
    getScrollProgress,
    getSegmentCounts,
    isConverged,
    shouldRender,
  } from '../scripts/hero-knot-motion.mjs'
```

`dampToward` and `isConverged` are used in Task 3; importing them now keeps the import block from churning twice.

- [ ] **Step 4: Add input state and handlers**

Immediately below the `let current = null` declaration, add:

```js
  const pointer = { x: 0, y: 0 }
  const target = { x: BASE_POSE.x, y: BASE_POSE.y }
  const rotation = { x: BASE_POSE.x, y: BASE_POSE.y }
  let scrollProgress = 0

  function updateTarget() {
    const next = calculateRotationTarget(pointer.x, pointer.y, scrollProgress)
    target.x = next.x
    target.y = next.y
    requestLoop()
  }

  function readScroll() {
    // innerHeight is 0 before first layout and in some hidden frames. The
    // resulting 0/0 is NaN, which would propagate into rotation and make the
    // knot vanish with nothing thrown and nothing logged.
    if (!innerHeight) return
    scrollProgress = getScrollProgress(scrollY, innerHeight)
  }

  function onPointerMove(event) {
    pointer.x = (event.clientX / innerWidth) * 2 - 1
    pointer.y = (event.clientY / innerHeight) * 2 - 1
    updateTarget()
  }

  function onScroll() {
    readScroll()
    updateTarget()
  }

  function attachInput() {
    addEventListener('mousemove', onPointerMove, { passive: true })
    addEventListener('scroll', onScroll, { passive: true })
  }

  function detachInput() {
    removeEventListener('mousemove', onPointerMove)
    removeEventListener('scroll', onScroll)
  }
```

The axes cross deliberately: vertical cursor movement drives `rotation.x` and horizontal movement drives `rotation.y`. That is what makes the knot appear to turn toward the pointer rather than away from it. `calculateRotationTarget` already applies the crossing, so pass `pointer.x` and `pointer.y` in that order and do not swap them here.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 27.

`updateTarget` calls `requestLoop`, which does not exist until Task 3. That is fine and does not need a stub: these are source-text tests that read the file rather than execute it, and `requestLoop` is a hoisted function declaration, so the reference resolves once Task 3 lands. Do not run the component in a browser between Task 2 and Task 3.

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroKnot.astro tests/hero-knot-scene.test.mjs
git commit -m "feat: read cursor and scroll into one hero knot target

Both inputs feed a single calculateRotationTarget call, so they sum
instead of overwriting each other. The prototype let the last event to
fire own the y rotation, which snapped the knot back when the cursor
moved after a scroll.

readScroll bails on a zero innerHeight: 0/0 is NaN, and a NaN rotation
makes the knot disappear silently."
```

---

### Task 3: The damped, self-stopping loop

**Files:**
- Modify: `src/components/HeroKnot.astro`
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: `target`, `rotation`, `current` and `dampToward`, `isConverged`.
- Produces: module-scoped `frame` (rAF id or `0`), `requestLoop()`, `stopLoop()`, and `tick()`. Task 4 calls `stopLoop()` from the `IntersectionObserver` and from `teardown`.

Read "The concurrency rule this phase depends on" above before writing `tick`. The ordering inside it is load-bearing, not stylistic.

- [ ] **Step 1: Add the failing tests**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('only one animation frame is ever in flight', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const requestLoop = source.slice(
    source.indexOf('function requestLoop'),
    source.indexOf('function stopLoop')
  )

  assert.match(
    requestLoop,
    /if \(frame\) return/,
    'a second scheduled frame would damp twice per frame and halve the easing time'
  )
  assert.match(requestLoop, /frame = requestAnimationFrame\(tick\)/)
})

test('the loop stops itself on convergence and can be restarted', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const tick = source.slice(source.indexOf('function tick'))

  assert.match(tick, /isConverged\(/)

  const beforeDamping = tick.slice(0, tick.indexOf('dampToward'))
  assert.match(
    beforeDamping,
    /if \(!current \|\| current\.disposed\) \{\s*frame = 0/,
    'the only early clear is the disposed guard'
  )

  assert.match(
    tick,
    /frame = settled \? 0 : requestAnimationFrame\(tick\)/,
    'otherwise the handle is decided after damping, so an event landing before this frame is seen by its convergence test'
  )
})

test('convergence snaps the rotation exactly onto the target', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const tick = source.slice(source.indexOf('function tick'))

  assert.match(
    tick,
    /rotation\.x = target\.x/,
    'damping approaches asymptotically; snapping avoids a permanent sub-epsilon offset'
  )
  assert.match(tick, /rotation\.y = target\.y/)
})

test('the loop damps both axes and draws through the phase 2 record', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const tick = source.slice(source.indexOf('function tick'))

  assert.match(tick, /dampToward\(rotation\.x,\s*target\.x\)/)
  assert.match(tick, /dampToward\(rotation\.y,\s*target\.y\)/)
  assert.match(tick, /lines\.rotation\.x = rotation\.x/)
  assert.match(tick, /current\.draw\(\)/)
})

test('the loop never runs without a live scene', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const tick = source.slice(source.indexOf('function tick'))

  assert.match(
    tick.slice(0, 200),
    /if \(!current \|\| current\.disposed\)/,
    'a frame queued before teardown must not touch a disposed renderer'
  )
})

test('there is no idle animation anywhere', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.doesNotMatch(source, /setInterval|setTimeout/)
  assert.doesNotMatch(source, /rotation\.[xy]\s*\+=/, 'no unconditional per-frame increment')

  const frames = source.match(/requestAnimationFrame\(/g) ?? []
  assert.equal(frames.length, 2, 'exactly two: the requestLoop guard and the tick re-arm')
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — `requestLoop`, `stopLoop`, and `tick` do not exist.

- [ ] **Step 3: Write the loop**

Add below the input handlers in `src/components/HeroKnot.astro`:

```js
  let frame = 0

  function requestLoop() {
    // Single-flight. A second in-flight frame would apply dampToward twice
    // per displayed frame, silently halving the easing time.
    if (frame) return
    frame = requestAnimationFrame(tick)
  }

  function stopLoop() {
    if (!frame) return
    cancelAnimationFrame(frame)
    frame = 0
  }

  function tick() {
    if (!current || current.disposed) {
      frame = 0
      return
    }

    rotation.x = dampToward(rotation.x, target.x)
    rotation.y = dampToward(rotation.y, target.y)

    const settled =
      isConverged(rotation.x, target.x) && isConverged(rotation.y, target.y)

    if (settled) {
      // Damping is asymptotic, so without this the pose would rest a
      // fraction below target forever.
      rotation.x = target.x
      rotation.y = target.y
    }

    current.lines.rotation.x = rotation.x
    current.lines.rotation.y = rotation.y
    current.draw()

    // Cleared only here, never at the top: an event that fired before this
    // frame has already updated `target`, so the convergence test above saw
    // it and this branch is not reached.
    frame = settled ? 0 : requestAnimationFrame(tick)
  }
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 33 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroKnot.astro tests/hero-knot-scene.test.mjs
git commit -m "feat: damp the hero knot toward its target and stop on arrival

Single-flight loop: requestLoop refuses to schedule a second frame,
because two chains would each damp once per frame and halve the easing
time without throwing anything.

tick clears the frame handle only when it decides to stop, so an event
that lands before a frame is seen by that frame's convergence test."
```

---

### Task 4: Viewport lifecycle and complete teardown

**Files:**
- Modify: `src/components/HeroKnot.astro`
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: `attachInput`, `detachInput`, `stopLoop`, `readScroll`, `updateTarget`, `teardown`.
- Produces: a `viewport` `IntersectionObserver` stored on the `current` record, and a `teardown()` that releases frames, listeners, and both observers. Phase 4 adds only the coarse-pointer condition around `attachInput`.

Three states, per the spec. The knot must be able to leave and re-enter each of them any number of times:

- **Running** — converging on a target.
- **Idle but listening** — converged, loop stopped, handlers still attached. Either handler restarts the loop. This is the resting state.
- **Torn down** — the hero has left the viewport. Loop stopped and input detached. Re-entering reattaches and returns to idle-but-listening.

On re-entry, scroll position has changed while the listener was detached, so `scrollProgress` is stale. Re-read it and refresh the target immediately rather than waiting for the next event, or the knot eases from a pose that no longer matches the page.

**Decision: `stopLoop()` leaves `rotation` wherever it froze. Do not snap it to the target on stop, and do not snap it on re-entry either.** The observer can stop the loop mid-ease, so the knot may be part-way through a large move when the hero leaves. Re-entry then eases from that intermediate pose to the freshly computed target, which is always smooth.

The tempting alternative — snap `rotation` to `target` on stop, or straight to the new target on re-entry, on the theory that nobody is watching — is wrong here. The observer uses `threshold: 0`, so it fires the moment a single pixel of the hero intersects. At that instant the knot can already be partly on screen, and a snap would be a visible jump. Easing is never wrong; snapping is wrong exactly when the user is looking. `teardown()` is the only place that resets the pose, because there the scene is genuinely gone.

- [ ] **Step 1: Add the failing tests**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('leaving the viewport detaches input and stops the loop', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /new IntersectionObserver\(/)
  assert.match(source, /isIntersecting/)
  assert.match(source, /stopLoop\(\)/)
  assert.match(source, /detachInput\(\)/)
})

test('re-entry refreshes stale scroll before easing', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const start = source.indexOf('new IntersectionObserver(')
  const region = source.slice(start, start + 600)

  assert.match(region, /attachInput\(\)/)
  assert.ok(
    region.indexOf('readScroll()') < region.indexOf('updateTarget()'),
    'scroll progress went stale while detached; read it before setting the target'
  )
})

test('teardown releases frames and listeners, not just GPU resources', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const teardown = source.slice(source.indexOf('function teardown'))

  assert.match(teardown, /stopLoop\(\)/)
  assert.match(teardown, /detachInput\(\)/)
  assert.match(teardown, /viewport\?\.disconnect\(\)/)
  assert.match(teardown, /observer\?\.disconnect\(\)/)
  assert.match(teardown, /renderer\?\.forceContextLoss\(\)/)
  assert.match(teardown, /current = null/)
})

test('a remount starts from the base pose, not the previous one', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const teardown = source.slice(source.indexOf('function teardown'))

  assert.match(
    teardown,
    /rotation\.x = BASE_POSE\.x/,
    'rotation and target are module scoped and outlive the swapped-out scene'
  )
  assert.match(teardown, /target\.x = BASE_POSE\.x/)
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — there is no `IntersectionObserver` in the component, and `teardown` mentions neither `stopLoop` nor `detachInput`.

- [ ] **Step 3: Observe the hero and wire the three states**

In `buildScene`, immediately after `observer.observe(hero)`, add:

```js
    const viewport = new IntersectionObserver(
      ([entry]) => {
        if (token.disposed) return

        if (entry.isIntersecting) {
          attachInput()
          // Scroll moved while the listener was detached, so the stored
          // progress is stale. Refresh it before easing anywhere.
          readScroll()
          updateTarget()
        } else {
          detachInput()
          stopLoop()
        }
      },
      { threshold: 0 }
    )
    viewport.observe(hero)
```

Add `viewport` to the `Object.assign(token, { ... })` call alongside `observer`.

- [ ] **Step 4: Complete the teardown**

Replace `teardown()` with:

```js
  function teardown() {
    if (!current) return

    // Marked first so an in-flight buildScene bails after its await instead
    // of attaching a renderer to a canvas that is about to be swapped out.
    current.disposed = true

    stopLoop()
    detachInput()

    current.viewport?.disconnect()
    current.observer?.disconnect()

    // dispose() frees the renderer's own caches and listeners but leaves the
    // WebGL context alive (verified in three.module.js). Only
    // forceContextLoss() calls WEBGL_lose_context.loseContext(), which is what
    // actually returns the context to the browser's ~16 slot budget.
    current.renderer?.forceContextLoss()
    current.renderer?.dispose()

    current.geometry?.dispose()
    current.material?.dispose()

    // pointer, rotation, and target are module scoped and outlive the scene.
    // Without this reset the next mount would inherit the previous page's
    // pose and ease visibly from it on arrival.
    pointer.x = 0
    pointer.y = 0
    scrollProgress = 0
    rotation.x = BASE_POSE.x
    rotation.y = BASE_POSE.y
    target.x = BASE_POSE.x
    target.y = BASE_POSE.y

    current = null
  }
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 37 tests.

- [ ] **Step 6: Run the whole suite and build**

Run: `npm test && npm run build`

Expected: both succeed, with the Node stage reporting 78 tests: 41 from phase 1 and earlier, plus 37 in the component contract file.

- [ ] **Step 7: Commit**

```bash
git add src/components/HeroKnot.astro tests/hero-knot-scene.test.mjs
git commit -m "feat: detach the hero knot when the hero leaves the viewport

Three states, each re-enterable any number of times: running, idle but
listening, and torn down. Re-entry re-reads scroll before setting the
target, because progress went stale while the listener was detached.

teardown now releases the frame, the listeners, and both observers, and
resets the module scoped pose so a remount does not inherit the last
page's rotation."
```

---

## Acceptance

### Machine-checkable (the reviewer runs these)

- [ ] `npm run build` succeeds.
- [ ] `npm test` passes, reporting 78 Node tests and 9 Vitest tests.
- [ ] `ls dist/_astro/three.module.*.js && ! grep -rl "three.module" dist --include='*.html'` succeeds. The chunk is still bundled and still unreferenced by any HTML page. Never grep for the bare word `three` (it appears in page prose) or for `TorusKnotGeometry` (it appears in the component's own hoisted script, which *is* correctly linked).
- [ ] `git diff --stat <baseline>..HEAD` touches only `src/components/HeroKnot.astro` and `tests/hero-knot-scene.test.mjs`. Record `<baseline>` with `git rev-parse HEAD` before the first commit.
- [ ] `git diff <baseline>..HEAD -- src/scripts/ src/pages/` is empty. The motion module and the page are untouched.
- [ ] `grep -c "requestAnimationFrame(" src/components/HeroKnot.astro` returns exactly `2`.
- [ ] `! grep -nE "0\.06|1\.2|0\.35|768|innerHeight \* 0\.8" src/components/HeroKnot.astro` succeeds. No tested constant is duplicated in the component. The scroll factor is matched in context rather than as a bare `0.8`, so a future opacity or placement value cannot trip it spuriously.
- [ ] `! grep -nE "preventDefault|scrollTo|setInterval" src/components/HeroKnot.astro` succeeds. Scroll is never captured and nothing runs on a timer.
- [ ] The PR targets `feat/hero-knot-scene`, not `main`.

### Needs the user's eyes

Run `npm run dev`. None of these can be checked without a browser.

- [ ] Moving the cursor rotates the knot smoothly, and it appears to turn **toward** the pointer, not away from it. If it feels inverted, the axes were swapped at the call site; do not fix it by editing the motion module.
- [ ] The knot stops completely when the cursor stops. Watch for several seconds: no drift, no creep, no residual spin.
- [ ] Scrolling rotates the knot, and the page scrolls at entirely normal speed. Nothing is pinned, slowed, or captured.
- [ ] **Scroll down a little, then move the cursor. The knot must not snap.** This is the summed-input behaviour that differs from the approved prototype, which the spec requires be looked at on screen before the work is called done.
- [ ] Repeat that combination several times in different orders. The motion envelope should feel like the prototype's even though the inputs now sum.
- [ ] Let the knot settle, then move the cursor again. It must move. Repeat five or more times: the loop has to leave idle every time, not freeze after the first settle.
- [ ] Scroll the hero fully out of view, then back. The knot still responds to the cursor. Repeat several times.
- [ ] With the performance panel recording while the knot is settled and untouched, there is **no** ongoing frame activity from this component.

### Carried from phase 2, still outstanding

None of these have been run yet, and they block the eventual merge to `main`:

- [ ] Eight or more `/` → `/work` → `/` round trips with no WebGL context warnings.
- [ ] Hard reload onto `/work`, then navigate to `/`; the knot mounts.
- [ ] Reduced motion emulated: nothing renders and the `three.module` chunk is never requested.
- [ ] Knot visible and readable at desktop width, title and tagline unobstructed.

---

## Not in this phase

- The coarse-pointer branch. Cursor listeners attach unconditionally here; phase 4 makes that conditional.
- The deferred mobile-density decision and confirming the provisional narrow placement constants. Both phase 4.
- Rebuilding geometry on resize. Still a phase 4 call.
- Any change to `src/scripts/hero-knot-motion.mjs`, the hero copy, or the sections below the hero.
