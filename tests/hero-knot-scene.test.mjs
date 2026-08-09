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
  assert.doesNotMatch(
    source,
    /<canvas[^>]*>\s*[^<\s][\s\S]*?<\/canvas>/,
    'canvas carries no fallback text'
  )
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
  assert.doesNotMatch(
    source,
    /getContext\(['"]webgl['"]\)/,
    'Three.js no longer supports WebGL 1, so the gate must not permit it'
  )
  assert.match(source, /WEBGL_lose_context/, 'the probe context is released')
})

test('the dynamic Three import directly selects TorusKnotGeometry', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(
    source,
    /const\s*\{[\s\S]*?TorusKnotGeometry,[\s\S]*?\}\s*=\s*await import\(['"]three['"]\)/,
    'named destructuring lets Rollup exclude unused Three.js exports'
  )
  assert.match(source, /new TorusKnotGeometry\(/)
  assert.doesNotMatch(
    source,
    /three\s*\[/,
    'computed namespace access prevents Rollup from tree-shaking exports'
  )
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

test('phase 2 draws no animation loop or intersection observer', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.doesNotMatch(source, /requestAnimationFrame/)
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

test('the scene is built once from the approved geometry values', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /TorusKnotGeometry\(\s*1\.4,\s*0\.42,/)
  assert.match(source, /2,\s*3\s*\)/, 'p = 2 and q = 3')
  assert.match(source, /0x1a1a1f/)
  assert.match(source, /const OPACITY = 0\.55/)
  assert.match(source, /opacity:\s*OPACITY/)
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
