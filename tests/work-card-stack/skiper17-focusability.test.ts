import { describe, expect, it } from 'vitest'
import {
  WORK_CARD_ACTIVE_ATTRIBUTE,
  getActiveCardIndexFromProgress,
  resetCardInteractivity,
  setActiveCardInteractivity,
  type StackCardInteractivityTarget,
} from '../../src/components/ui/skiper-ui/skiper17'

interface FakeCardTarget extends StackCardInteractivityTarget {
  hasAttribute: (name: string) => boolean
}

function createFakeCardTarget(): FakeCardTarget {
  const attributes = new Set<string>()

  return {
    inert: false,
    toggleAttribute(name, force) {
      if (force) {
        attributes.add(name)
        return
      }

      attributes.delete(name)
    },
    removeAttribute(name) {
      attributes.delete(name)
    },
    hasAttribute(name) {
      return attributes.has(name)
    },
  }
}

function createFakeCardTargets(count: number): FakeCardTarget[] {
  return Array.from({ length: count }, () => createFakeCardTarget())
}

describe('Skiper17 desktop focusability helpers', () => {
  it('keeps only the requested active wrapper focusable', () => {
    const targets = createFakeCardTargets(3)

    setActiveCardInteractivity(targets, 1)

    expect(targets.map((target) => target.inert)).toEqual([true, false, true])
    expect(
      targets.map((target) => target.hasAttribute(WORK_CARD_ACTIVE_ATTRIBUTE)),
    ).toEqual([false, true, false])
  })

  it('maps ScrollTrigger progress to the correct active wrapper with clamping', () => {
    expect(getActiveCardIndexFromProgress(-0.5, 4)).toBe(0)
    expect(getActiveCardIndexFromProgress(0.2, 4)).toBe(1)
    expect(getActiveCardIndexFromProgress(0.5, 4)).toBe(2)
    expect(getActiveCardIndexFromProgress(1.5, 4)).toBe(3)
  })

  it('restores every wrapper to non-inert without active markers on cleanup', () => {
    const targets = createFakeCardTargets(3)

    setActiveCardInteractivity(targets, 2)
    resetCardInteractivity(targets)

    expect(targets.map((target) => target.inert)).toEqual([false, false, false])
    expect(
      targets.map((target) => target.hasAttribute(WORK_CARD_ACTIVE_ATTRIBUTE)),
    ).toEqual([false, false, false])
  })
})
