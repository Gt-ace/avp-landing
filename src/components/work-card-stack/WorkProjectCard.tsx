import { useState } from 'react'
import type { RefObject } from 'react'
import type { WorkCard } from './work-card-model'

interface WorkProjectCardProps {
  card: WorkCard
  eager?: boolean
  videoControlsEnabled?: boolean
  videoRef?: RefObject<HTMLVideoElement>
}

export default function WorkProjectCard({
  card,
  eager = false,
  videoControlsEnabled = false,
  videoRef,
}: WorkProjectCardProps) {
  const [videoPlaying, setVideoPlaying] = useState(false)

  const toggleVideoPlayback = () => {
    const video = videoRef?.current
    if (!video) return

    if (video.paused) {
      video.play().catch(() => video.pause())
      return
    }

    video.pause()
  }

  return (
    <div className="relative aspect-[4/3] w-full">
      <a
        href={card.href}
        aria-label={card.title}
        className="group relative block h-full w-full overflow-hidden rounded-lg bg-black focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
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
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
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
            {card.media.fallbackWebm && (
              <source src={card.media.fallbackWebm} type="video/webm" />
            )}
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

      {card.media.kind === 'video' && videoControlsEnabled && (
        <button
          type="button"
          className="absolute right-3 top-3 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-white/50 bg-black/80 px-3 text-xs font-semibold text-white shadow-md transition-transform duration-150 hover:bg-black/90 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:ring-2 focus-visible:ring-black"
          data-work-video-toggle
          onClick={toggleVideoPlayback}
        >
          {videoPlaying ? 'Pause preview' : 'Play preview'}
        </button>
      )}
    </div>
  )
}
