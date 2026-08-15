import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
  const layout = await read('../src/layouts/BaseLayout.astro')
  const curves = new Set(
    [...layout.matchAll(/cubic-bezier\(([^)]*)\)/g)].map(([, args]) =>
      args.replace(/\s+/g, '')
    )
  )

  assert.deepEqual(
    [...curves],
    ['0.16,1,0.3,1'],
    'the site has one easing curve; a second one in the layout is a fork'
  )
})
