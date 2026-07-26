import { describe, expect, it } from 'vitest'
import {
  clamp01,
  composedProgress,
  interpolatePose,
  proximityProgress,
  scrollProgress,
  stepSpring,
} from '../../src/components/hero-workflow/workflow-motion'

describe('workflow motion', () => {
  it('clamps values to normalized progress', () => {
    expect(clamp01(-0.25)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(1.25)).toBe(1)
  })

  it('interpolates position, rotation, and opacity', () => {
    expect(
      interpolatePose(
        { x: 10, y: 20, rotation: -8, opacity: 1 },
        { x: 50, y: 60, rotation: 0, opacity: 0 },
        0.5,
      ),
    ).toEqual({ x: 30, y: 40, rotation: -4, opacity: 0.5 })
  })

  it('creates a smooth local influence inside the radius', () => {
    expect(proximityProgress({ x: 0, y: 0 }, { x: 0, y: 0 }, 200)).toBe(1)
    expect(proximityProgress({ x: 200, y: 0 }, { x: 0, y: 0 }, 200)).toBe(0)
    expect(proximityProgress({ x: 100, y: 0 }, { x: 0, y: 0 }, 200)).toBeCloseTo(0.5)
  })

  it('maps the sticky travel distance to scroll progress', () => {
    expect(scrollProgress(0, 1080, 1350)).toBe(0)
    expect(scrollProgress(-135, 1080, 1350)).toBeCloseTo(0.5)
    expect(scrollProgress(-270, 1080, 1350)).toBe(1)
  })

  it('advances an offset spring toward rest without overshooting wildly', () => {
    const next = stepSpring(
      { value: 80, velocity: 0 },
      0,
      1 / 60,
      { stiffness: 180, damping: 24 },
    )
    expect(next.value).toBeLessThan(80)
    expect(next.value).toBeGreaterThan(0)
    expect(next.velocity).toBeLessThan(0)
  })
})

describe('composed workflow progress', () => {
  it('lets global scroll progress remain authoritative', () => {
    expect(composedProgress(0.7, 0.2)).toBe(0.7)
  })

  it('lets local interaction temporarily reveal more clarity', () => {
    expect(composedProgress(0.2, 0.8)).toBe(0.8)
  })
})
