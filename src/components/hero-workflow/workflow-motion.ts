export type StoryPose = {
  x: number
  y: number
  rotation: number
  scale: number
  opacity: number
}

export type ArtifactVisualState = {
  pose: StoryPose
  annotationOpacity: number
  messyLineOpacity: number
  resolvedLineOpacity: number
  cobaltProgress: number
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function smoothstep01(value: number) {
  const n = clamp01(value)
  return n * n * (3 - 2 * n)
}

export function segmentProgress(value: number, start: number, end: number) {
  return smoothstep01((value - start) / Math.max(.0001, end - start))
}

export function heroCopyOpacity(progress: number) {
  return 1 - segmentProgress(progress, .38, .6)
}

export function scrollProgress(
  stageTop: number,
  viewportHeight: number,
  stageHeight: number,
) {
  return clamp01(-stageTop / Math.max(1, stageHeight - viewportHeight))
}

export function interpolatePose(
  from: StoryPose,
  to: StoryPose,
  progress: number,
): StoryPose {
  const n = clamp01(progress)
  const mix = (a: number, b: number) => a + (b - a) * n
  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    rotation: mix(from.rotation, to.rotation),
    scale: mix(from.scale, to.scale),
    opacity: mix(from.opacity, to.opacity),
  }
}

export function applyMotionProfile(
  pose: StoryPose,
  resolved: StoryPose,
  reducedMotion: boolean,
): StoryPose {
  if (!reducedMotion) return pose

  const travelScale = 0.35
  return {
    x: resolved.x + (pose.x - resolved.x) * travelScale,
    y: resolved.y + (pose.y - resolved.y) * travelScale,
    rotation: 0,
    scale: resolved.scale + (pose.scale - resolved.scale) * travelScale,
    opacity: pose.opacity,
  }
}

export function visualStateForProgress(
  recognition: StoryPose,
  diagnosis: StoryPose,
  resolved: StoryPose,
  progress: number,
): ArtifactVisualState {
  const diagnose = segmentProgress(progress, .12, .42)
  const resolve = segmentProgress(progress, .42, .88)
  const pose = progress < .42
    ? interpolatePose(recognition, diagnosis, diagnose)
    : interpolatePose(diagnosis, resolved, resolve)
  const annotationOpacity =
    segmentProgress(progress, .1, .28) * (1 - segmentProgress(progress, .46, .62))
  return {
    pose,
    annotationOpacity,
    messyLineOpacity: 1 - segmentProgress(progress, .3, .66),
    resolvedLineOpacity: segmentProgress(progress, .58, .9),
    cobaltProgress: segmentProgress(progress, .45, .88),
  }
}
