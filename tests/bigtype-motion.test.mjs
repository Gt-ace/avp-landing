import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { calculateBigtypeShift } from '../src/scripts/bigtype-motion.mjs'

test('downward scrolling moves both big type lines equally in opposite directions', () => {
  const viewportHeight = 900
  const viewportWidth = 1440
  // Well inside the viewport, so the slack clamp leaves the drift untouched.
  const lineWidth = 500
  const scrollDelta = 180

  const shift = (lineCenter, speed) =>
    calculateBigtypeShift(lineCenter, viewportHeight, viewportWidth, speed, lineWidth)

  const topMovement = shift(800 - scrollDelta, -0.35) - shift(800, -0.35)
  const bottomMovement = shift(1000 - scrollDelta, 0.35) - shift(1000, 0.35)

  assert.ok(topMovement > 0, 'DESIGN BUILD should move right')
  assert.ok(bottomMovement < 0, 'AUTOMATE RUN should move left')
  assert.equal(
    Math.abs(topMovement).toFixed(2),
    Math.abs(bottomMovement).toFixed(2)
  )
})

test('drift never exceeds the empty space beside the line', () => {
  const viewportWidth = 390
  const lineWidth = 330
  const slack = (viewportWidth - lineWidth) / 2

  // A line centre far below the fold asks for a shift much larger than the slack.
  const right = calculateBigtypeShift(3000, 800, viewportWidth, 0.35, lineWidth)
  const left = calculateBigtypeShift(3000, 800, viewportWidth, -0.35, lineWidth)

  assert.equal(right, slack)
  assert.equal(left, -slack)
})

test('a line wider than the viewport does not drift at all', () => {
  const wider = calculateBigtypeShift(3000, 800, 320, 0.35, 475)

  assert.equal(wider, 0)
})

test('a line with room to spare keeps the raw parallax untouched', () => {
  const viewportWidth = 1440
  // Slack of 620 is wider than the 504 the parallax asks for at full progress,
  // so nothing needs scaling down.
  const lineWidth = 200
  const raw = ((1200 - 450) / 900) * 0.35 * viewportWidth

  const shift = calculateBigtypeShift(1200, 900, viewportWidth, 0.35, lineWidth)

  assert.ok(0.35 * viewportWidth < (viewportWidth - lineWidth) / 2)
  assert.equal(shift, Number(raw.toFixed(2)))
})

test('a cramped line drifts smoothly instead of parking against the edge', () => {
  const viewportWidth = 390
  const lineWidth = 351
  const slack = (viewportWidth - lineWidth) / 2

  const at = (progress) =>
    calculateBigtypeShift(400 + progress * 800, 800, viewportWidth, 0.35, lineWidth)

  // Full progress spends exactly the slack, and half progress spends half of
  // it: the drift is scaled to the room available, not snapped to its limit.
  assert.equal(at(1), Number(slack.toFixed(2)))
  assert.equal(at(0.5), Number((slack / 2).toFixed(2)))
  assert.equal(at(0.25), Number((slack / 4).toFixed(2)))
  assert.equal(at(0), 0)
})

test('an unmeasured line is treated as filling the viewport rather than as free', () => {
  const unmeasured = calculateBigtypeShift(3000, 800, 390, 0.35)

  assert.equal(unmeasured, 0)
})

test('big type exposes one focused Skiper58 text roll', async () => {
  const component = await readFile(
    new URL('../src/components/BigTypeRoll.tsx', import.meta.url),
    'utf8'
  )

  assert.match(component, /from ['"].*skiper58['"]/)
  assert.match(component, /text: string/)
  assert.match(component, /center\?: boolean/)
  assert.match(component, /<TextRoll className="bigtype-roll" center=\{center\}>/)
  assert.match(component, /\{text\}<\/TextRoll>/)
})

test('Skiper58 keeps hover animation enabled for reduced-motion desktops', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper58.tsx', import.meta.url),
    'utf8'
  )

  assert.doesNotMatch(source, /useReducedMotion/)
  assert.match(source, /whileHover=['"]hovered['"]/)
  assert.doesNotMatch(source, /lineHeight:\s*0\.75/)
})

test('landing page mounts the roll island and scrolls its outer wrappers', async () => {
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  assert.match(page, /import BigTypeRoll from ['"].*BigTypeRoll['"]/)
  assert.equal((page.match(/<BigTypeRoll/g) || []).length, 2)
  assert.match(page, /text="DESIGN BUILD"/)
  assert.match(page, /text="AUTOMATE RUN"/)
  assert.match(page, /data-speed="-0\.35"/)
  assert.match(page, /data-speed="0\.35"/)
  assert.equal((page.match(/data-bigtype-shift/g) || []).length, 3)
  assert.ok(
    page.includes(
      "line.querySelector<HTMLElement>('[data-bigtype-shift]')"
    )
  )
  assert.doesNotMatch(page, /span\.style\.setProperty\('--shift'/)
})

test('the drift is measured against the line and skipped under reduced motion', async () => {
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  assert.match(
    page,
    /if \(matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\) return/
  )
  assert.match(page, /shiftTarget\.getBoundingClientRect\(\)\.width/)
  assert.match(page, /addEventListener\('resize', onScroll, \{ passive: true \}\)/)
})

test('the hover-only roll islands never hydrate on touch', async () => {
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  assert.equal(
    (page.match(/client:media="\(hover: hover\) and \(pointer: fine\)"/g) || [])
      .length,
    2
  )
  assert.doesNotMatch(page, /<BigTypeRoll[^>]*client:visible/)
})

test('the unhydrated roll shows one copy of the word, not two', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper58.tsx', import.meta.url),
    'utf8'
  )
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  assert.match(source, /data-roll-layer="base"/)
  assert.match(source, /data-roll-layer="incoming"/)
  assert.match(
    page,
    /\.bigtype-roll \[data-roll-layer='incoming'\] > span\)\s*\{\s*transform: translateY\(100%\)/
  )
})

test('the big type clamp cannot outrun the viewport on a phone', async () => {
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  const clamp = page.match(
    /\.bigtype-roll\)\s*\{[\s\S]*?font-size:\s*clamp\(([^)]+)\)/
  )
  assert.ok(clamp, 'the big type roll should keep a fluid font size')

  const [floor, fluid, ceiling] = clamp[1].split(',').map((v) => v.trim())
  const floorPx = parseFloat(floor) * 16
  const vw = parseFloat(fluid)

  // AUTOMATE RUN, the wider line, at its measured Bodoni Moda 600 ratio.
  const ratio = 8.4922
  for (const viewport of [280, 320, 360, 390, 430, 768, 1024, 1440, 2560]) {
    const fontSize = Math.min(
      Math.max(floorPx, (vw / 100) * viewport),
      parseFloat(ceiling) * 16
    )
    assert.ok(
      fontSize * ratio < viewport,
      `AUTOMATE RUN overflows a ${viewport}px viewport`
    )
  }
})

test('scroll-owned wrappers stay outside the React islands', async () => {
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  assert.match(
    page,
    /<div class="bigtype-shift" data-bigtype-shift>\s*<BigTypeRoll/
  )
  assert.doesNotMatch(page, /addEventListener\('astro:hydrate'/)
})
