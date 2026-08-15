'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const NAV_LINKS = [
  { label: 'WORK',    href: '/work'    },
  { label: 'ABOUT',   href: '/about'   },
  { label: 'CONTACT', href: '/contact' },
]

const EASE_OUT_QUART = [0.16, 1, 0.3, 1] as const

// The three letterforms share a serif family but differ in how much of their
// own frame the ink fills: the A (logo-mark) fills ~92% of its frame height,
// while the V and P fill only ~50%. To make the cap heights match optically,
// the A is rendered shorter than the V/P frames. All three are vertically
// centred within their frames, so centring the frames centres the caps.
const A_HEIGHT = 15
const VP_HEIGHT = 28

/**
 * Smallest interactive box we ship, in both directions. Every link and the
 * disclosure button are laid out from this rather than from their ink, which
 * is why the pill is taller than the letterforms need.
 */
export const TOUCH_TARGET = 44

/** Header row height. One target plus 2px of breathing room above and below. */
export const PILL_HEIGHT = 48
export const MOBILE_ROW_HEIGHT = 48

/**
 * Closed width holds three flush targets: the A, the disclosure button, and
 * the P. Anything under `3 * TOUCH_TARGET` makes them overlap each other,
 * which is a worse failure than a small target because the wrong one wins.
 */
export const CLOSED_WIDTH = 140

/**
 * Open width holds the three links between the A and the P. The disclosure
 * box collapses to nothing when the pill opens, so nothing but the links and
 * the two letterforms is inside this.
 */
export const DESKTOP_OPEN_WIDTH = 436

/**
 * The mobile panel is capped again in CSS by `calc(100vw - 32px)`, which is
 * 288px at the 320px floor. Staying at or under 320 here means the clamp only
 * ever engages below the design width instead of mid-animation.
 */
export const MOBILE_PANEL_WIDTH = 320

export const DESKTOP_QUERY = '(min-width: 768px)'

const PILL_RADIUS = 9999
const PANEL_RADIUS = 24

/**
 * Left edge of the stacked labels, measured to land on the A's ink rather than
 * on a round number: the A sits in a centred 44px box around a 16px frame, so
 * its ink starts 16px inside the panel. Any other value leaves the menu's left
 * edge visibly ragged against the letterform above it.
 */
const PANEL_INSET = 16

export interface PillGeometry {
  width: number
  height: number
  borderRadius: number
}

/**
 * One source of truth for the three shapes the pill takes. Width and height
 * are plain numbers on purpose: a `min()` or `calc()` string gives the spring
 * nothing to interpolate, so the narrow-screen clamp lives in `maxWidth`.
 */
export function getPillGeometry({
  isOpen,
  isDesktop,
  linkCount,
}: {
  isOpen: boolean
  isDesktop: boolean
  linkCount: number
}): PillGeometry {
  if (!isOpen) {
    return { width: CLOSED_WIDTH, height: PILL_HEIGHT, borderRadius: PILL_RADIUS }
  }

  if (isDesktop) {
    return { width: DESKTOP_OPEN_WIDTH, height: PILL_HEIGHT, borderRadius: PILL_RADIUS }
  }

  // Below the breakpoint the pill grows downward instead of sideways. At 320px
  // there is no honest way to fit three labels between the A and the P.
  return {
    width: MOBILE_PANEL_WIDTH,
    height: PILL_HEIGHT + linkCount * MOBILE_ROW_HEIGHT,
    borderRadius: PANEL_RADIUS,
  }
}

/**
 * Keyboard counterpart of the tap-outside handler. A null `relatedTarget` is
 * focus leaving the document altogether (tabbing into the browser chrome),
 * which should close just as leaving for another element does.
 */
export function shouldCloseOnFocusOut(
  container: HTMLElement | null,
  nextFocus: Node | null
): boolean {
  if (!container) return false
  return !nextFocus || !container.contains(nextFocus)
}

/**
 * Whether the focus ring is actually being drawn on this element, rather than
 * whether it merely holds focus. Chrome and Firefox focus a button element on
 * a mouse click; keying the disclosure button's box off plain focus would
 * leave a 44px hole in an open pill for the rest of a mouse user's hover.
 * Engines that cannot answer the query get the benefit of the doubt, because
 * a ring with no box to draw on is the failure worth avoiding.
 */
function isRingVisible(el: HTMLElement): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Read the breakpoint through a store rather than an effect so rotating a
 * phone reflows the open menu, and so the first client render already agrees
 * with the server one. The server snapshot can be either value: the closed
 * pill is identical on both sides of the breakpoint, and the pill is always
 * closed on first paint.
 */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeToViewport,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true
  )
}

function Letter({
  src,
  height,
  link,
}: {
  src: string
  height: number
  link?: boolean
}) {
  const img = (
    <img
      src={src}
      alt=""
      style={{ display: 'block', height, width: 'auto' }}
    />
  )

  if (!link) {
    return <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{img}</span>
  }

  return (
    <a
      href="/"
      aria-label="AVP Software home"
      className="navpill-target"
      style={{
        minWidth: TOUCH_TARGET,
        minHeight: TOUCH_TARGET,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'opacity 200ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.6')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {img}
    </a>
  )
}

function NavLink({
  label,
  href,
  isActive,
  index,
  stacked,
  instant,
  onSelect,
}: {
  label: string
  href: string
  isActive: boolean
  index: number
  stacked: boolean
  instant: boolean
  onSelect: () => void
}) {
  return (
    <motion.a
      href={href}
      onClick={onSelect}
      aria-current={isActive ? 'page' : undefined}
      className="navpill-target navpill-link"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={
        instant
          ? { duration: 0 }
          : { duration: 0.2, delay: 0.05 + index * 0.05, ease: EASE_OUT_QUART }
      }
      style={{
        minHeight: stacked ? MOBILE_ROW_HEIGHT : TOUCH_TARGET,
        minWidth: TOUCH_TARGET,
        display: 'flex',
        alignItems: 'center',
        justifyContent: stacked ? 'flex-start' : 'center',
        padding: stacked ? `0 ${PANEL_INSET}px` : '0 0.875rem',
        fontFamily: 'var(--font-body)',
        fontSize: '0.6875rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: isActive ? 'var(--color-ink)' : 'var(--color-muted)',
        textDecoration: 'none',
      }}
    >
      {label}
    </motion.a>
  )
}

export default function NavPill() {
  const [isOpen, setIsOpen] = useState(false)
  const [pathname, setPathname] = useState('/')

  // The open pill's disclosure button has no ink of its own: the V collapses
  // to nothing and takes the button's width with it. A 0px-wide box cannot
  // show a focus ring — the ring's offset is negative, so there is nothing
  // left to paint — which stranded a keyboard user on a button that was still
  // focused, still named "Close menu", and no longer marked. Hold the 44px box
  // open while the ring is showing, and only then.
  const [isRingShowing, setIsRingShowing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Touch screens fire an emulated mouseenter on tap, before the click. With a
  // toggling disclosure button that combination cancelled itself out: hover
  // opened the pill and the click closed it again on the same tap, so the menu
  // never appeared on a phone. The pointer event that precedes both carries
  // the real input type, so record it there and let only a true mouse own the
  // hover.
  const pointerIsMouse = useRef(true)
  const isDesktop = useIsDesktop()
  const instant = useReducedMotion() ?? false

  const isCurrent = useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
    [pathname]
  )

  // Touch has no hover: close the pill when the user taps outside it.
  useEffect(() => {
    if (!isOpen) return
    const onDocPointer = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [isOpen])

  useEffect(() => {
    setPathname(window.location.pathname)

    // Also collapse on every client-side navigation. Closing on link click
    // alone is not enough: view transitions can carry this island across the
    // swap with its state intact, which left the pill stuck open after a
    // selection.
    const handler = () => {
      setPathname(window.location.pathname)
      setIsOpen(false)
    }
    document.addEventListener('astro:page-load', handler)
    return () => document.removeEventListener('astro:page-load', handler)
  }, [])

  const geometry = getPillGeometry({
    isOpen,
    isDesktop,
    linkCount: NAV_LINKS.length,
  })

  const shapeTransition = instant
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 280, damping: 28 }

  const links = NAV_LINKS.map(({ label, href }, i) => (
    <NavLink
      key={label}
      label={label}
      href={href}
      isActive={isCurrent(href)}
      index={i}
      stacked={!isDesktop}
      instant={instant}
      onSelect={() => setIsOpen(false)}
    />
  ))

  return (
    <motion.div
      ref={containerRef}
      onPointerEnter={(e) => (pointerIsMouse.current = e.pointerType === 'mouse')}
      onMouseEnter={() => pointerIsMouse.current && setIsOpen(true)}
      onMouseLeave={() => pointerIsMouse.current && setIsOpen(false)}
      // Hover owns the pill on desktop. Touch has no hover and the static nav
      // is hidden whenever JS runs, so a tap is the only way in there: open on
      // a non-mouse press, and only while closed, so tapping a link in an open
      // pill navigates instead of re-opening it. Presses that land on the
      // disclosure button are left alone, because its own click toggles and
      // opening here first would close it again on the same tap.
      onPointerDown={(e) => {
        if (buttonRef.current?.contains(e.target as Node)) return
        if (e.pointerType !== 'mouse' && !isOpen) setIsOpen(true)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false)
          // Without this the keyboard user is left focused inside a pill that
          // just collapsed around them.
          buttonRef.current?.focus()
        }
      }}
      onBlur={(e) =>
        shouldCloseOnFocusOut(containerRef.current, e.relatedTarget) && setIsOpen(false)
      }
      animate={{ ...geometry }}
      initial={false}
      transition={shapeTransition}
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        maxWidth: 'calc(100vw - 32px)',
        background: 'oklch(98% 0.003 260 / 85%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid oklch(85% 0.003 260 / 60%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {/*
        Focus rings and link hover live here rather than in global.css because
        pseudo-classes cannot be expressed inline. The offset is negative: the
        pill clips its overflow, so an outward ring on the A or P would be cut
        off at exactly the edge that needs to show it.
      */}
      <style>{`
        .navpill-target:focus-visible {
          outline: 1px solid var(--color-ink);
          outline-offset: -3px;
          border-radius: 9999px;
        }
        .navpill-link:hover { color: var(--color-ink); }
      `}</style>

      {/* Header row: fixed height so the panel below it cannot shift the
          letterforms, and so the pill's closed shape is unaffected by it. */}
      <div
        style={{
          position: 'relative',
          height: PILL_HEIGHT,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* A: pinned left, slides outward as the pill expands */}
        <Letter src="/logo-mark.svg" height={A_HEIGHT} link />

        {/* Middle slot: absolutely centred so swapping its contents never
            nudges the A or P. Holds the disclosure button, plus the links
            themselves once the pill is open on desktop. */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="navpill-target"
            onClick={() => setIsOpen((open) => !open)}
            // These bubble, so the container's own onBlur still gets its turn
            // and focus-out still closes the pill.
            onFocus={(e) => setIsRingShowing(isRingVisible(e.currentTarget))}
            onBlur={() => setIsRingShowing(false)}
            style={{
              minHeight: TOUCH_TARGET,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: 0,
              margin: 0,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* The V collapses to nothing rather than unmounting, so the
                button keeps a stable identity for focus across the toggle.
                It carries the 44px horizontal floor rather than the button,
                so the whole box goes with it: a floor on the button would
                leave an empty 44px gap before the first link once open.

                The exception is a visible focus ring, which needs a box to be
                drawn on. The gap that costs is a fair trade against an
                unmarked focused control, and it is itself feedback. */}
            <motion.span
              aria-hidden="true"
              animate={{
                width: isOpen && !isRingShowing ? 0 : TOUCH_TARGET,
                opacity: isOpen ? 0 : 1,
              }}
              initial={false}
              transition={shapeTransition}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Letter src="/v.svg" height={VP_HEIGHT} />
            </motion.span>
          </button>

          {isDesktop && (
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.nav
                  key="links-row"
                  aria-label="Primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: instant ? 0 : 0.15 }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {links}
                </motion.nav>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* P: pinned right, slides outward as the pill expands */}
        <Letter src="/p.svg" height={VP_HEIGHT} link />
      </div>

      {/* Below the breakpoint the links stack under the header row, where each
          one gets the full panel width and cannot collide with the A or P. */}
      {!isDesktop && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.nav
              key="links-panel"
              aria-label="Primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: instant ? 0 : 0.15 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              {links}
            </motion.nav>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
