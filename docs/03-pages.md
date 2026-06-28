# Task 03: Data + all pages

Depends on: Tasks 00, 01, 02 complete.

Create `src/data/projects.ts` and all five Astro page files. After this task the site is complete.

---

## src/data/projects.ts

```ts
export interface Project {
  slug: string
  client: string
  year: string
  title: string
  description: string
  url: string
  tech: string[]
  images: string[]
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
```

---

## src/pages/index.astro

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
---
<BaseLayout title="AVP Software">
  <section class="hero">
    <video autoplay muted loop playsinline>
      <source src="/hero2.webm" type="video/webm" />
    </video>
    <div class="hero-overlay" aria-hidden="true"></div>
    <h1 class="hero-title">AVP Software</h1>
  </section>
</BaseLayout>

<style>
  .hero {
    position: relative;
    min-height: 100dvh;
    overflow: hidden;
  }

  .hero video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: var(--color-overlay);
  }

  .hero-title {
    position: absolute;
    bottom: 12vh;
    left: 10vw;
    font-family: var(--font-display);
    font-size: var(--text-hero);
    font-weight: 400;
    color: white;
    text-wrap: balance;
    line-height: 1;
    margin: 0;
    animation: hero-in 0.9s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes hero-in {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-title {
      animation: none;
    }
  }
</style>
```

---

## src/pages/work/index.astro

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import { projects } from '../../data/projects'
---
<BaseLayout title="Work — AVP Software">
  <main class="work-page">
    {projects.map((project) => (
      <article class="project-row">
        <a href={`/work/${project.slug}`} class="project-row-inner">
          <div class="project-text">
            <div class="project-meta">
              <span class="label">{project.client}</span>
              <span class="label">{project.year}</span>
            </div>
            <h2
              class="project-title"
              transition:name={`title-${project.slug}`}
            >
              {project.title}
            </h2>
            <p class="project-desc">{project.description}</p>
            <span class="project-read label">Read more</span>
          </div>
          <div class="project-images">
            {project.images.map((src, i) => (
              <img
                src={src}
                alt={project.title}
                loading="lazy"
                transition:name={i === 0 ? `image-${project.slug}` : undefined}
              />
            ))}
          </div>
        </a>
      </article>
    ))}
  </main>
</BaseLayout>

<style>
  .work-page {
    padding-top: clamp(8rem, 15vh, 12rem);
  }

  .project-row {
    border-top: 1px solid var(--color-border);
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .project-row:last-child {
    border-bottom: 1px solid var(--color-border);
  }

  .project-row.visible {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .project-row {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }

  .project-row-inner {
    display: grid;
    grid-template-columns: 2fr 3fr;
    padding: 4rem 0 4rem clamp(2rem, 5vw, 6rem);
    text-decoration: none;
    color: inherit;
  }

  .project-text {
    padding-right: 3rem;
  }

  .project-meta {
    display: flex;
    justify-content: space-between;
  }

  .project-title {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2.5rem);
    font-weight: 400;
    color: var(--color-ink);
    margin-top: 0.5rem;
    line-height: 1.1;
    text-wrap: balance;
  }

  .project-desc {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-muted);
    max-width: 44ch;
    margin-top: 1rem;
    line-height: 1.6;
  }

  .project-read {
    display: inline-block;
    color: var(--color-ink);
    margin-top: 1.5rem;
  }

  .project-row-inner:hover .project-read {
    text-decoration: underline;
  }

  .project-images {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .project-images img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    aspect-ratio: 4 / 3;
  }

  @media (max-width: 767px) {
    .project-row-inner {
      grid-template-columns: 1fr;
      padding-left: 1.25rem;
      padding-right: 1.25rem;
    }

    .project-text {
      padding-right: 0;
    }

    .project-images {
      margin-top: 1.5rem;
    }
  }
</style>

<script>
  function initObserver() {
    const rows = document.querySelectorAll('.project-row')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    rows.forEach((r) => observer.observe(r))
  }

  // Run on first load and after every View Transition navigation
  initObserver()
  document.addEventListener('astro:page-load', initObserver)
</script>
```

---

## src/pages/work/[slug].astro

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import { projects } from '../../data/projects'

export function getStaticPaths() {
  return projects.map((p) => ({ params: { slug: p.slug } }))
}

const { slug } = Astro.params
const project = projects.find((p) => p.slug === slug)

if (!project) {
  return Astro.redirect('/work')
}

// Repeat the single image 3 times for visual richness
// (placeholder until real screenshots are added to project.images)
const displayImages = Array.from(
  { length: 3 },
  (_, i) => project.images[i % project.images.length]
)
---
<BaseLayout title={`${project.title} — AVP Software`}>
  <div class="detail-layout">
    <aside class="detail-left">
      <span class="label">{project.client}</span>

      <h1
        class="detail-title"
        transition:name={`title-${project.slug}`}
      >
        {project.title}
      </h1>

      <p class="detail-desc">{project.description}</p>

      <div class="detail-tech">
        <span class="label">Built with</span>
        <span class="detail-tech-list">{project.tech.join(', ')}</span>
      </div>

      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        class="detail-visit label"
      >
        Visit project &#8599;
      </a>

      <div class="detail-credits">
        <span class="label">Credits</span>
        <dl class="credits-list">
          {Object.entries(project.credits).map(([role, name]) => (
            <>
              <dt>{role}</dt>
              <dd>{name}</dd>
            </>
          ))}
        </dl>
      </div>
    </aside>

    <div class="detail-right">
      {displayImages.map((src, i) => (
        <img
          src={src}
          alt={project.title}
          loading={i === 0 ? 'eager' : 'lazy'}
          transition:name={i === 0 ? `image-${project.slug}` : undefined}
        />
      ))}
    </div>
  </div>
</BaseLayout>

<style>
  .detail-layout {
    display: grid;
    grid-template-columns: 2fr 3fr;
    min-height: 100dvh;
  }

  .detail-left {
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
    padding: clamp(8rem, 15vh, 12rem) clamp(2rem, 5vw, 5rem) 4rem;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .detail-title {
    font-family: var(--font-display);
    font-size: var(--text-title);
    font-weight: 400;
    color: var(--color-ink);
    line-height: 1.1;
    text-wrap: balance;
    margin-top: 0.5rem;
  }

  .detail-desc {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-muted);
    max-width: 44ch;
    margin-top: 1.5rem;
    line-height: 1.6;
  }

  .detail-tech {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-tech-list {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-ink);
  }

  .detail-visit {
    display: inline-block;
    color: var(--color-ink);
    margin-top: 2rem;
    transition: opacity 200ms;
  }

  .detail-visit:hover {
    opacity: 0.6;
  }

  .detail-credits {
    margin-top: auto;
    padding-top: 3rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .credits-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 1rem;
    list-style: none;
    margin-top: 0.5rem;
  }

  .credits-list dt {
    font-family: var(--font-body);
    font-size: var(--text-label);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .credits-list dd {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-ink);
  }

  .detail-right {
    /* scrolls naturally with the page */
  }

  .detail-right img {
    width: 100%;
    display: block;
  }

  .detail-right img:nth-child(odd) {
    aspect-ratio: 16 / 9;
  }

  .detail-right img:nth-child(even) {
    aspect-ratio: 4 / 3;
  }

  @media (max-width: 767px) {
    .detail-layout {
      grid-template-columns: 1fr;
    }

    .detail-left {
      position: static;
      height: auto;
      padding: 8rem 1.25rem 3rem;
    }

    .detail-credits {
      margin-top: 3rem;
    }
  }
</style>
```

---

## src/pages/about.astro

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
---
<BaseLayout title="About — AVP Software">
  <main class="page-container">
    <span class="page-label">About</span>
    <h1 class="page-heading">Arthur Van Petegem</h1>
    <div class="page-body">
      <p>
        Arthur Van Petegem is a software engineer and builder based in St. Gallen.
        He builds precise, opinionated software, from volunteer coordination platforms
        to self-hosted personal tools.
      </p>
      <p>
        AVP Software is the studio through which that work ships. The focus is on
        craft over convention: software that is fast, considered, and owned by the
        people who use it.
      </p>
    </div>
  </main>
</BaseLayout>
```

---

## src/pages/contact.astro

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'

const contacts = [
  {
    label: 'Email',
    value: 'arthurvanpetegem@outlook.com',
    href: 'mailto:arthurvanpetegem@outlook.com',
    external: false,
  },
  {
    label: 'LinkedIn',
    value: 'Arthur Van Petegem',
    href: 'https://www.linkedin.com/in/arthur-van-petegem-7b72b1323/',
    external: true,
  },
  {
    label: 'GitHub',
    value: 'Gt-ace',
    href: 'https://github.com/Gt-ace',
    external: true,
  },
]
---
<BaseLayout title="Contact — AVP Software">
  <main class="page-container">
    <span class="page-label">Contact</span>
    <h1 class="page-heading">Get in touch</h1>

    <div class="contact-rows">
      {contacts.map(({ label, value, href, external }) => (
        <a
          href={href}
          class="contact-row"
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          <span class="contact-label label">{label}</span>
          <span class="contact-value">{value}</span>
          <svg
            class="contact-arrow"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 13L13 3M13 3H6M13 3V10"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>
      ))}
    </div>
  </main>
</BaseLayout>

<style>
  .contact-rows {
    display: flex;
    flex-direction: column;
  }

  .contact-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 0;
    border-top: 1px solid var(--color-border);
    text-decoration: none;
    color: inherit;
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .contact-row:last-child {
    border-bottom: 1px solid var(--color-border);
  }

  .contact-row:hover {
    transform: translateX(4px);
  }

  @media (prefers-reduced-motion: reduce) {
    .contact-row {
      transition: none;
    }
  }

  .contact-label {
    width: 5rem;
    flex-shrink: 0;
  }

  .contact-value {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-ink);
    flex: 1;
    padding: 0 1rem;
  }

  .contact-arrow {
    color: var(--color-muted);
    flex-shrink: 0;
    transition: color 200ms;
  }

  .contact-row:hover .contact-arrow {
    color: var(--color-ink);
  }
</style>
```

---

## Final verification checklist

- [ ] `npm run build` — no errors, `dist/` populated
- [ ] `/` — hero video plays full-bleed, title bottom-left, fades up on load
- [ ] `/work` — three project rows, images visible, rows animate in on scroll
- [ ] `/work/volunteer-platform`, `/work/crux`, `/work/amber` — detail pages render
- [ ] Detail page: left panel sticky, right panel scrolls, "Visit project" links open correctly
- [ ] `/about` — heading and two body paragraphs render in correct fonts
- [ ] `/contact` — three rows, hover shifts row right 4px
- [ ] Nav pill: centered top, expands on hover, active link highlighted
- [ ] View Transitions: title morphs between work list and detail page
- [ ] Mobile 375px: all pages single-column, no horizontal overflow
- [ ] `prefers-reduced-motion`: all animations instant/disabled
- [ ] `docker build -t avp-landing .` — succeeds
