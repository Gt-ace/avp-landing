import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

test('the pill opens on hover and closes when the pointer leaves', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(source, /onMouseEnter=\{\(\) => setIsOpen\(true\)\}/)
  assert.match(source, /onMouseLeave=\{\(\) => setIsOpen\(false\)\}/)
})

test('a mouse click never opens the pill', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.doesNotMatch(
    source,
    /onClick=\{\(\) => setIsOpen\(true\)\}/,
    'a container click handler fires when a nav link is clicked, which reopened the pill on the way out'
  )
  assert.match(
    source,
    /e\.pointerType !== 'mouse' && !isOpen/,
    'touch still needs a way in: the static nav is hidden whenever JS runs'
  )
})

test('selecting a link collapses the pill', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(
    source,
    /href=\{href\}\s*\n\s*onClick=\{\(\) => setIsOpen\(false\)\}/,
    'each nav link closes the pill on click'
  )
})

test('client-side navigation collapses the pill', async () => {
  const source = await read('../src/components/NavPill.tsx')
  const handler = source.slice(
    source.indexOf('const handler = () =>'),
    source.indexOf("document.addEventListener('astro:page-load'")
  )

  assert.match(
    handler,
    /setIsOpen\(false\)/,
    'view transitions can carry this island across a swap with its state intact'
  )
})
