import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  pauseWorkflowFrame,
  setupWorkflow,
  shouldEnhanceWorkflow,
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

  it('does not enhance reduced-motion clients or register scroll work', () => {
    expect(shouldEnhanceWorkflow(false)).toBe(true)
    expect(shouldEnhanceWorkflow(true)).toBe(false)

    const windowAddEventListener = vi.fn()
    const root = {
      dataset: {} as Record<string, string>,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    vi.stubGlobal('addEventListener', windowAddEventListener)

    const cleanup = setupWorkflow(root as unknown as HTMLElement)

    expect(root.dataset.enhanced).toBeUndefined()
    expect(windowAddEventListener).not.toHaveBeenCalled()
    expect(() => cleanup()).not.toThrow()
  })

  it('enhances normal-motion clients with one scroll scheduler and cleanup', () => {
    const requestAnimationFrame = vi.fn(() => 1)
    const windowAddEventListener = vi.fn()
    const windowRemoveEventListener = vi.fn()
    const rootAddEventListener = vi.fn()
    const rootRemoveEventListener = vi.fn()
    const sceneRemoveEventListener = vi.fn()
    const reducedQuery = { matches: false }

    vi.stubGlobal('matchMedia', vi.fn(() => reducedQuery))
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('addEventListener', windowAddEventListener)
    vi.stubGlobal('removeEventListener', windowRemoveEventListener)
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
      removeEventListener: sceneRemoveEventListener,
    }
    const stage = {
      getBoundingClientRect: () => ({ top: 0, height: 1125 }),
    }
    const root = {
      dataset: {} as Record<string, string>,
      closest: () => stage,
      querySelector: (selector: string) =>
        selector === '[data-workflow-scene]' ? scene : null,
      addEventListener: rootAddEventListener,
      removeEventListener: rootRemoveEventListener,
    }

    const cleanup = setupWorkflow(root as unknown as HTMLElement)

    expect(root.dataset.enhanced).toBe('true')
    expect(windowAddEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true },
    )
    expect(requestAnimationFrame).toHaveBeenCalledOnce()
    expect(rootAddEventListener).toHaveBeenCalledWith('focusin', expect.any(Function))
    expect(rootAddEventListener).toHaveBeenCalledWith('focusout', expect.any(Function))
    expect(rootAddEventListener).toHaveBeenCalledWith('pointerover', expect.any(Function))
    expect(rootAddEventListener).toHaveBeenCalledWith('pointerout', expect.any(Function))

    cleanup()

    expect(windowRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(root.dataset.ready).toBeUndefined()
    expect(root.dataset.enhanced).toBeUndefined()
  })
})
