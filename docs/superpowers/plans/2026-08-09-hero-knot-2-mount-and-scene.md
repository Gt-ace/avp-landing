# Hero Knot Phase 2: Mount and Static Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a visible wireframe torus knot in the homepage hero at its base pose, mounted behind a render gate that never downloads Three.js when the knot will not be shown, and torn down correctly across client-side navigation.

**Architecture:** `HeroKnot.astro` contributes an `aria-hidden` canvas and a module script. The script asks the already-tested `hero-knot-motion.mjs` whether to render, and only then dynamically imports Three.js, builds the scene once, and draws a single frame. There is no animation loop and no input handling in this phase. Because the site runs Astro's `ViewTransitions`, the mount is idempotent and disposes itself on `astro:before-swap`.

**Tech Stack:** Astro 4 with `ViewTransitions`, Three.js 0.185.1 via dynamic `import()`, plain ESM, Node built-in test runner.

## Global Constraints

- Design authority: `docs/superpowers/specs/2026-08-09-hero-wireframe-knot-design.md`. The prototype at `docs/superpowers/specs/2026-08-09-hero-wireframe-knot-prototype.html` is reference material only. Do not copy its structure.
- Work on branch `feat/hero-knot-scene`. Phases 2, 3, and 4 stack on this branch; it merges to `main` once, after phase 4. **Do not open a PR against `main` from this phase.** Open the phase 2 PR with `feat/hero-knot-scene` as its base, from a working branch named `feat/hero-knot-scene-p2`, so each phase still gets its own review gate without deploying. The final `feat/hero-knot-scene` → `main` PR happens after phase 4 and is the only one that triggers a production deploy.
- Phase 1 is already merged. `src/scripts/hero-knot-motion.mjs` exists and is tested. **Do not modify it in this phase**, and do not duplicate any constant it already exports. Import what you need.
- **No lights.** The prototype adds an `AmbientLight` and two `DirectionalLight`s. `LineBasicMaterial` is unlit and ignores every one of them, so porting them adds scene-graph cost and reviewer confusion for zero pixels. Do not add any light.
- **No static `import ... from 'three'` anywhere in `src/`.** The only permitted reference is a dynamic `import('three')`, and it must sit after the `shouldRender` gate has returned `'animated'`. A static import puts the 129 KB chunk in the initial graph and defeats the entire loading design.
- No animation loop, no `requestAnimationFrame`, no `mousemove`/`scroll` listeners, no `IntersectionObserver` in this phase. Phase 3 owns all of them. This phase draws exactly one frame per layout change.
- No React island, no GSAP, no Lenis for this feature at any phase.
- No change to the hero title, tagline, scroll cue, their entrance animations, the navigation, or any section below the hero. This change adds a canvas and nothing else.
- Renderer pixel ratio is capped with `Math.min(devicePixelRatio, 2)`. Do not lower the cap for performance; it visibly thickens the lines and changes the approved look.
- Values copied verbatim from the spec, not to be tuned: `TorusKnotGeometry(1.4, 0.42, tubular, radial, 2, 3)`, colour `0x1a1a1f`, `opacity: 0.55`, camera `PerspectiveCamera(45, aspect, 0.1, 100)`. Segment counts, placement, and the render decision all come from `hero-knot-motion.mjs`.

---

## Why this phase carries lifecycle work

`src/layouts/BaseLayout.astro` renders `<ViewTransitions />`, so every page swap is client-side. Two consequences drive the design below, and both were verified against `node_modules/astro/dist/transitions/router.js` rather than assumed:

1. **A bundled `<script>` in an `.astro` file is a module, and modules do not re-execute on client-side navigation.** Navigating `/` → `/work` → `/` yields a fresh canvas element in the swapped-in DOM with no mount code running against it. The knot would silently vanish and never come back. This is why `src/pages/index.astro` re-arms its reveal and bigtype scripts on `astro:page-load`.

2. **`astro:page-load` also fires on the *initial* page load.** The router registers `addEventListener("load", onPageLoad)` at module init (`router.js:389`). So the repo's existing pattern — call the arm function directly, *and* subscribe to `astro:page-load` — calls it twice on first paint. That is harmless for idempotent reveal code. For a WebGL mount it means two `WebGLRenderer` instances on first paint. Browsers cap live WebGL contexts at roughly 16 and silently drop the oldest, with nothing thrown.

The mount must therefore be **idempotent**, and it must **dispose on `astro:before-swap`**. The guard used below is a `data-` flag written onto the canvas element itself, set synchronously before any `await`. This is deliberate: after a view transition the canvas is a genuinely new element with no flag, so a real remount proceeds, while a double-fire against the same element is blocked. A module-level boolean cannot distinguish those two cases.

---

## File Structure

- Create `src/components/HeroKnot.astro`: the canvas element, its scoped positioning styles, and the mount script holding all Three.js scene wiring. One file, because the canvas markup, its stacking context, and the code that draws into it always change together.
- Modify `src/pages/index.astro`: import `HeroKnot` and render it as the first child of `<section class="hero">`. No other change to this file.
- Create `tests/hero-knot-scene.test.mjs`: source-level contract tests. The deliverable is visual, but the loading rules, the accessibility attributes, the gate ordering, and the lifecycle wiring are all textual facts about the source and are checkable without a browser.

---

### Task 1: The canvas, the render gate, and the page wiring

**Files:**
- Create: `src/components/HeroKnot.astro`
- Modify: `src/pages/index.astro`
- Create: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: `shouldRender`, `getPlacement`, `getSegmentCounts`, and `BASE_POSE` from `src/scripts/hero-knot-motion.mjs`.
- Produces: a `<canvas data-hero-knot aria-hidden="true">` inside `section.hero`, and a module-scoped `mount()` that returns without importing Three.js when the gate says `'none'`. Phase 3 attaches its listeners inside this same script and reuses the `current` instance record defined here.

- [ ] **Step 1: Write the failing source contract tests**

Create `tests/hero-knot-scene.test.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) =>
  readFile(new URL(relative, import.meta.url), 'utf8')

test('the knot canvas is decorative and unreachable by keyboard', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /<canvas[^>]*aria-hidden="true"/)
  assert.match(source, /<canvas[^>]*data-hero-knot/)
  assert.doesNotMatch(source, /tabindex/)
  assert.doesNotMatch(source, /<canvas[^>]*>[^<]*\S/, 'canvas carries no content')
})

test('the canvas fills the hero beneath the existing content layer', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /position:\s*absolute/)
  assert.match(source, /inset:\s*0/)
  assert.match(source, /pointer-events:\s*none/)

  const zIndex = source.match(/z-index:\s*(\d+)/)
  assert.ok(zIndex, 'the canvas sets an explicit z-index')
  assert.ok(
    Number(zIndex[1]) < 2,
    `z-index ${zIndex[1]} must sit below the hero content layer at 2`
  )
})

test('three is only ever reached through a dynamic import', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.doesNotMatch(
    source,
    /^\s*import\s[^\n]*from\s+['"]three['"]/m,
    'a static three import would put the chunk in the initial graph'
  )
  assert.match(source, /await import\(['"]three['"]\)/)
})

test('the render gate is consulted before three is fetched', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  const gate = source.indexOf('shouldRender(')
  const dynamicImport = source.indexOf("import('three')")

  assert.ok(gate !== -1, 'the component calls shouldRender')
  assert.ok(dynamicImport !== -1, 'the component dynamically imports three')
  assert.ok(
    gate < dynamicImport,
    'shouldRender must be called before import(three), or a reduced-motion visitor downloads 129 KB for nothing'
  )
  assert.match(source, /=== 'none'\)\s*return/)
})

test('the gate reads reduced motion and probes for WebGL', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /prefers-reduced-motion:\s*reduce/)
  assert.match(source, /getContext\(['"]webgl2['"]\)/)
  assert.match(source, /WEBGL_lose_context/, 'the probe context is released')
})

test('policy lives in the motion module, not in the component', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /from\s+['"]\.\.\/scripts\/hero-knot-motion\.mjs['"]/)
  assert.match(source, /getPlacement\(/)
  assert.match(source, /getSegmentCounts\(/)
  assert.doesNotMatch(source, /1\.2|0\.06|768/, 'no motion constant is duplicated here')
})

test('the unlit wireframe material gets no lights', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.doesNotMatch(source, /AmbientLight|DirectionalLight|PointLight|HemisphereLight/)
  assert.match(source, /WireframeGeometry/)
  assert.match(source, /LineSegments/)
  assert.match(source, /LineBasicMaterial/)
})

test('phase 2 draws no animation loop and captures no input', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.doesNotMatch(source, /requestAnimationFrame/)
  assert.doesNotMatch(source, /addEventListener\(['"](mousemove|scroll|pointermove)['"]/)
  assert.doesNotMatch(source, /IntersectionObserver/)
})

test('the hero renders the knot behind its existing content', async () => {
  const page = await read('../src/pages/index.astro')

  assert.match(page, /import HeroKnot from '\.\.\/components\/HeroKnot\.astro'/)
  assert.match(
    page,
    /<section class="hero">\s*<HeroKnot \/>/,
    'the canvas is the first child of the hero section'
  )
  assert.ok(
    page.indexOf('<HeroKnot />') < page.indexOf('class="hero-content"'),
    'the canvas paints before the title and tagline'
  )
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — `src/components/HeroKnot.astro` does not exist, so `readFile` rejects with `ENOENT`.

- [ ] **Step 3: Create the component with its gate and a placeholder scene body**

Create `src/components/HeroKnot.astro`:

```astro
---
---
<canvas class="hero-knot" data-hero-knot aria-hidden="true"></canvas>

<style>
  .hero-knot {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>

<script>
  import {
    BASE_POSE,
    getPlacement,
    getSegmentCounts,
    shouldRender,
  } from '../scripts/hero-knot-motion.mjs'

  const INK = 0x1a1a1f
  const OPACITY = 0.55

  /** The live scene, or null. Phase 3 reads and extends this record. */
  let current = null

  function hasWebGL() {
    try {
      const probe = document.createElement('canvas')
      const gl = probe.getContext('webgl2') || probe.getContext('webgl')
      if (!gl) return false
      // Release the probe's context immediately: it counts against the same
      // per-browser context cap this detection exists to protect.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      return true
    } catch {
      return false
    }
  }

  async function mount() {
    const canvas = document.querySelector('canvas[data-hero-knot]')
    if (!canvas || canvas.dataset.knotMounted === 'true') return

    // Set synchronously, before any await, so a double fire cannot race
    // through the gate and construct two renderers.
    canvas.dataset.knotMounted = 'true'

    const prefersReducedMotion = matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (shouldRender(prefersReducedMotion, hasWebGL()) === 'none') return

    await buildScene(canvas)
  }

  async function buildScene(canvas) {
    // Task 2 fills this in.
  }

  mount()
</script>
```

- [ ] **Step 4: Wire the component into the hero**

In `src/pages/index.astro`, add the import beneath the existing `BigTypeRoll` import in the frontmatter:

```astro
import HeroKnot from '../components/HeroKnot.astro'
```

Then make the canvas the first child of the hero section. The section currently opens:

```astro
  <section class="hero">
    <div class="hero-content">
```

It must become:

```astro
  <section class="hero">
    <HeroKnot />

    <div class="hero-content">
```

Change nothing else in this file.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 9 tests. The scene body is still empty, so nothing is visible yet; the contract tests cover the gate and the wiring, which are complete.

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroKnot.astro src/pages/index.astro tests/hero-knot-scene.test.mjs
git commit -m "feat: add the hero knot canvas and render gate

The canvas is decorative and sits below the hero content layer. Three.js
is not imported until shouldRender has returned 'animated', so a
reduced-motion visitor or one without WebGL never fetches the chunk."
```

---

### Task 2: The wireframe scene

**Files:**
- Modify: `src/components/HeroKnot.astro`
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: the `buildScene(canvas)` stub and the `current` binding from Task 1.
- Produces: a populated `current` record with the shape `{ canvas, disposed, renderer, geometry, material, camera, scene, lines, observer, draw }`. Phase 3 calls `current.draw()` from its animation loop and mutates `current.lines.rotation`.

Geometry note: `WireframeGeometry` copies the torus knot's edges into a new geometry. The source `TorusKnotGeometry` is not rendered afterwards and must be disposed immediately, or it leaks a GPU buffer for the life of the page.

- [ ] **Step 1: Add the failing scene tests**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('the scene is built once from the approved geometry values', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /TorusKnotGeometry\(\s*1\.4,\s*0\.42,/)
  assert.match(source, /2,\s*3\s*\)/, 'p = 2 and q = 3')
  assert.match(source, /0x1a1a1f/)
  assert.match(source, /opacity:\s*0\.55/)
  assert.match(source, /transparent:\s*true/)
})

test('the renderer is transparent, antialiased, and ratio capped at 2', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /alpha:\s*true/)
  assert.match(source, /antialias:\s*true/)
  assert.match(source, /Math\.min\(devicePixelRatio,\s*2\)/)
})

test('the source torus geometry is released after the wireframe is taken', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  const knot = source.indexOf('TorusKnotGeometry(')
  const wireframe = source.indexOf('WireframeGeometry(')
  const dispose = source.indexOf('.dispose()')

  assert.ok(knot < wireframe, 'the wireframe is derived from the knot')
  assert.ok(
    wireframe < dispose,
    'the source knot geometry is disposed once the wireframe exists'
  )
})

test('the camera matches the approved projection', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /PerspectiveCamera\(\s*45,/)
  assert.match(source, /0\.1,\s*100\s*\)/)
  assert.match(source, /cameraZ/)
})

test('sizing is measured by observer, never per frame', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /ResizeObserver/)
  assert.match(source, /updateProjectionMatrix\(\)/)
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — `buildScene` is an empty stub, so none of `TorusKnotGeometry`, `PerspectiveCamera`, or `ResizeObserver` appear in the source.

- [ ] **Step 3: Implement the scene**

Replace the `buildScene` stub in `src/components/HeroKnot.astro` with:

```js
  async function buildScene(canvas) {
    const hero = canvas.parentElement
    if (!hero) return

    const token = { canvas, disposed: false }
    current = token

    const {
      LineBasicMaterial,
      LineSegments,
      PerspectiveCamera,
      Scene,
      TorusKnotGeometry,
      WebGLRenderer,
      WireframeGeometry,
    } = await import('three')

    // The page may have navigated away while the chunk was in flight.
    if (token.disposed) return

    // One source of truth for dimensions: the hero box, with the viewport as
    // a fallback for the pre-layout case. Mixing innerWidth here with
    // hero.clientWidth in resize() would disagree by the scrollbar width and
    // could straddle the 768px breakpoint.
    const initialWidth = hero.clientWidth || innerWidth
    const initialHeight = hero.clientHeight || innerHeight

    const segments = getSegmentCounts(initialWidth)
    const placement = getPlacement(initialWidth, initialHeight)

    const knot = new TorusKnotGeometry(
      1.4,
      0.42,
      segments.tubular,
      segments.radial,
      2,
      3
    )
    const geometry = new WireframeGeometry(knot)
    // Only the wireframe is drawn; the solid knot would otherwise hold a GPU
    // buffer for the life of the page.
    knot.dispose()

    const material = new LineBasicMaterial({
      color: INK,
      transparent: true,
      opacity: OPACITY,
    })

    const lines = new LineSegments(geometry, material)
    lines.position.set(placement.x, placement.y, 0)
    lines.rotation.set(BASE_POSE.x, BASE_POSE.y, 0)

    const scene = new Scene()
    scene.add(lines)

    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0, placement.cameraZ)

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

    const draw = () => renderer.render(scene, camera)

    const resize = () => {
      if (token.disposed) return

      const width = hero.clientWidth
      const height = hero.clientHeight
      if (!width || !height) return

      const next = getPlacement(width, height)
      lines.position.set(next.x, next.y, 0)
      camera.position.setZ(next.cameraZ)

      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      draw()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(hero)

    Object.assign(token, {
      renderer,
      geometry,
      material,
      scene,
      camera,
      lines,
      observer,
      draw,
    })

    resize()
  }
```

Note `renderer.setSize(width, height, false)`: the third argument stops Three.js writing inline `width`/`height` styles onto the canvas, which would override the scoped CSS that stretches it across the hero.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 14 tests.

- [ ] **Step 5: Verify it builds and the chunk stays out of the HTML**

Run:

```bash
npm run build
ls dist/_astro/three.module.*.js
grep -rl "three.module" dist --include='*.html'
```

Expected: the build succeeds, `ls` names exactly one `dist/_astro/three.module.*.js` file (roughly 514 KB raw, 129 KB gzipped), and the `grep` prints **nothing** and exits non-zero. The Three.js chunk must not be referenced or preloaded from any built HTML page, or it stops being a runtime-only fetch and the title stops being the LCP element.

Two wrong ways to write this check, both of which have already produced a misleading result:

- `grep -rl "three" dist/**/*.html` matches the English word "three" in ordinary page prose.
- Grepping for `TorusKnotGeometry` to identify the chunk finds the **caller** — the component's own hoisted script, which contains that string as a destructured binding name and *is* correctly referenced from `index.html`. Match on the `three.module` chunk filename, which is the 514 KB payload that must stay unlinked.

To confirm the chunk is reachable at runtime rather than dead, check that the hoisted script imports it:

```bash
grep -l "three.module" dist/_astro/*.js
```

Expected: one `hoisted.*.js` file, the component's mount script.

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroKnot.astro tests/hero-knot-scene.test.mjs
git commit -m "feat: build the hero knot wireframe scene

One torus knot, wrapped as a wireframe and drawn unlit as LineSegments.
The source knot geometry is disposed as soon as the wireframe is taken.
Sizing comes from a ResizeObserver on the hero, and one frame is drawn
per layout change; the animation loop lands in phase 3."
```

---

### Task 3: Idempotent mount and view-transition teardown

**Files:**
- Modify: `src/components/HeroKnot.astro`
- Modify: `tests/hero-knot-scene.test.mjs`

**Interfaces:**
- Consumes: `mount()`, `buildScene()`, and the `current` record from Tasks 1 and 2.
- Produces: a `teardown()` that disposes the renderer, both geometry and material, and the `ResizeObserver`, plus listener registrations for `astro:page-load` and `astro:before-swap`. Phase 3 extends `teardown()` to also cancel its animation frame and remove its input listeners.

Read the "Why this phase carries lifecycle work" section above before implementing. The two facts that shape this task: a bundled module script does not re-execute on client-side navigation, and `astro:page-load` fires on the initial load as well as on every subsequent one.

- [ ] **Step 1: Add the failing lifecycle tests**

Append to `tests/hero-knot-scene.test.mjs`:

```js
test('the mount survives client-side navigation in both directions', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /addEventListener\('astro:page-load', mount\)/)
  assert.match(source, /addEventListener\('astro:before-swap', teardown\)/)
})

test('a repeated mount cannot build a second renderer', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(
    source,
    /dataset\.knotMounted === 'true'\)\s*return/,
    'the guard reads a flag on the canvas element'
  )

  const guard = source.indexOf("dataset.knotMounted = 'true'")
  const firstAwait = source.indexOf('await ')

  assert.ok(guard !== -1, 'the guard flag is written')
  assert.ok(
    guard < firstAwait,
    'the flag is set synchronously, before any await can yield'
  )
})

test('teardown releases every GPU resource the scene holds', async () => {
  const source = await read('../src/components/HeroKnot.astro')
  const teardown = source.slice(source.indexOf('function teardown'))

  assert.match(
    teardown,
    /renderer\?\.forceContextLoss\(\)/,
    'dispose() alone leaves the WebGL context alive'
  )
  assert.ok(
    teardown.indexOf('forceContextLoss') < teardown.indexOf('renderer?.dispose'),
    'the context is released before the renderer is disposed'
  )
  assert.match(teardown, /renderer\?\.dispose\(\)/)
  assert.match(teardown, /geometry\?\.dispose\(\)/)
  assert.match(teardown, /material\?\.dispose\(\)/)
  assert.match(teardown, /observer\?\.disconnect\(\)/)
  assert.match(teardown, /current = null/)
})

test('a teardown mid-import does not build an orphan scene', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /token\.disposed = true|disposed = true/)
  assert.match(
    source,
    /if \(token\.disposed\) return/,
    'buildScene bails after the dynamic import if it was torn down'
  )
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: FAIL — there is no `teardown` function and no `astro:` listener registration yet.

- [ ] **Step 3: Add teardown and the lifecycle registrations**

In `src/components/HeroKnot.astro`, add `teardown` immediately after `buildScene`:

```js
  function teardown() {
    if (!current) return

    // Marked first so an in-flight buildScene bails after its await instead
    // of attaching a renderer to a canvas that is about to be swapped out.
    current.disposed = true

    current.observer?.disconnect()

    // dispose() frees the renderer's own caches and listeners but leaves the
    // WebGL context alive (verified in three.module.js). Only
    // forceContextLoss() calls WEBGL_lose_context.loseContext(), which is what
    // actually returns the context to the browser's ~16 slot budget. Without
    // this line the teardown does not prevent the leak it exists to prevent.
    current.renderer?.forceContextLoss()
    current.renderer?.dispose()

    current.geometry?.dispose()
    current.material?.dispose()

    current = null
  }
```

Then replace the bare `mount()` call at the end of the script with:

```js
  mount()
  document.addEventListener('astro:page-load', mount)
  document.addEventListener('astro:before-swap', teardown)
```

The direct `mount()` call is kept deliberately, even though `astro:page-load` also fires on first load. The canvas `data-` guard makes the duplicate call free, and the direct call means the knot still appears if the router's `load` listener is ever missed. Belt and braces on a path where the failure mode is an invisible canvas.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/hero-knot-scene.test.mjs`

Expected: PASS, all 18 tests.

- [ ] **Step 5: Run the whole suite and build**

Run: `npm test && npm run build`

Expected: both succeed. The Node stage should now report 59 tests: 41 from before, plus 18 new.

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroKnot.astro tests/hero-knot-scene.test.mjs
git commit -m "fix: make the hero knot mount survive view transitions

Astro bundles this script as a module, so it does not re-execute on
client-side navigation and the knot would not come back after leaving
the homepage. astro:page-load remounts it and astro:before-swap
disposes the outgoing scene.

The guard is a data flag on the canvas rather than a module boolean:
astro:page-load also fires on the initial load, so mount runs twice on
first paint, and only an element-scoped flag tells a duplicate call
apart from a genuine remount onto a freshly swapped-in canvas."
```

---

## Acceptance

### Machine-checkable (the reviewer runs these)

- [ ] `npm run build` succeeds.
- [ ] `npm test` passes, reporting 59 Node tests and the existing 9 Vitest tests.
- [ ] The Three.js chunk is bundled but unreferenced by any HTML page. Run:

  ```bash
  ls dist/_astro/three.module.*.js && ! grep -rl "three.module" dist --include='*.html'
  ```

  Expected: succeeds. The chunk exists (the scene code is bundled) and is unreferenced by any HTML page, so it stays a runtime-only fetch and the title remains the LCP element. Match on the `three.module` chunk filename — never on the bare word `three`, which appears in page prose, and never on `TorusKnotGeometry`, which also appears in the component's own hoisted script that *is* correctly linked from `index.html`.
- [ ] `! grep -rE "^\s*import\s.*from\s+['\"]three['\"]" src/` succeeds. No static Three.js import exists anywhere in the source.
- [ ] `git diff --stat <baseline>..HEAD` touches only `src/components/HeroKnot.astro`, `src/pages/index.astro`, and `tests/hero-knot-scene.test.mjs`. Record `<baseline>` with `git rev-parse HEAD` before the first commit. Do not use `main...HEAD`; this branch carries the plan document ahead of `main`.
- [ ] `src/scripts/hero-knot-motion.mjs` is unmodified: `git diff <baseline>..HEAD -- src/scripts/` is empty.
- [ ] `grep -n "Light" src/components/HeroKnot.astro` prints nothing.

### Needs the user's eyes

Run `npm run dev` and open the homepage. The reviewer cannot check any of these.

- [ ] The knot is visible on the right side of the hero, and it is **still** — no idle rotation, no drift.
- [ ] The title and tagline are fully readable. The knot does not overlap the reading zone at a normal desktop width.
- [ ] Lines read as fine and deliberate, not chunky. If they look heavy, the cause is pixel ratio or opacity, not segment count; report rather than tune.
- [ ] Navigate `/` → `/work` → `/` **at least eight times in a row**, with the console open. The knot returns every time, and no "Too many active WebGL contexts" warning ever appears. **This is the ViewTransitions check and the single most likely thing to be broken.** One round trip is not enough: the browser cap is around 16 contexts, so a leak stays invisible until the budget runs out.
- [ ] Now the other direction. Hard-reload directly onto `/work`, then navigate to `/`. The knot must appear. This is a genuinely different mechanism from the check above: here the component's module script is executed for the first time on swap-in, rather than a persisted `astro:page-load` listener firing on an already-loaded module. Both paths must mount.
- [ ] Across those navigations the Three.js chunk is fetched exactly once in the network panel; subsequent mounts reuse the cached module.
- [ ] In devtools, emulate `prefers-reduced-motion: reduce` and hard-reload. No canvas content is drawn and the Three.js chunk is never requested in the network panel.
- [ ] Resize the window from wide to narrow. The knot re-places without distorting and never lands on top of the title.

Narrow-viewport placement uses the provisional values from phase 1 and is **confirmed in phase 4**, not here. Report how it looks; do not tune it in this phase.

---

## Verification debt carried forward

**Status as of the phase 2 merge into `feat/hero-knot-scene`: every machine-checkable item above passed. Not one needs-your-eyes item has been run.**

Merging into the integration branch banks the code; it does not discharge that debt, and it deploys nothing. But three of the outstanding items are the *only* way to confirm the lifecycle work this phase was built around, and no automated check can substitute:

- the eight-plus `/` → `/work` → `/` round trips, watching for WebGL context warnings
- the `/work`-first hard reload followed by navigation to `/`, which exercises first-time module execution on swap-in
- reduced motion emulated in devtools, confirming the `three.module` chunk is never requested

These, plus the remaining visual items (knot visible and still, text readable, line weight, resize behaviour), must all be run and confirmed **before `feat/hero-knot-scene` merges to `main`**, since that merge is the one that deploys. Plan 4's acceptance block repeats this list so it cannot be lost.

---

## Not in this phase

- The animation loop, damping, cursor and scroll listeners, convergence, and the `IntersectionObserver` viewport teardown. All phase 3.
- The coarse-pointer branch and the deferred mobile-density decision. Both phase 4.
- Rebuilding geometry on resize. Phase 2 computes segment counts once at mount; whether a wide-to-narrow resize should rebuild at mobile density is a phase 4 call.
- Confirming or tuning the provisional narrow placement constants. Phase 4.
- Any change to the hero title, tagline, scroll cue, or the sections below the hero, in any phase.
