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
