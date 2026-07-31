import { useEffect, useRef, useState } from 'react'
import WorkProjectCard from './work-card-stack/WorkProjectCard'
import {
  workStackMode,
  type WorkStackMode,
} from './work-card-stack/work-stack-policy'
import type { WorkCard } from './work-card-stack/work-card-model'
import { startSmoothScroll } from './work-card-stack/smooth-scroll'
import { StickyCard002 } from './ui/skiper-ui/skiper17'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  // Must match the server render: React keeps server-rendered attributes on a
  // hydration mismatch, which would pin GSAP onto the list layout. The effect
  // below picks the real mode, and `ready` keeps it unpainted until it has.
  const [mode, setMode] = useState<WorkStackMode>('list')
  const [reducedMotion, setReducedMotion] = useState(true)
  const [ready, setReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMode = () => {
      setReducedMotion(motionQuery.matches)
      setMode(workStackMode(window.innerWidth, motionQuery.matches))
    }

    updateMode()
    setReady(true)
    window.addEventListener('resize', updateMode)
    motionQuery.addEventListener('change', updateMode)

    return () => {
      window.removeEventListener('resize', updateMode)
      motionQuery.removeEventListener('change', updateMode)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'stack') return
    return startSmoothScroll()
  }, [mode])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (reducedMotion) {
      video.pause()
      video.currentTime = 0
      return
    }

    video.play().catch(() => {
      video.pause()
    })
  }, [reducedMotion])

  if (cards.length === 0) return null

  return (
    <section
      className="work-stack"
      aria-label="Selected work"
      data-work-stack-ready={ready ? '' : undefined}
    >
      <StickyCard002
        cards={cards}
        enabled={mode === 'stack'}
        renderCard={(card, index) => (
          <WorkProjectCard
            card={card}
            eager={index === 0}
            videoRef={card.media.kind === 'video' ? videoRef : undefined}
          />
        )}
      />
    </section>
  )
}
