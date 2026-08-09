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

export const NARROW_BREAKPOINT = 768

const SCROLL_RANGE_FACTOR = 0.8

const DESKTOP_SEGMENTS = Object.freeze({ tubular: 220, radial: 32 })
const MOBILE_SEGMENTS = Object.freeze({ tubular: 120, radial: 20 })

const WIDE_PLACEMENT = Object.freeze({ x: 1.6, y: 0.2, cameraZ: 7.5 })

// Provisional. Unlike every other constant in this file, these three are not
// carried over from the approved prototype, which was desktop-width only.
// Phase 4 confirms them on a real narrow viewport and may adjust them; the
// requirement they must satisfy is that the knot clears the title's top edge
// with visible margin.
const NARROW_PLACEMENT = Object.freeze({ x: 0, y: 1.5, cameraZ: 9 })

export function getScrollProgress(scrollY, viewportHeight) {
  return Math.min(1, scrollY / (viewportHeight * SCROLL_RANGE_FACTOR))
}

export function getSegmentCounts(viewportWidth) {
  const source =
    viewportWidth < NARROW_BREAKPOINT ? MOBILE_SEGMENTS : DESKTOP_SEGMENTS

  return { tubular: source.tubular, radial: source.radial }
}

export function getPlacement(viewportWidth, viewportHeight) {
  const source =
    viewportWidth < NARROW_BREAKPOINT ? NARROW_PLACEMENT : WIDE_PLACEMENT

  return { x: source.x, y: source.y, cameraZ: source.cameraZ }
}

export function shouldRender(prefersReducedMotion, hasWebGL) {
  if (prefersReducedMotion) return 'none'
  if (!hasWebGL) return 'none'
  return 'animated'
}
