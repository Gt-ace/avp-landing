export const BASE_POSE = Object.freeze({ x: 0.4, y: 0.6 })

const POINTER_X_COEFFICIENT = 0.35
const POINTER_Y_COEFFICIENT = 0.5
const SCROLL_Y_COEFFICIENT = 1.2
const MAX_Y_OFFSET = 1.2

export const DAMPING_FACTOR = 0.06
export const CONVERGENCE_EPSILON = 0.0005

export function calculateRotationTarget(
  pointerX,
  pointerY,
  scrollProgress,
  basePose = BASE_POSE
) {
  const yOffset = Math.min(
    pointerX * POINTER_Y_COEFFICIENT + scrollProgress * SCROLL_Y_COEFFICIENT,
    MAX_Y_OFFSET
  )

  return {
    x: basePose.x + pointerY * POINTER_X_COEFFICIENT,
    y: basePose.y + yOffset,
  }
}

export function dampToward(current, target, factor = DAMPING_FACTOR) {
  return current + (target - current) * factor
}

export function isConverged(current, target, epsilon = CONVERGENCE_EPSILON) {
  return Math.abs(target - current) < epsilon
}
