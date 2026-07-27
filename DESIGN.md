# DESIGN.md: avp.software landing

A summary of the landing page design: the system it runs on, the page
structure, and the motion decisions behind the hero.

## Design language

Editorial and monochrome. A serif display face paired with a clean
sans body, near black ink on an off white ground, generous type scale,
and restrained motion. The feel target is a small studio that is
precise and confident, not loud.

### Tokens (`src/styles/global.css`)

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `oklch(98% 0.003 260)` | Page ground (off white) |
| `--color-surface` | `oklch(100% 0 0)` | Raised surfaces |
| `--color-ink` | `oklch(10% 0.005 260)` | Primary text and marks |
| `--color-muted` | `oklch(42% 0.005 260)` | Secondary text, labels |
| `--color-border` | `oklch(85% 0.003 260)` | Hairline dividers |
| `--font-display` | Bodoni Moda, serif | Headings, big type, numerals |
| `--font-body` | Geist, system sans | Body, labels, nav |
| `--text-hero` | `clamp(3.5rem, 8vw, 8rem)` | Hero wordmark |

Color lives entirely in oklch so lightness steps read evenly. Type
sizes are fluid `clamp()` so the scale holds from mobile to wide.

## Page structure (`src/pages/index.astro`)

1. **Hero** full viewport. Semantic workflow fragments resolve around the `AVP
   Software` wordmark and tagline, with a scroll cue pointing at the process
   section.
2. **Process** two column, sticky heading beside a four step list (Map,
   Design, Build, Run) with oversized numerals.
3. **Big type** two oversized display lines (`DESIGN BUILD`,
   `AUTOMATE RUN`) that drift horizontally on scroll.
4. **FAQ** two column accordion of the questions clients ask first.
5. **AI summary strip** links that ask an AI provider to summarize the
   site.

Section vertical rhythm is `clamp(3.5rem, 8vh, 6rem)`, tightened from
the original to reduce dead space between blocks.

## Hero interaction (`src/components/HeroWorkflow.astro`)

The hero demonstrates AVP’s core transformation: a scattered manual client
workflow resolves into `Request → Check details → Approval → Sync systems →
Done`.

- Eight semantic HTML fragments sit above an SVG hairline connection layer.
- Normal scroll progress is the authoritative state inside a 135dvh desktop
  stage and 125dvh mobile stage; the viewport scene is sticky without
  capturing or slowing scroll.
- Fine-pointer proximity creates local resolution. Drag adds a temporary
  offset whose release settles through a restrained interruptible spring.
- Touch uses scroll plus a brief tap response; touch drag is disabled.
- The scroll-linked workflow remains active under reduced motion; script
  failure renders the resolved system statically.
- Animation is framework-free, pauses off-screen, and restricts per-frame work
  to transforms, opacity, and SVG endpoints.

## Related docs

- `CLAUDE.md`: repo overview, stack, and locked infra pattern.
- `docs/00-setup.md` through `docs/03-pages.md`: original design phase
  task specs.
