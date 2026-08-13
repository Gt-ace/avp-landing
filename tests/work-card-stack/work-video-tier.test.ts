import { describe, expect, it } from 'vitest'
import {
  DESKTOP_VIDEO_QUERY,
  resolveWorkVideoSources,
} from '../../src/components/work-card-stack/WorkProjectCard'
import type { WorkVideoMedia } from '../../src/components/work-card-stack/work-card-model'

const media: WorkVideoMedia = {
  kind: 'video',
  desktopWebm: '/demo-desktop.webm',
  desktopMp4: '/demo-desktop.mp4',
  mobileWebm: '/demo-mobile.webm',
  mobileMp4: '/demo-mobile.mp4',
  fallbackWebm: '/demo-desktop.webm',
  poster: '/demo.avif',
}

describe('work video tier resolution', () => {
  it('serves only the mobile encodes to a narrow viewport', () => {
    expect(resolveWorkVideoSources(media, false)).toEqual([
      { src: '/demo-mobile.webm', type: 'video/webm' },
      { src: '/demo-mobile.mp4', type: 'video/mp4' },
    ])
  })

  it('serves only the desktop encodes once the viewport is wide enough', () => {
    expect(resolveWorkVideoSources(media, true)).toEqual([
      { src: '/demo-desktop.webm', type: 'video/webm' },
      { src: '/demo-desktop.mp4', type: 'video/mp4' },
    ])
  })

  it('omits a tier webm that was never encoded rather than borrowing the other tier', () => {
    // The bug this fixes: a phone fetching /volunteer-platform-desktop.webm
    // (5.9MB) where /volunteer-platform-mobile.mp4 (3.0MB) was intended. The
    // model's `fallbackWebm` *is* the desktop webm, so any trailing "last
    // resort" source reintroduces exactly that cost on the narrow tier.
    const withoutMobileWebm: WorkVideoMedia = { ...media, mobileWebm: undefined }

    expect(resolveWorkVideoSources(withoutMobileWebm, false)).toEqual([
      { src: '/demo-mobile.mp4', type: 'video/mp4' },
    ])
  })

  it('never emits a source from the tier it was not asked for', () => {
    for (const wide of [false, true]) {
      const unwanted = wide ? 'mobile' : 'desktop'
      const emitted = resolveWorkVideoSources(media, wide).map(({ src }) => src)

      expect(emitted.filter((src) => src.includes(unwanted))).toEqual([])
    }
  })

  it('pins the tier breakpoint so both call sites can share it', () => {
    expect(DESKTOP_VIDEO_QUERY).toBe('(min-width: 768px)')
  })
})
