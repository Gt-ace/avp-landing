import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

test('the page fade and the card morph run to the same clock', async () => {
  // Naming only the groups once left the outgoing page gone at the UA default
  // 250ms while the morph still had time to run. The two numbers have to move
  // together or the swap smears.
  const layout = await read('../src/layouts/BaseLayout.astro')
  const detail = await read('../src/pages/work/[slug].astro')

  const groupDuration = layout.match(/animation-duration: (\d+)ms/)?.[1]
  const morphDuration = detail.match(/fade\(\{ duration: (\d+) \}\)/)?.[1]

  assert.equal(groupDuration, '300', 'the site-wide view transition is 300ms')
  assert.equal(morphDuration, '300', 'the /work card morph is 300ms')
  assert.equal(groupDuration, morphDuration)
})

test('the one easing curve is not forked', async () => {
  // A future edit in any source file—index.astro, contact.astro, global.css,
  // a new component—could fork the curve. The invariant is site-wide, so the
  // test must scan the entire src/ tree, not just the layout. This catches
  // both `cubic-bezier(...)` literals in CSS/JSX and confirms no second curve
  // was introduced anywhere.
  const testDir = dirname(fileURLToPath(import.meta.url))
  const srcDirPath = join(testDir, '..', 'src')
  const files = await readdir(srcDirPath, { recursive: true, withFileTypes: true })

  const sourceExtensions = new Set(['.astro', '.css', '.tsx', '.ts', '.svelte', '.jsx', '.js'])
  const curves = new Set()

  for (const file of files) {
    if (!file.isFile()) continue

    const ext = file.name.slice(file.name.lastIndexOf('.'))
    if (!sourceExtensions.has(ext)) continue

    const filePath = join(file.parentPath, file.name)
    const content = await readFile(filePath, 'utf8')

    const matches = [...content.matchAll(/cubic-bezier\(([^)]*)\)/g)]
    for (const [, args] of matches) {
      curves.add(args.replace(/\s+/g, ''))
    }
  }

  assert.deepEqual(
    [...curves].sort(),
    ['0.16,1,0.3,1'],
    'the site has one easing curve; a second one anywhere in src/ is a fork'
  )
})

test('the direction comes off an attribute that survives the swap', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')

  // Astro's `swapRootAttributes` strips every attribute off <html> mid-swap
  // and puts back only the incoming document's plus the `data-astro-*` ones,
  // and it does that inside the startViewTransition callback, before the
  // pseudo-elements are styled. Recording the direction ourselves under any
  // other name is therefore erased before it can be read.
  assert.doesNotMatch(
    layout,
    /data-nav-direction|navDirection|__avpNavDirectionHooked/,
    'a hand-rolled direction attribute does not survive the root attribute swap'
  )
})

test('a link can opt into the reverse direction Astro would not otherwise give it', async () => {
  // Astro's router hardcodes 'forward' for every link click; only the
  // browser back/forward gesture produces 'back'. astro:before-preparation
  // fires synchronously and its event.direction is read by router.js only
  // after the listener returns, so a listener here can still override it in
  // time -- this does not touch the data-astro-transition attribute itself,
  // Astro still sets that from the (possibly overridden) direction.
  const layout = await read('../src/layouts/BaseLayout.astro')

  assert.match(layout, /astro:before-preparation/)
  assert.match(
    layout,
    /event\.sourceElement\?\.dataset\.transitionDirection/,
    'the override reads an explicit opt-in off the clicked element, not a /work/* URL pattern'
  )
  assert.match(layout, /event\.direction = forced/)
})

test('the "All work" link is the one that opts in', async () => {
  // The nav pill's WORK link can be clicked from any page, not only a detail
  // page, so it stays plain forward navigation. Only this link is a same-site
  // back affordance.
  const detail = await read('../src/pages/work/[slug].astro')

  assert.match(detail, /data-transition-direction="back"/)
})

test('back reverses the direction instead of cross-fading', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')

  // `(*)` and not `(root)`: /work/[slug] names its title and hero image, which
  // lifts them out of the root snapshot, and on the way back nothing on /work
  // carries those names. Scoped to root they were left fading in place while
  // the page slid away underneath them.
  assert.match(
    layout,
    /\[data-astro-transition='back'\]::view-transition-old\(\*\)/,
    'the outgoing page needs its own rule, scoped by an attribute so it beats the (*) default'
  )
  assert.match(
    layout,
    /\[data-astro-transition='back'\]::view-transition-new\(\*\)/
  )

  const out = layout.match(
    /\[data-astro-transition='back'\]::view-transition-old\(\*\)\s*\{([^}]*)\}/
  )[1]
  const into = layout.match(
    /\[data-astro-transition='back'\]::view-transition-new\(\*\)\s*\{([^}]*)\}/
  )[1]

  assert.match(out, /200ms/, 'the outgoing page leaves faster than the new one arrives')
  assert.match(into, /300ms/)
  assert.doesNotMatch(
    out,
    /ease-in\b/,
    'ease-in delays the exact frames the visitor is watching'
  )
})

test('reduced motion still wins over the directional rules', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')
  const guard = layout.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n  \}/
  )

  assert.ok(guard, 'the layout has no reduced-motion block')
  assert.match(
    guard[1],
    /animation: none !important/,
    'only !important beats an attribute-scoped rule'
  )

  // The other half of the relationship: this only holds because the back
  // rules carry no !important of their own. If one did, both sides would be
  // important and the cascade would fall through to source order, where
  // reduced motion is not guaranteed to win.
  const out = layout.match(
    /\[data-astro-transition='back'\]::view-transition-old\(\*\)\s*\{([^}]*)\}/
  )[1]
  const into = layout.match(
    /\[data-astro-transition='back'\]::view-transition-new\(\*\)\s*\{([^}]*)\}/
  )[1]

  assert.doesNotMatch(out, /!important/, 'source order, not !important, must decide this')
  assert.doesNotMatch(into, /!important/, 'source order, not !important, must decide this')
})
