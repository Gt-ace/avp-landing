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
   * Optional showcase video. Renders above the screenshots on the detail page.
   * Each source is optional so we can add a webm only once it's actually
   * smaller than its mp4 sibling (webm-first ordering means the browser eats
   * the first match — a bloated webm would defeat the purpose).
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
    images: ['/images/volunteer-platform.avif'],
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
    images: ['/images/crux.avif'],
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
    images: ['/images/amber.avif'],
    credits: { Studio: 'AVP Software' },
  },
]
