import { useEffect, useRef, useState } from 'react'
import WorkProjectCard from './work-card-stack/WorkProjectCard'
import type { WorkCard } from './work-card-stack/work-card-model'
import { StickyCard002 } from './ui/skiper-ui/skiper17'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  const [enhanced, setEnhanced] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => setEnhanced(true), [])

  useEffect(() => {
    if (!enhanced) return
    const video = videoRef.current
    if (!video) return

    video.play().catch(() => video.pause())
  }, [enhanced])

  if (cards.length === 0) return null

  return (
    <section
      className="work-stack"
      aria-label="Selected work"
      data-work-stack-ready={enhanced ? '' : undefined}
    >
      <StickyCard002
        cards={cards}
        enabled={enhanced}
        renderCard={(card, index) => (
          <WorkProjectCard
            card={card}
            eager={index === 0}
            videoControlsEnabled={enhanced}
            videoRef={card.media.kind === 'video' ? videoRef : undefined}
          />
        )}
      />
    </section>
  )
}
