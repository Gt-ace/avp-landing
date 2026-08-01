import type { Project } from '../../data/projects'

export interface WorkImageMedia {
  kind: 'image'
  src: string
  alt: string
}

export interface WorkVideoMedia {
  kind: 'video'
  desktopWebm?: string
  desktopMp4: string
  mobileWebm?: string
  mobileMp4: string
  fallbackWebm?: string
  poster: string
}

export type WorkCardMedia = WorkImageMedia | WorkVideoMedia

export interface WorkCard {
  id: string
  title: string
  href: string
  media: WorkCardMedia
}

export function toWorkCards(source: readonly Project[]): WorkCard[] {
  return source.map((project) => {
    const media: WorkCardMedia = project.video
      ? {
          kind: 'video',
          desktopWebm: project.video.desktopWebm,
          desktopMp4: project.video.desktopMp4,
          mobileWebm: project.video.mobileWebm,
          mobileMp4: project.video.mobileMp4,
          fallbackWebm: project.video.desktopWebm,
          poster: project.video.poster,
        }
      : {
          kind: 'image',
          src:
            project.images[0] ??
            (() => {
              throw new Error(
                `Project "${project.slug}" needs a first image for the work card`,
              )
            })(),
          alt: `${project.title} interface preview`,
        }

    return {
      id: project.slug,
      title: project.title,
      href: `/work/${project.slug}`,
      media,
    }
  })
}
