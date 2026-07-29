import { describe, expect, it } from 'vitest'
import {
  applyMotionProfile,
  clamp01,
  interpolatePose,
  heroCopyOpacity,
  scrollProgress,
  segmentProgress,
  visualStateForProgress,
  type StoryPose,
} from '../../src/components/hero-workflow/workflow-motion'

const recognition: StoryPose = {
  x: 10, y: 20, rotation: -8, scale: 1, opacity: 1,
}
const diagnosis: StoryPose = {
  x: 30, y: 40, rotation: -2, scale: .9, opacity: .8,
}
const resolved: StoryPose = {
  x: 50, y: 60, rotation: 0, scale: .7, opacity: 1,
}

describe('Tuesday Board motion', () => {
  it('clamps values to normalized progress', () => {
    expect(clamp01(-0.25)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(1.25)).toBe(1)
  })

  it('maps normalized progress through fixed narrative segments', () => {
    expect(segmentProgress(0.15, 0.15, 0.45)).toBe(0)
    expect(segmentProgress(0.25, 0.15, 0.45)).toBeCloseTo(0.259259)
    expect(segmentProgress(0.45, 0.15, 0.45)).toBe(1)
    expect(segmentProgress(0.45, 0.45, 0.82)).toBe(0)
    expect(segmentProgress(0.6, 0.45, 0.82)).toBeCloseTo(0.359801)
    expect(segmentProgress(0.82, 0.45, 0.82)).toBe(1)
  })

  it('maps the sticky travel distance to scroll progress', () => {
    expect(scrollProgress(0, 1080, 1350)).toBe(0)
    expect(scrollProgress(-135, 1080, 1350)).toBeCloseTo(0.5)
    expect(scrollProgress(-270, 1080, 1350)).toBe(1)
  })

  it('interpolates every pose property at the midpoint', () => {
    expect(interpolatePose(recognition, diagnosis, 0.5)).toEqual({
      x: 20,
      y: 30,
      rotation: -5,
      scale: 0.95,
      opacity: 0.9,
    })
  })

  it('reveals annotations during diagnosis and resolves the routing lines', () => {
    const start = visualStateForProgress(recognition, diagnosis, resolved, 0)
    const diagnosisState = visualStateForProgress(
      recognition,
      diagnosis,
      resolved,
      0.3,
    )
    const end = visualStateForProgress(recognition, diagnosis, resolved, 1)

    expect(start.messyLineOpacity).toBe(1)
    expect(start.resolvedLineOpacity).toBe(0)
    expect(diagnosisState.annotationOpacity).toBeGreaterThan(start.annotationOpacity)
    expect(end).toMatchObject({
      pose: resolved,
      annotationOpacity: 0,
      messyLineOpacity: 0,
      resolvedLineOpacity: 1,
    })
  })

  it('makes the resolved system dominant before the final scroll position', () => {
    const nearlyResolved = visualStateForProgress(
      recognition,
      diagnosis,
      { ...resolved, opacity: 0 },
      0.72,
    )

    expect(nearlyResolved.pose.opacity).toBeLessThan(0.1)
    expect(nearlyResolved.messyLineOpacity).toBe(0)
    expect(nearlyResolved.cobaltProgress).toBeGreaterThan(0.9)
  })

  it('keeps mobile copy present initially and clears it for the resolved panel', () => {
    expect(heroCopyOpacity(0)).toBe(1)
    expect(heroCopyOpacity(0.5)).toBeGreaterThan(0)
    expect(heroCopyOpacity(0.5)).toBeLessThan(1)
    expect(heroCopyOpacity(0.62)).toBe(0)
  })

  it('keeps the complete pose for standard motion', () => {
    expect(applyMotionProfile(recognition, resolved, false)).toEqual(recognition)
  })

  it('keeps reduced motion scroll-linked with shorter travel and no rotation', () => {
    expect(applyMotionProfile(recognition, resolved, true)).toEqual({
      x: 36,
      y: 46,
      rotation: 0,
      scale: 0.8049999999999999,
      opacity: 1,
    })
  })
})
