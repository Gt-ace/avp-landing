import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  localTargetForFragment,
  pauseWorkflowFrame,
  pointerEventsForOpacity,
  pointerInteraction,
  setupWorkflow,
} from '../../src/components/hero-workflow/workflow-controller'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('workflow frame lifecycle', () => {
  it('clears the scheduler guard when pausing an in-flight frame', () => {
    const canceled: number[] = []

    const frame = pauseWorkflowFrame(42, (frameId) => {
      canceled.push(frameId)
    })

    expect(canceled).toEqual([42])
    expect(frame).toBe(0)
  })

  it('enhances and schedules the scroll animation with reduced motion enabled', () => {
    const requestAnimationFrame = vi.fn(() => 1)
    const windowAddEventListener = vi.fn()
    const sceneAddEventListener = vi.fn()
    const reducedQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) =>
        query.includes('prefers-reduced-motion')
          ? reducedQuery
          : { ...reducedQuery, matches: false },
      ),
    )
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('addEventListener', windowAddEventListener)
    vi.stubGlobal('removeEventListener', vi.fn())
    vi.stubGlobal('innerHeight', 900)
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )

    const scene = {
      getBoundingClientRect: () => ({
        width: 1200,
        height: 900,
        top: 0,
        left: 0,
      }),
      addEventListener: sceneAddEventListener,
      removeEventListener: vi.fn(),
    }
    const stage = {
      getBoundingClientRect: () => ({ top: 0, height: 1125 }),
    }
    const root = {
      dataset: {} as Record<string, string>,
      closest: () => stage,
      querySelector: (selector: string) =>
        selector === '[data-workflow-scene]' ? scene : null,
    }

    const cleanup = setupWorkflow(root as unknown as HTMLElement)

    expect(root.dataset.enhanced).toBe('true')
    expect(windowAddEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true },
    )
    expect(requestAnimationFrame).toHaveBeenCalledOnce()

    cleanup()
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
