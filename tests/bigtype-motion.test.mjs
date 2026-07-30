import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { calculateBigtypeShift } from '../src/scripts/bigtype-motion.mjs'

test('downward scrolling moves both big type lines equally in opposite directions', () => {
  const viewportHeight = 900
  const viewportWidth = 1440
  const scrollDelta = 180

  const topBefore = calculateBigtypeShift(1200, viewportHeight, viewportWidth, -0.35)
  const topAfter = calculateBigtypeShift(
    1200 - scrollDelta,
    viewportHeight,
    viewportWidth,
    -0.35
  )
  const bottomBefore = calculateBigtypeShift(1400, viewportHeight, viewportWidth, 0.35)
  const bottomAfter = calculateBigtypeShift(
    1400 - scrollDelta,
    viewportHeight,
    viewportWidth,
    0.35
  )

  const topMovement = topAfter - topBefore
  const bottomMovement = bottomAfter - bottomBefore

  assert.ok(topMovement > 0, 'DESIGN BUILD should move right')
  assert.ok(bottomMovement < 0, 'AUTOMATE RUN should move left')
  assert.equal(Math.abs(topMovement), Math.abs(bottomMovement))
})

test('big type composes scroll wrappers with independent Skiper58 rolls', async () => {
  const component = await readFile(
    new URL('../src/components/BigTypeRoll.tsx', import.meta.url),
    'utf8'
  )

  assert.match(component, /from ['"].*skiper58['"]/)
  assert.match(component, /data-speed="-0\.35"/)
  assert.match(component, /data-speed="0\.35"/)
  assert.equal((component.match(/data-bigtype-shift/g) || []).length, 2)
  assert.match(component, />DESIGN BUILD<\/TextRoll>/)
  assert.match(component, />\s*AUTOMATE RUN\s*<\/TextRoll>/)
})

test('Skiper58 disables hover animation for reduced-motion visitors', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper58.tsx', import.meta.url),
    'utf8'
  )

  assert.match(source, /useReducedMotion/)
  assert.match(
    source,
    /whileHover=\{shouldReduceMotion \? undefined : ['"]hovered['"]\}/
  )
})

test('landing page mounts the roll island and scrolls its outer wrappers', async () => {
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  assert.match(page, /import BigTypeRoll from ['"].*BigTypeRoll['"]/)
  assert.match(page, /<BigTypeRoll client:visible \/>/)
  assert.ok(
    page.includes(
      "line.querySelector<HTMLElement>('[data-bigtype-shift]')"
    )
  )
  assert.doesNotMatch(page, /span\.style\.setProperty\('--shift'/)
})
