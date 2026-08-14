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
  const stackRef = useRef<HTMLElement>(null)

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

  // Only the card we are actually navigating into gets a view-transition-name,
  // and only for the moment the transition needs it.
  //
  // Naming every card at render time broke two ways. Backwards, the incoming
  // /work document is snapshotted before this island hydrates, so the names
  // sat on the un-pinned list layout and the morph animated toward the wrong
  // box. Forwards, every non-clicked card became its own transition group, and
  // captured groups are not clipped by the stack's `overflow-hidden` frame, so
  // the cards below spilled outside it for the length of the animation.
  //
  // `astro:before-preparation` is awaited before `document.startViewTransition`
  // (astro/dist/transitions/router.js), so a name set here is on the element in
  // time for the old-state capture. On the way back nothing here is named, and
  // the page cross-fades instead of morphing.
  useEffect(() => {
    const nameClickedCard = (event: Event) => {
      const destination = (event as Event & { to?: URL }).to
      const stack = stackRef.current
      // Astro swaps the whole body without unmounting React, so the cleanup
      // below never runs for a page we have navigated away from. Ignore the
      // event once our section is detached rather than naming orphan nodes.
      if (!destination || !stack?.isConnected) return

      // A navigation that never reached the transition (aborted, fell back to a
      // full load) can leave names behind, so clear before naming again.
      stack.querySelectorAll<HTMLElement>('[data-morph-image], [data-morph-title]').forEach((el) => {
        el.style.removeProperty('view-transition-name')
      })

      const slug = destination.pathname.match(/^\/work\/([^/]+)\/?$/)?.[1]
      if (!slug) return

      const card = stack.querySelector<HTMLElement>(`[data-work-card="${CSS.escape(slug)}"]`)
      if (!card) return

      const image = card.querySelector<HTMLElement>('[data-morph-image]')
      const title = card.querySelector<HTMLElement>('[data-morph-title]')
      // The video card is deliberately left out: Chromium drops <video>
      // playback across a transition whenever the video or an ancestor carries
      // a view-transition-name, so only its title morphs.
      if (image) image.style.setProperty('view-transition-name', `image-${slug}`)
      if (title) title.style.setProperty('view-transition-name', `title-${slug}`)
    }

    document.addEventListener('astro:before-preparation', nameClickedCard)
    return () => document.removeEventListener('astro:before-preparation', nameClickedCard)
  }, [])

  if (cards.length === 0) return null

  return (
    <section
      ref={stackRef}
      className="work-stack"
      aria-label="Selected work"
      data-work-stack-ready={enhanced ? '' : undefined}
    >
      {/*
        On a phone the card no longer fills the screen and nothing around it
        says what the page is, so the heading shows there and stays screen-reader
        only from 640px up. It is positioned out of flow (see .work-page-label)
        because flow content above the h-svh scene pushes the pin start down.
      */}
      <h1 className="work-page-label">Selected work</h1>

      <StickyCard002
        cards={cards}
        enabled={enhanced}
        renderCard={(card, index) => (
          <WorkProjectCard
            card={card}
            eager={index === 0}
            fill={enhanced}
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
