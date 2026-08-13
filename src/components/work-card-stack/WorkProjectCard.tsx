import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { WorkCard, WorkVideoMedia } from './work-card-model'

/**
 * `media` on the `<source>` children of a video element left the HTML spec in
 * 2014. Chrome and Firefox ignore it and fall through to the first source whose
 * `type` they can play, so a desktop-first list handed phones 5.9MB. Only
 * Safari still honours the query, which is why the waste stayed invisible on
 * iOS. The tier is JS work now, off this one query, shared with the detail
 * page at `src/pages/work/[slug].astro`.
 */
export const DESKTOP_VIDEO_QUERY = '(min-width: 768px)'

export interface WorkVideoSource {
  src: string
  type: string
}

/**
 * One tier's sources, in `type` preference order. Never mixes tiers: the old
 * flat list ended in the model's last-resort webm, which is the desktop encode,
 * so a phone that fell past the mp4 paid the full desktop cost anyway.
 */
export function resolveWorkVideoSources(
  media: WorkVideoMedia,
  wideViewport: boolean,
): WorkVideoSource[] {
  const webm = wideViewport ? media.desktopWebm : media.mobileWebm
  const mp4 = wideViewport ? media.desktopMp4 : media.mobileMp4

  return [
    ...(webm ? [{ src: webm, type: 'video/webm' }] : []),
    { src: mp4, type: 'video/mp4' },
  ]
}

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
  // Starts narrow so the server markup, and any client without JS, names the
  // cheap encode. Resolved once on mount rather than tracked: re-picking on
  // every resize past 768px would re-download megabytes and restart playback
  // mid-scroll, which nobody asked for.
  const [wideViewport, setWideViewport] = useState(false)

  useEffect(() => {
    setWideViewport(window.matchMedia(DESKTOP_VIDEO_QUERY).matches)
  }, [])

  // Swapping <source> children is inert until the element re-runs its resource
  // selection algorithm, so the upgrade has to ask for it. Only ever fires
  // going narrow -> wide, i.e. once, on a desktop client.
  useEffect(() => {
    const video = videoRef?.current
    if (!wideViewport || !video) return

    const wasPlaying = !video.paused
    video.load()
    if (wasPlaying) video.play().catch(() => video.pause())
  }, [wideViewport, videoRef])

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
    <div className="relative aspect-[4/3] w-full" data-work-card={card.id}>
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
            data-morph-image
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
            {resolveWorkVideoSources(card.media, wideViewport).map(
              ({ src, type }) => (
                <source key={src} src={src} type={type} />
              ),
            )}
          </video>
        )}

        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-200 group-hover:opacity-90"
          aria-hidden="true"
        />
        <span
          className="work-card-title pointer-events-none absolute bottom-0 left-0 max-w-[85%] p-5 font-display text-[clamp(1.5rem,3vw,2.75rem)] font-semibold leading-[1.05] text-white sm:p-7"
          data-morph-title
          aria-hidden="true"
        >
          {card.title}
        </span>
      </a>

      {card.media.kind === 'video' && videoControlsEnabled && (
        <button
          type="button"
          className="group/toggle absolute right-1 top-1 z-10 inline-flex min-h-11 min-w-11 items-center justify-center bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          data-work-video-toggle
          onClick={toggleVideoPlayback}
        >
          {/*
           * The visible chip stays small and translucent; the button keeps the
           * 44px hit area around it so the control is still touch-reachable.
           */}
          <span className="rounded-full border border-white/25 bg-black/25 px-2 py-[0.2rem] text-[0.625rem] font-medium tracking-wide text-white/70 backdrop-blur-sm transition-colors duration-150 group-hover/toggle:bg-black/45 group-hover/toggle:text-white">
            {videoPlaying ? 'Pause preview' : 'Play preview'}
          </span>
        </button>
      )}
    </div>
  )
}
