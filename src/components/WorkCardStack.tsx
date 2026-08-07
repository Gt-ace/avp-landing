import { useEffect, useRef, useState } from 'react'
import WorkProjectCard from './work-card-stack/WorkProjectCard'
import type { WorkCard } from './work-card-stack/work-card-model'
import { StickyCard002 } from './ui/skiper-ui/skiper17'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  const [enhanced, setEnhanced] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => setEnhanced(true), [])

  // The stack pins on the first card, so nothing on screen says the page still
  // moves. The hint retires as soon as the visitor proves they found the scroll.
  useEffect(() => {
    if (!enhanced) return

    const onScroll = () => {
      if (window.scrollY > 24) setScrolled(true)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enhanced])

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

      {enhanced && cards.length > 1 && (
        <p className="work-scroll-hint" data-work-scroll-hint-done={scrolled ? '' : undefined}>
          Scroll
          <span className="work-scroll-hint-arrow" aria-hidden="true">
            &darr;
          </span>
        </p>
      )}
    </section>
  )
}
