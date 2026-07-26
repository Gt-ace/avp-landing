import assert from 'node:assert/strict'
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
