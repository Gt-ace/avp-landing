import { describe, expect, it } from 'vitest'
import {
  localTargetForFragment,
  pauseWorkflowFrame,
  pointerEventsForOpacity,
  pointerInteraction,
} from '../../src/components/hero-workflow/workflow-controller'

describe('workflow frame lifecycle', () => {
  it('clears the scheduler guard when pausing an in-flight frame', () => {
    const canceled: number[] = []

    const frame = pauseWorkflowFrame(42, (frameId) => {
      canceled.push(frameId)
    })

    expect(canceled).toEqual([42])
    expect(frame).toBe(0)
  })
})

describe('workflow pointer policy', () => {
  it('uses tap resolution for touch on a fine-primary hybrid device', () => {
    expect(pointerInteraction('touch', true)).toBe('tap')
  })

  it('allows dragging for a fine mouse pointer', () => {
    expect(pointerInteraction('mouse', true)).toBe('drag')
  })
})

describe('workflow fragment targeting policy', () => {
  it('holds the fine-pointer hover target at its scroll-defined pose', () => {
    expect(
      localTargetForFragment('request', 'request', null, 1, false),
    ).toBe(0)
  })

  it('holds the active drag target at its scroll-defined pose', () => {
    expect(
      localTargetForFragment('request', null, 'request', 1, false),
    ).toBe(0)
  })

  it('continues resolving neighboring fragments', () => {
    expect(
      localTargetForFragment('details', 'request', null, 0.7, false),
    ).toBe(0.7)
  })

  it('preserves the localized touch-tap strength', () => {
    expect(
      localTargetForFragment('request', null, null, 0.75, true),
    ).toBeCloseTo(0.615)
  })

  it('removes pointer hits only from fully receded fragments', () => {
    expect(pointerEventsForOpacity(0)).toBe('none')
    expect(pointerEventsForOpacity(0.049)).toBe('none')
    expect(pointerEventsForOpacity(0.05)).toBe('auto')
    expect(pointerEventsForOpacity(1)).toBe('auto')
  })
})
