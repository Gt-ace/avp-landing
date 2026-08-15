import { describe, expect, it } from 'vitest'
import {
  CLOSED_WIDTH,
  DESKTOP_OPEN_WIDTH,
  MOBILE_PANEL_WIDTH,
  MOBILE_ROW_HEIGHT,
  PILL_HEIGHT,
  TOUCH_TARGET,
  getPillGeometry,
  shouldCloseOnFocusOut,
} from '../src/components/NavPill'

describe('NavPill geometry', () => {
  it('keeps the pill a single closed row on both viewports', () => {
    const desktop = getPillGeometry({ isOpen: false, isDesktop: true, linkCount: 3 })
    const mobile = getPillGeometry({ isOpen: false, isDesktop: false, linkCount: 3 })

    expect(desktop).toEqual(mobile)
    expect(desktop.width).toBe(CLOSED_WIDTH)
    expect(desktop.height).toBe(PILL_HEIGHT)
    expect(desktop.borderRadius).toBe(9999)
  })

  it('expands sideways on desktop without growing taller', () => {
    const open = getPillGeometry({ isOpen: true, isDesktop: true, linkCount: 3 })

    expect(open.width).toBe(DESKTOP_OPEN_WIDTH)
    expect(open.height).toBe(PILL_HEIGHT)
    expect(open.borderRadius).toBe(9999)
  })

  it('recovers the width the collapsed disclosure box no longer needs', () => {
    // The button used to hold a 44px floor even while open, because it still
    // showed a chevron. With the chevron gone the whole box collapses, so the
    // open pill is 44px narrower than it was.
    expect(DESKTOP_OPEN_WIDTH).toBe(436)
  })

  it('opens downward into a panel on mobile', () => {
    const open = getPillGeometry({ isOpen: true, isDesktop: false, linkCount: 3 })

    expect(open.width).toBe(MOBILE_PANEL_WIDTH)
    expect(open.height).toBe(PILL_HEIGHT + 3 * MOBILE_ROW_HEIGHT)
    expect(open.borderRadius).toBeLessThan(9999)
  })

  it('sizes the mobile panel from the link count so a fourth link is not clipped', () => {
    const three = getPillGeometry({ isOpen: true, isDesktop: false, linkCount: 3 })
    const four = getPillGeometry({ isOpen: true, isDesktop: false, linkCount: 4 })

    expect(four.height - three.height).toBe(MOBILE_ROW_HEIGHT)
  })

  it('animates width as a number so the spring can interpolate it', () => {
    // `maxWidth: calc(100vw - 32px)` does the narrow-screen clamping in CSS.
    // A `min()` string here would give Framer nothing to interpolate between.
    for (const isDesktop of [true, false]) {
      for (const isOpen of [true, false]) {
        const { width, height } = getPillGeometry({ isOpen, isDesktop, linkCount: 3 })
        expect(typeof width).toBe('number')
        expect(typeof height).toBe('number')
      }
    }
  })

  it('never renders a row shorter than the 44px touch floor', () => {
    expect(TOUCH_TARGET).toBe(44)
    expect(PILL_HEIGHT).toBeGreaterThanOrEqual(TOUCH_TARGET)
    expect(MOBILE_ROW_HEIGHT).toBeGreaterThanOrEqual(TOUCH_TARGET)
  })

  it('fits three non-overlapping targets across the closed pill', () => {
    // The A, the disclosure button and the P are all live at once while
    // closed. Under 3x the floor their hit boxes overlap, and the overlap is
    // worse than a small target: the wrong control wins the tap.
    expect(CLOSED_WIDTH).toBeGreaterThanOrEqual(3 * TOUCH_TARGET)
  })

  it('keeps the mobile panel inside the CSS clamp at every supported width', () => {
    // `maxWidth: calc(100vw - 32px)` is 288px at the 320px floor. The panel
    // may be clamped there, but it must never be clamped on a 390px phone,
    // where the animation would otherwise stop short of its target.
    expect(MOBILE_PANEL_WIDTH).toBeLessThanOrEqual(390 - 32)
  })
})

describe('NavPill focus-out handling', () => {
  const container = {
    contains: (node: Node | null) => node === inside,
  } as unknown as HTMLElement
  const inside = {} as Node
  const outside = {} as Node

  it('closes when focus moves to an element outside the pill', () => {
    expect(shouldCloseOnFocusOut(container, outside)).toBe(true)
  })

  it('stays open while focus moves between elements inside the pill', () => {
    expect(shouldCloseOnFocusOut(container, inside)).toBe(false)
  })

  it('closes when focus leaves the document entirely', () => {
    // Tabbing out of the last link hands focus to the browser chrome, which
    // arrives as a null relatedTarget.
    expect(shouldCloseOnFocusOut(container, null)).toBe(true)
  })

  it('does not close before the container ref is attached', () => {
    expect(shouldCloseOnFocusOut(null, outside)).toBe(false)
  })
})
