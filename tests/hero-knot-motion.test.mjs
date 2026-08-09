import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BASE_POSE,
  CONVERGENCE_EPSILON,
  DAMPING_FACTOR,
  calculateRotationTarget,
  dampToward,
  isConverged,
} from '../src/scripts/hero-knot-motion.mjs'

const close = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${message}: expected ${expected}, got ${actual}`
  )

test('neutral input holds the base pose', () => {
  const target = calculateRotationTarget(0, 0, 0)

  close(target.x, BASE_POSE.x, 'x')
  close(target.y, BASE_POSE.y, 'y')
})

test('cursor axes cross so the knot turns toward the pointer', () => {
  const target = calculateRotationTarget(1, 1, 0)

  close(target.x, BASE_POSE.x + 0.35, 'vertical cursor drives x')
  close(target.y, BASE_POSE.y + 0.5, 'horizontal cursor drives y')
})

test('negative cursor positions move the pose the other way', () => {
  const target = calculateRotationTarget(-1, -1, 0)

  close(target.x, BASE_POSE.x - 0.35, 'x')
  close(target.y, BASE_POSE.y - 0.5, 'y')
})

test('scroll alone reaches the full 1.2 rad y offset', () => {
  const target = calculateRotationTarget(0, 0, 1)

  close(target.y, BASE_POSE.y + 1.2, 'y')
  close(target.x, BASE_POSE.x, 'scroll does not touch x')
})

test('cursor and scroll sum rather than overwrite each other', () => {
  const target = calculateRotationTarget(0.5, 0, 0.25)

  close(target.y, BASE_POSE.y + 0.5 * 0.5 + 0.25 * 1.2, 'summed y offset')
})

test('the summed y offset is clamped at +1.2 rad', () => {
  const target = calculateRotationTarget(1, 0, 1)

  close(target.y, BASE_POSE.y + 1.2, 'clamped y')
})

test('the clamp is an upper bound only, so cursor can still pull y down', () => {
  const target = calculateRotationTarget(-1, 0, 0)

  close(target.y, BASE_POSE.y - 0.5, 'y below base is allowed')
})

test('x is not clamped by the y bound', () => {
  const target = calculateRotationTarget(1, 1, 1)

  close(target.x, BASE_POSE.x + 0.35, 'x')
  close(target.y, BASE_POSE.y + 1.2, 'y')
})

test('an explicit base pose overrides the default', () => {
  const target = calculateRotationTarget(0, 0, 0, { x: 1, y: 2 })

  close(target.x, 1, 'x')
  close(target.y, 2, 'y')
})

test('damping moves a fraction of the remaining distance', () => {
  close(dampToward(0, 1), DAMPING_FACTOR, 'one step')
  close(dampToward(1, 1), 1, 'no distance left')
  close(dampToward(2, 1), 2 - DAMPING_FACTOR, 'approaches from above')
})

test('damping converges without overshooting', () => {
  let current = 0
  for (let i = 0; i < 500; i += 1) current = dampToward(current, 1)

  assert.ok(current <= 1, 'never overshoots the target')
  assert.ok(isConverged(current, 1), 'settles within epsilon')
})

test('convergence is decided by the epsilon threshold', () => {
  assert.equal(isConverged(1, 1), true)
  assert.equal(isConverged(1, 1 + CONVERGENCE_EPSILON / 2), true)
  assert.equal(isConverged(1, 1 + CONVERGENCE_EPSILON * 2), false)
  assert.equal(isConverged(1, 1 - CONVERGENCE_EPSILON * 2), false)
})

import {
  NARROW_BREAKPOINT,
  getPlacement,
  getScrollProgress,
  getSegmentCounts,
  shouldRender,
} from '../src/scripts/hero-knot-motion.mjs'

test('an unscrolled hero has zero scroll progress', () => {
  close(getScrollProgress(0, 900), 0, 'progress')
})

test('scroll progress completes at 80 percent of the viewport height', () => {
  close(getScrollProgress(720, 900), 1, 'progress at 0.8 * height')
  close(getScrollProgress(360, 900), 0.5, 'progress halfway there')
})

test('scroll progress is capped at 1 past the ceiling', () => {
  close(getScrollProgress(5000, 900), 1, 'far past the hero')
})

test('desktop widths get the full-density knot', () => {
  assert.deepEqual(getSegmentCounts(1440), { tubular: 220, radial: 32 })
  assert.deepEqual(getSegmentCounts(NARROW_BREAKPOINT), {
    tubular: 220,
    radial: 32,
  })
})

test('narrow widths drop to the mobile density', () => {
  assert.deepEqual(getSegmentCounts(390), { tubular: 120, radial: 20 })
  assert.deepEqual(getSegmentCounts(NARROW_BREAKPOINT - 1), {
    tubular: 120,
    radial: 20,
  })
})

test('wide viewports place the knot beside the reading zone', () => {
  assert.deepEqual(getPlacement(1440, 900), { x: 1.6, y: 0.2, cameraZ: 7.5 })
})

test('narrow viewports lift the knot above the title and push it back', () => {
  const placement = getPlacement(390, 844)

  assert.equal(placement.x, 0, 'centred horizontally')
  assert.ok(placement.y > 0.2, 'lifted above the wide-layout position')
  assert.ok(placement.cameraZ > 7.5, 'pushed back so it clears the title')
})

test('the placement switch happens at the breakpoint, not around it', () => {
  assert.deepEqual(
    getPlacement(NARROW_BREAKPOINT, 900),
    getPlacement(1440, 900),
    'the breakpoint itself is the wide arrangement'
  )
  assert.deepEqual(
    getPlacement(NARROW_BREAKPOINT - 1, 900),
    getPlacement(390, 844),
    'one pixel below is the narrow arrangement'
  )
})

test('placement does not vary with viewport height', () => {
  assert.deepEqual(getPlacement(1440, 900), getPlacement(1440, 1600))
  assert.deepEqual(getPlacement(390, 640), getPlacement(390, 844))
})

test('the knot renders only with WebGL and no reduced-motion request', () => {
  assert.equal(shouldRender(false, true), 'animated')
})

test('reduced motion renders nothing, even with WebGL', () => {
  assert.equal(shouldRender(true, true), 'none')
})

test('missing WebGL renders nothing', () => {
  assert.equal(shouldRender(false, false), 'none')
  assert.equal(shouldRender(true, false), 'none')
})
