# Task 02: NavPill component

Depends on: Task 01 complete.

Create `src/components/NavPill.tsx`. This is a React island (`client:load`) — the only interactive navigation element. It floats fixed at the top center of every page and expands on hover to reveal nav links.

---

## src/components/NavPill.tsx

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { label: 'WORK',    href: '/work'    },
  { label: 'ABOUT',   href: '/about'   },
  { label: 'CONTACT', href: '/contact' },
]

const EASE_OUT_QUART = [0.16, 1, 0.3, 1] as const

export default function NavPill() {
  const [isOpen, setIsOpen] = useState(false)
  const [pathname, setPathname] = useState('/')

  useEffect(() => {
    setPathname(window.location.pathname)

    // Keep pathname in sync across Astro View Transitions
    const handler = () => setPathname(window.location.pathname)
    document.addEventListener('astro:page-load', handler)
    return () => document.removeEventListener('astro:page-load', handler)
  }, [])

  return (
    <motion.div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      animate={{ width: isOpen ? 480 : 160 }}
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
        justifyContent: 'space-evenly',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
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
    </motion.div>
  )
}
```

---

## Notes

- The `motion.div` spring (`stiffness: 280, damping: 28`) gives a quick, weighted expansion with no bounce.
- `transform: translateX(-50%)` on the `style` prop rather than in `animate` — Framer Motion must not own the centering transform or it will interfere with the width animation.
- `overflow: hidden` clips the text items during the width transition so nothing bleeds outside the pill.
- The `astro:page-load` event listener keeps the active link state accurate after View Transitions navigation.
- `@media (prefers-reduced-motion: reduce)`: Framer Motion respects this automatically and disables spring transitions. No additional code needed.

---

## Verification

- Nav pill visible at top center on every page
- Collapsed: 160px wide, no text visible
- On hover: expands to 480px, three links appear with stagger
- Active page link is `--color-ink`; others are `--color-muted`
- Navigating between pages keeps the pill visible without re-mounting (Astro View Transitions persists fixed elements)
- On mobile (375px): pill still centered, usable via tap (no hover — pill stays expanded on touch devices; this is acceptable)
