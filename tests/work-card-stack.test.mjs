import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('work project card is one semantic link with only a visible title', async () => {
  const source = await readFile(
    new URL(
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(source, /<a/)
  assert.match(source, /href=\{card\.href\}/)
  assert.match(source, /aria-label=\{card\.title\}/)
  assert.match(source, /card\.media\.kind === ['"]image['"] /)
  assert.match(source, /<video/)
  assert.match(source, /poster=\{card\.media\.poster\}/)
  assert.match(source, /aria-hidden="true"[\s\S]*\{card\.title\}/)
  assert.doesNotMatch(source, /card\.(client|year|description|tech|credits)/)
  assert.doesNotMatch(source, /\bautoplay\b/i)
})

test('work index maps project data into the static card stack', async () => {
  const page = await readFile(
    new URL('../src/pages/work/index.astro', import.meta.url),
    'utf8',
  )
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )
  const detail = await readFile(
    new URL('../src/pages/work/[slug].astro', import.meta.url),
    'utf8',
  )

  assert.match(page, /toWorkCards\(projects\)/)
  assert.match(page, /<WorkCardStack cards=\{cards\} \/>/)
  assert.doesNotMatch(page, /project-row/)
  assert.doesNotMatch(page, /project\.description/)
  assert.match(stack, /cards\.map/)
  assert.match(stack, /<WorkProjectCard/)
  assert.doesNotMatch(stack, /client:/)
  assert.match(detail, /class="detail-layout"/)
  assert.match(detail, /Visit project/)
})
