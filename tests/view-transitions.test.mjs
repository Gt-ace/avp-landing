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

test('the layout records which way the visitor is going', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')

  assert.match(
    layout,
    /astro:before-preparation/,
    'the attribute has to land before startViewTransition, which is what this event is awaited for'
  )
  assert.match(
    layout,
    /dataset\.navDirection = /,
    'the direction is read back from CSS, so it lives on the document element'
  )
  assert.match(
    layout,
    /__avpNavDirectionHooked/,
    'the swap re-runs inline scripts; the listener must only be added once'
  )
})

test('back reverses the direction instead of cross-fading', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')

  assert.match(
    layout,
    /\[data-nav-direction='back'\]::view-transition-old\(root\)/,
    'the outgoing page needs its own rule, scoped by an attribute so it beats the (*) default'
  )
  assert.match(
    layout,
    /\[data-nav-direction='back'\]::view-transition-new\(root\)/
  )

  const out = layout.match(
    /\[data-nav-direction='back'\]::view-transition-old\(root\)\s*\{([^}]*)\}/
  )[1]
  const into = layout.match(
    /\[data-nav-direction='back'\]::view-transition-new\(root\)\s*\{([^}]*)\}/
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
})
