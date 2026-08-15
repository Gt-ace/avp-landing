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
