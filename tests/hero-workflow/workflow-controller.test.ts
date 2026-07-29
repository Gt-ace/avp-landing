import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  pauseWorkflowFrame,
  setupWorkflow,
  shouldEnhanceWorkflow,
} from '../../src/components/hero-workflow/workflow-controller'
import { artifacts, connections } from '../../src/components/hero-workflow/workflow-model'

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

  it('allows scroll enhancement for both motion preferences', () => {
    expect(shouldEnhanceWorkflow(false)).toBe(true)
    expect(shouldEnhanceWorkflow(true)).toBe(true)
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
      querySelector: () => null,
      style: { removeProperty: vi.fn() },
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

  it('renders reduced-motion mobile properties and hides exited copy accessibly', () => {
    const makeStyle = () => {
      const values: Record<string, string> = {}
      return {
        values,
        opacity: '',
        pointerEvents: '',
        setProperty: (property: string, value: string) => {
          values[property] = value
        },
        removeProperty: (property: string) => {
          delete values[property]
        },
      }
    }
    const makeArtifact = () => ({
      style: makeStyle(),
      getBoundingClientRect: () => ({ width: 240, height: 160 }),
    })
    const artifactElements = new Map(artifacts.map(({ id }) => [id, makeArtifact()]))
    const lineElements = new Map(connections.map(({ id }) => [id, {
      style: makeStyle(),
      setAttribute: vi.fn(),
    }]))
    const processTail = { style: makeStyle(), setAttribute: vi.fn() }
    const rootStyle = makeStyle()
    const stageStyle = makeStyle()
    const heroCopy = { style: makeStyle(), inert: false }
    const stage = {
      getBoundingClientRect: () => ({ top: -180, height: 1125 }),
      querySelector: (selector: string) =>
        selector === '.hero-content' ? heroCopy : null,
      style: stageStyle,
    }
    const scene = {
      getBoundingClientRect: () => ({
        width: 390,
        height: 844,
        top: 0,
        left: 0,
      }),
    }
    const root = {
      dataset: {} as Record<string, string>,
      style: rootStyle,
      closest: () => stage,
      querySelector: (selector: string) => {
        if (selector === '[data-workflow-scene]') return scene
        if (selector === '[data-process-tail]') return processTail

        const artifactMatch = selector.match(/^\[data-artifact="([^"]+)"\]$/)
        if (artifactMatch) return artifactElements.get(artifactMatch[1] as typeof artifacts[number]['id'])

        const connectionMatch = selector.match(/^\[data-connection="([^"]+)"\]$/)
        if (connectionMatch) return lineElements.get(connectionMatch[1])

        return null
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(1)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('addEventListener', vi.fn())
    vi.stubGlobal('removeEventListener', vi.fn())
    vi.stubGlobal('innerHeight', 900)
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    })

    const cleanup = setupWorkflow(root as unknown as HTMLElement)

    expect(Number(rootStyle.values['--cobalt-progress'])).toBe(1)
    expect(Number(stageStyle.values['--hero-copy-opacity'])).toBe(0)
    expect(heroCopy.style.pointerEvents).toBe('none')
    expect(heroCopy.inert).toBe(true)
    expect(artifactElements.get('email')?.style.values['--artifact-x']).toMatch(/px$/)
    expect(artifactElements.get('email')?.style.values['--artifact-rotation']).toBe('0deg')
    expect(lineElements.get('resolved-email-sheet')?.setAttribute).toHaveBeenCalledWith(
      'x1',
      expect.any(String),
    )
    expect(processTail.setAttribute).toHaveBeenCalledWith('y2', '100')

    cleanup()
  })
})
