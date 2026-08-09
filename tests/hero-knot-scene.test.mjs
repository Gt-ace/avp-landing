import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import * as motion from '../src/scripts/hero-knot-motion.mjs'

const read = (relative) =>
  readFile(new URL(relative, import.meta.url), 'utf8')

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

async function runFailedMount(failure) {
  const source = await read('../src/components/HeroKnot.astro')
  const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1]
  assert.ok(script, 'the component has an executable client script')

  const executable = script
    .replace(
      /import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\.\/scripts\/hero-knot-motion\.mjs['"]/,
      'const {$1} = motion'
    )
    .replace(/await import\(['"]three['"]\)/, 'await importThree()')

  const events = []
  const disposable = (name) => ({
    dispose() {
      events.push(`${name}:dispose`)
    },
  })

  class TorusKnotGeometry {
    dispose() {
      events.push('knot:dispose')
    }
  }

  class WireframeGeometry {
    constructor() {
      Object.assign(this, disposable('geometry'))
    }
  }

  class LineBasicMaterial {
    constructor() {
      Object.assign(this, disposable('material'))
    }
  }

  class LineSegments {
    position = { set() {} }
    rotation = { x: 0, y: 0, set() {} }
  }

  class Scene {
    add() {}
  }

  class PerspectiveCamera {
    position = { set() {}, setZ() {} }
    updateProjectionMatrix() {}
  }

  class WebGLRenderer {
    constructor() {
      if (failure === 'renderer') throw new Error('renderer failed')
    }
    setPixelRatio() {}
    render() {}
    setSize() {}
    forceContextLoss() {
      events.push('renderer:forceContextLoss')
    }
    dispose() {
      events.push('renderer:dispose')
    }
  }

  class ResizeObserver {
    observe() {
      if (failure === 'resize-observe') throw new Error('resize observe failed')
    }
    disconnect() {
      events.push('resize-observer:disconnect')
    }
  }

  class IntersectionObserver {
    observe() {
      if (failure === 'viewport-observe') {
        throw new Error('viewport observe failed')
      }
    }
    disconnect() {
      events.push('viewport-observer:disconnect')
    }
  }

  const hero = { clientWidth: 1200, clientHeight: 700 }
  const canvas = { dataset: {}, parentElement: hero }
  let queries = 0
  const document = {
    querySelector() {
      queries += 1
      return queries === 1 ? null : canvas
    },
    createElement() {
      return {
        getContext() {
          return {
            getExtension() {
              return { loseContext() {} }
            },
          }
        },
      }
    },
    addEventListener() {},
  }

  const makeComponent = new AsyncFunction(
    'motion',
    'importThree',
    'document',
    'matchMedia',
    'ResizeObserver',
    'IntersectionObserver',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'addEventListener',
    'removeEventListener',
    'innerWidth',
    'innerHeight',
    'devicePixelRatio',
    'scrollY',
    `${executable}\nreturn { mount }`
  )

  const component = await makeComponent(
    motion,
    async () => ({
      LineBasicMaterial,
      LineSegments,
      PerspectiveCamera,
      Scene,
      TorusKnotGeometry,
      WebGLRenderer,
      WireframeGeometry,
    }),
    document,
    () => ({ matches: false }),
    ResizeObserver,
    IntersectionObserver,
    () => 1,
    () => {},
    () => {},
    () => {},
    1200,
    700,
    2,
    0
  )

  await component.mount()
  return events
}

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

test('the viewport observer belongs to the lifecycle phase', async () => {
  const source = await read('../src/components/HeroKnot.astro')

  assert.match(source, /IntersectionObserver/)
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

test('a failed scene build releases every resource acquired before the failure', async () => {
  const rendererFailure = await runFailedMount('renderer')
  assert.ok(
    rendererFailure.includes('geometry:dispose'),
    'geometry acquired before renderer construction must belong to teardown'
  )
  assert.ok(
    rendererFailure.includes('material:dispose'),
    'material acquired before renderer construction must belong to teardown'
  )

  const resizeFailure = await runFailedMount('resize-observe')
  assert.ok(resizeFailure.includes('renderer:forceContextLoss'))
  assert.ok(resizeFailure.includes('renderer:dispose'))
  assert.ok(
    resizeFailure.includes('resize-observer:disconnect'),
    'the resize observer must belong to teardown before observe() can throw'
  )

  const viewportFailure = await runFailedMount('viewport-observe')
  assert.ok(viewportFailure.includes('renderer:dispose'))
  assert.ok(viewportFailure.includes('resize-observer:disconnect'))
  assert.ok(
    viewportFailure.includes('viewport-observer:disconnect'),
    'the viewport observer must belong to teardown before observe() can throw'
  )
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
    'ResizeObserver delivers the initial measurement; an explicit call would duplicate the initial draw'
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
