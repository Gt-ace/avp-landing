export type Point = { x: number; y: number }

export type Pose = Point & {
  rotation: number
  opacity: number
}

export type SpringState = {
  value: number
  velocity: number
}

export type SpringConfig = {
  stiffness: number
  damping: number
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function smoothstep01(value: number) {
  const n = clamp01(value)
  return n * n * (3 - 2 * n)
}

export function interpolatePose(from: Pose, to: Pose, progress: number): Pose {
  const n = smoothstep01(progress)
  const mix = (start: number, end: number) => start + (end - start) * n

  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    rotation: mix(from.rotation, to.rotation),
    opacity: mix(from.opacity, to.opacity),
  }
}

export function proximityProgress(point: Point, pointer: Point, radius: number) {
  if (radius <= 0) return 0
  const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y)
  return smoothstep01(1 - distance / radius)
}

export function scrollProgress(
  stageTop: number,
  viewportHeight: number,
  stageHeight: number,
) {
  const travel = Math.max(1, stageHeight - viewportHeight)
  return clamp01(-stageTop / travel)
}

export function stepSpring(
  state: SpringState,
  target: number,
  deltaSeconds: number,
  config: SpringConfig,
): SpringState {
  const dt = Math.min(deltaSeconds, 1 / 30)
  const acceleration =
    (target - state.value) * config.stiffness -
    state.velocity * config.damping
  const velocity = state.velocity + acceleration * dt

  return {
    value: state.value + velocity * dt,
    velocity,
  }
}
