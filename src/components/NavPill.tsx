'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
      style={{
        display: 'flex',
        alignItems: 'center',
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

export default function NavPill() {
  const [isOpen, setIsOpen] = useState(false)
  const [pathname, setPathname] = useState('/')

  useEffect(() => {
    setPathname(window.location.pathname)

    const handler = () => setPathname(window.location.pathname)
    document.addEventListener('astro:page-load', handler)
    return () => document.removeEventListener('astro:page-load', handler)
  }, [])

  return (
    <motion.div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      animate={{ width: isOpen ? 480 : 100 }}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 28,
      }}
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        height: 40,
        borderRadius: 9999,
        background: 'oklch(98% 0.003 260 / 85%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid oklch(85% 0.003 260 / 60%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {/* A: pinned left, slides outward as the pill expands */}
      <Letter src="/logo-mark.svg" height={A_HEIGHT} link />

      {/* Middle slot: absolutely centred so swapping its contents never
          nudges the A or P. Shows V when closed, nav links when open. */}
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
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {NAV_LINKS.map(({ label, href }, i) => {
                const isActive =
                  href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(href)

                return (
                  <motion.a
                    key={label}
                    href={href}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{
                      duration: 0.2,
                      delay: 0.05 + i * 0.05,
                      ease: EASE_OUT_QUART,
                    }}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: isActive
                        ? 'var(--color-ink)'
                        : 'var(--color-muted)',
                      textDecoration: 'none',
                      padding: '0 1rem',
                      display: 'block',
                    }}
                  >
                    {label}
                  </motion.a>
                )
              })}
            </motion.div>
          ) : (
            <motion.span
              key="v"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Letter src="/v.svg" height={VP_HEIGHT} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* P: pinned right, slides outward as the pill expands */}
      <Letter src="/p.svg" height={VP_HEIGHT} link />
    </motion.div>
  )
}
