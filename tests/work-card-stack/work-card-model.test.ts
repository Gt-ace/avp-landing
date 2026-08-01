import { describe, expect, it } from 'vitest'
import { projects } from '../../src/data/projects'
import { toWorkCards } from '../../src/components/work-card-stack/work-card-model'

describe('work card adapter', () => {
  it('preserves project order, titles, and internal detail routes', () => {
    const cards = toWorkCards(projects)

    expect(cards.map(({ id, title, href }) => ({ id, title, href }))).toEqual([
      {
        id: 'volunteer-platform',
        title: 'START Summit x Hack Volunteer Platform',
        href: '/work/volunteer-platform',
      },
      { id: 'crux', title: 'Crux', href: '/work/crux' },
      { id: 'amber', title: 'Amber', href: '/work/amber' },
    ])
  })

  it('uses responsive video for volunteering and first images elsewhere', () => {
    const [volunteer, crux, amber] = toWorkCards(projects)

    expect(volunteer.media).toEqual({
      kind: 'video',
      desktopWebm: '/volunteer-platform-desktop.webm',
      desktopMp4: '/volunteer-platform-desktop.mp4',
      mobileWebm: undefined,
      mobileMp4: '/volunteer-platform-mobile.mp4',
      fallbackWebm: '/volunteer-platform-desktop.webm',
      poster: '/images/volunteer-platform.avif',
    })
    expect(crux.media).toEqual({
      kind: 'image',
      src: '/images/crux.avif',
      alt: 'Crux interface preview',
    })
    expect(amber.media).toEqual({
      kind: 'image',
      src: '/images/amber.avif',
      alt: 'Amber interface preview',
    })
  })

  it('rejects an image project without a usable first image', () => {
    const broken = [{ ...projects[1], images: [] }]

    expect(() => toWorkCards(broken)).toThrow(
      'Project "crux" needs a first image for the work card',
    )
  })
})
