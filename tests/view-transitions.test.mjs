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
