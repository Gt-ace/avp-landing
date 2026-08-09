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
