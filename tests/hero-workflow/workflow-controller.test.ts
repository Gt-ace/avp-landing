import { describe, expect, it } from 'vitest'
import {
  pauseWorkflowFrame,
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
