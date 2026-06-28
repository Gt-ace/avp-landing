'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { label: 'WORK',    href: '/work'    },
  { label: 'ABOUT',   href: '/about'   },
  { label: 'CONTACT', href: '/contact' },
]

const EASE_OUT_QUART = [0.16, 1, 0.3, 1] as const

function Logo() {
  return (
    <a
      href="/"
      aria-label="AVP Software — home"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        height: '100%',
        transition: 'opacity 200ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.6')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      <img
        src="/logo-mark.svg"
        alt=""
        width={18}
        height={18}
        style={{ display: 'block', height: 18, width: 'auto' }}
      />
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
      animate={{ width: isOpen ? 480 : 116 }}
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
      <Logo />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence>
          {isOpen &&
            NAV_LINKS.map(({ label, href }, i) => {
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
                    delay: i * 0.05,
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
        </AnimatePresence>
      </div>

      <Logo />
    </motion.div>
  )
}
