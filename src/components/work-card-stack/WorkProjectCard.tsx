import type { Ref } from 'react'
import type { WorkCard } from './work-card-model'

interface WorkProjectCardProps {
  card: WorkCard
  eager?: boolean
  videoRef?: Ref<HTMLVideoElement>
}

export default function WorkProjectCard({
  card,
  eager = false,
  videoRef,
}: WorkProjectCardProps) {
  return (
    <a
      href={card.href}
      aria-label={card.title}
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-black focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
    >
      {card.media.kind === 'image' ? (
        <img
          src={card.media.src}
          alt={card.media.alt}
          loading={eager ? 'eager' : 'lazy'}
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={card.media.poster}
          className="h-full w-full object-cover"
          data-work-card-video
        >
          {card.media.desktopWebm && (
            <source
              src={card.media.desktopWebm}
              type="video/webm"
              media="(min-width: 768px)"
            />
          )}
          <source
            src={card.media.desktopMp4}
            type="video/mp4"
            media="(min-width: 768px)"
          />
          {card.media.mobileWebm && (
            <source src={card.media.mobileWebm} type="video/webm" />
          )}
          <source src={card.media.mobileMp4} type="video/mp4" />
        </video>
      )}

      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-200 group-hover:opacity-90"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 max-w-[85%] p-5 font-display text-[clamp(1.5rem,3vw,2.75rem)] font-semibold leading-[1.05] text-white sm:p-7"
        aria-hidden="true"
      >
        {card.title}
      </span>
    </a>
  )
}
