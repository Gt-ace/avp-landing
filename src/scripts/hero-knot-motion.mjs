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

// Re-derived in phase 4 against the hero's centred copy. The copy sits at
// top: 50%, so the knot has roughly the top third of the viewport, not the
// top two thirds the original values assumed: it sits lower in world space
// and further back than the provisional (1.5, 9).
const NARROW_PLACEMENT = Object.freeze({ x: 0, y: 1.15, cameraZ: 10 })

export function getScrollProgress(scrollY, viewportHeight) {
  return Math.max(0, Math.min(1, scrollY / (viewportHeight * SCROLL_RANGE_FACTOR)))
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

/*
 * The knot exists to follow the cursor, so a device without one gets nothing.
 * `attachInput` already refuses to give a coarse pointer a cursor listener,
 * which leaves scroll as the only input and one slowly turning axis as the
 * whole effect: the smallest payoff it has anywhere, paid for with a full
 * viewport WebGL canvas at devicePixelRatio 2 and a 129 KB Three.js chunk, on
 * the devices least able to afford either.
 *
 * The discriminator is the pointer rather than the width the audit asked
 * about, for two reasons. A desktop window dragged under 768px still has the
 * cursor the knot is for, so it keeps the knot and the narrow placement and
 * segment counts above stay live code. And a phone rotated to landscape is
 * wider than 768px while having gained nothing to offer the knot, so a width
 * test would hand it the canvas anyway.
 *
 * hasFinePointer defaults to true so this gate only ever takes the knot away
 * when it has been told the pointer is not fine. The caller does the matching
 * positively as `pointer: fine`, like attachInput, so a device that reports
 * neither fine nor coarse is read as having no cursor to follow.
 */
export function shouldRender(
  prefersReducedMotion,
  hasWebGL,
  hasFinePointer = true
) {
  if (prefersReducedMotion) return 'none'
  if (!hasWebGL) return 'none'
  if (!hasFinePointer) return 'none'
  return 'animated'
}
