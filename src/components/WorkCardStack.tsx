import { useEffect, useRef, useState } from 'react'
import WorkProjectCard from './work-card-stack/WorkProjectCard'
import {
  workStackMode,
  type WorkStackMode,
} from './work-card-stack/work-stack-policy'
import type { WorkCard } from './work-card-stack/work-card-model'
import { StickyCard002 } from './ui/skiper-ui/skiper17'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  const [mode, setMode] = useState<WorkStackMode>('list')
  const [reducedMotion, setReducedMotion] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMode = () => {
      setReducedMotion(motionQuery.matches)
      setMode(workStackMode(window.innerWidth, motionQuery.matches))
    }

    updateMode()
    window.addEventListener('resize', updateMode)
    motionQuery.addEventListener('change', updateMode)

    return () => {
      window.removeEventListener('resize', updateMode)
      motionQuery.removeEventListener('change', updateMode)
    }
  }, [])

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
    <section aria-label="Selected work">
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
