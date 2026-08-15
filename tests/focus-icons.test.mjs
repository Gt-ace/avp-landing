import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

test('the icon never reaches a screen reader', async () => {
  // Upstream renders <div role="img" aria-label="route">, so a reader would
  // announce "route, Process automations". aria-hidden on our own wrapper
  // hides that whole subtree; the row's text is the accessible name.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.match(source, /aria-hidden="true"/)
  assert.match(
    source,
    /class="focus-icon"/,
    'global.css hangs the reduced-motion neutraliser off this class'
  )
})

test('a visitor who asked for less motion gets none of it', async () => {
  // No file in @jis3r/icons@2.9.0 references prefers-reduced-motion, so the
  // guard is entirely ours: never start the animation here, and neutralise
  // the upstream keyframes in global.css.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(
    source,
    /matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/
  )
})

test('the run is released so hover can replay it', async () => {
  // Upstream's mouseenter handler early-returns while `animate` is true.
  // Holding it true forever would animate once and then go permanently inert.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.match(source, /animate = true/)
  assert.match(source, /animate = false/)
})

test('only the three chosen icons are pulled in', async () => {
  // A barrel import of @jis3r/icons would put 555 components in the graph and
  // lean on tree-shaking to take them back out.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.doesNotMatch(
    source,
    /from '@jis3r\/icons'/,
    'import the subpaths, not the barrel'
  )
  for (const icon of ['layout-panel-left', 'route', 'cpu']) {
    assert.match(source, new RegExp(`@jis3r/icons/icons/${icon}`))
  }
})

test('the three focus rows carry their icons in reading order', async () => {
  const source = await read('../src/pages/about.astro')

  assert.match(
    source,
    /import FocusIcon from '\.\.\/components\/focus\/FocusIcon\.svelte'/
  )

  const rows = [...source.matchAll(/icon="([^"]+)"\s+delay=\{(\d+)\}/g)].map(
    ([, icon, delay]) => [icon, Number(delay)]
  )

  assert.deepEqual(rows, [
    ['layout-panel-left', 0],
    ['route', 80],
    ['cpu', 160],
  ])
})

test('the runtime is not fetched by a visitor who never scrolls that far', async () => {
  const source = await read('../src/pages/about.astro')

  const directives = [...source.matchAll(/client:(\w+)/g)].map(([, d]) => d)

  assert.deepEqual(
    directives,
    ['visible', 'visible', 'visible'],
    'client:visible is also what makes "in view" true at mount, which is the reveal trigger'
  )
})

test('the focus list still names its category once, in three bare rows', async () => {
  // payload-hygiene.test.mjs counts these exactly. Restating it here so the
  // reason a bare <li> matters is next to the markup that has to keep it.
  const source = await read('../src/pages/about.astro')
  const markup = source.split('<style>')[0]

  assert.equal((markup.match(/>Focus</g) ?? []).length, 1)
  assert.equal((markup.match(/<li>/g) ?? []).length, 3)
})

test('the icon column does not squeeze the labels on a phone', async () => {
  const source = await read('../src/pages/about.astro')
  const row = source.match(/\.about-focus li \{([^}]*)\}/)

  assert.ok(row, 'about.astro has no .about-focus li rule')
  assert.match(
    row[1],
    /grid-template-columns: auto 1fr/,
    'an auto icon column plus a fluid text column, so the label takes the slack'
  )
})

test('a hover cannot start a run that reduced motion asked not to happen', async () => {
  // The script guard in FocusIcon only covers the reveal. The upstream
  // component starts its own run on mouseenter, inside styles this project
  // cannot edit, so the neutraliser has to be global and !important.
  const css = await read('../src/styles/global.css')
  // global.css has exactly one reduced-motion block and the new rule goes
  // inside it, so a first-match regex is the right assertion. A second
  // @media block would make this pass or fail on source order.
  const blocks = [
    ...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g),
  ]

  assert.equal(blocks.length, 1, 'one reduced-motion block, not two')
  assert.match(blocks[0][1], /\.focus-icon \*/)
  assert.match(blocks[0][1], /animation: none !important/)
})
