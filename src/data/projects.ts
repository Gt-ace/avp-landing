export interface Project {
  slug: string
  client: string
  year: string
  title: string
  description: string
  url: string
  tech: string[]
  images: string[]
  /**
   * Images to show in the /work listing grid. Defaults to `images` when
   * omitted. Use this when the detail page needs more screenshots than
   * the listing preview should show.
   */
  previewImages?: string[]
  /**
   * Optional showcase video. Renders above the screenshots on the detail page.
   *
   * The desktop/mobile split is chosen in JS off `matchMedia`, never by `media`
   * on `<source>`: that attribute left the HTML spec in 2014 and only Safari
   * still honours it, so leaning on it shipped the desktop encode to every
   * Chrome and Firefox phone. Within one tier, ordering does still matter,
   * because the browser takes the first source whose `type` it can play. That
   * is why each webm is optional: add one only once it is genuinely smaller
   * than its mp4 sibling, or listing it first makes the transfer worse.
   */
  video?: {
    desktopWebm?: string
    desktopMp4: string
    mobileWebm?: string
    mobileMp4: string
    poster: string
  }
  credits: Record<string, string>
}

export const projects: Project[] = [
  {
    slug: 'volunteer-platform',
    client: 'START Global',
    year: '2025',
    title: 'START Summit x Hack Volunteer Platform',
    description:
      'Web platform managing 600+ volunteers for START Summit x Hack 2027. Handles registration, role and shift assignment, team management, and event-day check-in. Built mobile-first for the 95% of volunteers on phones.',
    url: 'https://volunteer.startglobal.org',
    tech: ['Next.js 16', 'TypeScript', 'Supabase', 'Cloudflare Containers'],
    images: [
      '/images/volunteer-platform.avif',
      '/images/benefits-section.avif',
      '/images/volunteer-platform-mobile.avif',
    ],
    previewImages: ['/images/benefits-section.avif'],
    video: {
      desktopWebm: '/volunteer-platform-desktop.webm',
      desktopMp4: '/volunteer-platform-desktop.mp4',
      // mobileWebm: add once a re-encode lands under 3.1M (mp4 size)
      mobileMp4: '/volunteer-platform-mobile.mp4',
      poster: '/images/volunteer-platform.avif',
    },
    credits: { Studio: 'AVP Software' },
  },
  {
    slug: 'crux',
    client: 'AVP Software',
    year: '2025',
    title: 'Crux',
    description:
      'Product comparison engine. Resolves product identifiers, fetches specifications, normalises data with an LLM, and renders a clean side-by-side comparison. Pure-code alignment and row winners; the model only normalises.',
    url: 'https://crux.avp.software',
    tech: ['Next.js', 'TypeScript', 'Claude API'],
    images: ['/images/crux.avif', '/images/crux2.avif'],
    credits: { Studio: 'AVP Software' },
  },
  {
    slug: 'amber',
    client: 'AVP Software',
    year: '2025',
    title: 'Amber',
    description:
      'Self-hostable personal canvas: link-in-bio, small site, notebook, blog. Markdown files on disk, no database lock-in. Anti-platform: your software, your server, your files. AGPL-3.0.',
    url: 'https://amber.avp.software',
    tech: ['Bun', 'SvelteKit', 'SQLite'],
    images: ['/images/amber.avif', '/images/amber2.avif'],
    credits: { Studio: 'AVP Software' },
  },
]
