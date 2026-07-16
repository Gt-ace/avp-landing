# Landing page scroll redesign: design spec

Date: 2026-07-16
Status: approved direction, pending final user review of this document

## Goal

Rebuild the avp.software landing page (`src/pages/index.astro`) as a single
animated scroll: a new interactive hero (the video goes away), a 4 step
process section pitched at operations automation, the existing selected
work list, a big type moment, an FAQ, and an AI summary strip. Add an
ASCII kanban diagram to a new `public/robots.txt` and a machine readable
`public/llms.txt`.

Only `index.astro`, new components, `global.css` (additions only), and the
two new public files change. `/about`, `/work`, `/work/[slug]`, `/contact`,
`BaseLayout.astro`, and `NavPill.tsx` stay exactly as they are.

## Identity constraints

The site keeps its light editorial identity: Bodoni Moda serif display
type, Geist body, the existing oklch tokens in `global.css`. The inspo
(`inspo/*.png`, thesoftware.company) contributes structure and energy,
not its dark brutalist look. No copy or visual may be lifted 1:1.

No new npm dependencies. All motion is vanilla TypeScript plus CSS.
Every animation respects `prefers-reduced-motion: reduce`.

## Page structure (top to bottom)

1. Hero (ASCII field)
2. Process (4 steps)
3. Selected work (existing section, entrance animation added)
4. Big type moment
5. FAQ
6. AI summary strip (closing block; the site has no shared footer)

## 1. Hero: interactive ASCII field

Replaces both `<video>` elements, the overlay, and the crossfade script.

- A `<canvas>` fills the hero section on the light `--color-bg`
  background. It draws a grid of small monospace glyphs (cell size around
  14 to 18 px) in `--color-muted` at low opacity.
- Idle behavior: glyphs drift and shimmer slowly. Glyph density and
  darkness faintly render the AVP logo mark, produced by rasterizing
  `public/logo-mark.svg` offscreen into a brightness map at canvas size.
- Pointer behavior: within a radius (roughly 120 to 180 px) of the
  cursor, glyphs darken toward `--color-ink`, swap to denser characters,
  and ripple outward with soft falloff. The effect trails the pointer
  with slight easing.
- Touch devices (no fine pointer): an autonomous wave sweeps the field on
  a loop instead of pointer tracking.
- Reduced motion: the field renders once, static, and the rAF loop never
  starts. The logo motif stays visible.
- Performance: one rAF loop; pause it via IntersectionObserver when the
  hero leaves the viewport. Cap the glyph count on small screens.
- The serif headline "AVP Software", the existing tagline, the staggered
  `hero-in` reveal, and the "Selected work" scroll cue all stay.
- Implementation: a new `src/components/HeroAscii.astro` with an inline
  `<script>`. No React island.
- `public/hero1.webm` becomes unused; delete it from the repo (the other
  videos in `public/` belong to work pages and stay).

## 2. Process: 4 steps

Two column layout on desktop: left column sticky (CSS `position:
sticky`) holding the section label and headline; right column the four
steps. Each step is an oversized serif numeral (01 to 04) beside a small
caps title and a short paragraph. Steps fade and rise in one at a time
as they enter the viewport. Single column on mobile, numeral above text.

Final copy (humanized, approved for implementation):

- Section label: `Process`
- Headline: "Most projects start with an idea. Mine start with your
  team's most annoying Tuesday."

1. **Map.** I start inside the workflow: the spreadsheet someone updates
   by hand, the approval that lives in an inbox. The tool gets designed
   around how your team already works.
2. **Design.** Internal tools people actually want to open. Status
   visible at a glance, forms that adapt to the case, and no manual
   required to use any of it.
3. **Build.** Wired into the systems you already pay for: accounting,
   e-signing, email, webhooks. Work moves itself forward instead of
   waiting for someone to forward it.
4. **Run.** I host it, watch it, and keep automating. Every release
   after launch removes another manual step.

## 3. Selected work

Content and markup unchanged: 3 items from `src/data/projects.ts`,
"View all work" link to `/work`. Addition: the heading and each row get
a staggered fade and rise entrance when scrolled into view. Nothing here
duplicates the `/work` or `/about` pages.

## 4. Big type moment

A short full width band between work and FAQ. Two lines of oversized
serif type, larger than the viewport and clipped (`overflow: hidden` on
the band; the page never scrolls horizontally):

- Line 1: `DESIGN BUILD` drifts left as the user scrolls through.
- Line 2: `AUTOMATE RUN` drifts right.

Ink on the light background, no dark inversion. Scroll linked
`translateX` driven by a small rAF script, using CSS
`animation-timeline: view()` where supported instead. Reduced motion:
both lines static and centered. `aria-hidden="true"` on the band; it is
decoration, not content.

## 5. FAQ

- Section label: `FAQ`
- Heading: "The questions clients ask first."

Accordion built on native `<details name="faq"><summary>` elements, so
one item open at a time and keyboard operation work without JavaScript.
JS and CSS add the animated height and a plus icon that rotates to a
cross.

Final Q&A copy (humanized, approved for implementation):

1. **What kind of projects do you take on?**
   Mostly internal tools and workflow automation: expense pipelines,
   approval flows, dashboards. The software your team uses every day but
   your customers never see. I also build customer facing products end
   to end when the fit is right.
2. **Can you connect the tools we already use?**
   Yes, that is usually the whole point. Past projects have talked to
   accounting software, e-signature services, email, and plain webhooks.
   If it has an API, or even just an export button, it can join the
   workflow.
3. **What does a project cost?**
   I quote a fixed price for a defined scope after we have mapped what
   the work involves. If the scope grows, we agree on a new price before
   I build more. You will never find the surprise on an invoice.
4. **How long until something usable?**
   Weeks, not quarters. I ship a small working version early, your team
   uses it, and we improve from there.
5. **How much of our time do you need?**
   A kickoff where I watch how the work is done today, then a short
   weekly check-in. The people doing the actual work teach me more than
   any requirements document.
6. **Who runs it after launch?**
   I do. Hosting, monitoring, fixes, and further automation. If you want
   to take it in house later, you get the code and a proper handover.
7. **How do we find out if it is a fit?**
   Send a message through the [contact page](/contact) and describe the
   workflow that annoys you most. If I can help, I will tell you how.
   If I cannot, I will say so.

## 6. AI summary strip

The closing block of `index.astro` (the site has no shared footer, and
other pages must not change). A slim row:

- Left: the label `REQUEST AN AI SUMMARY` in the `.label` style.
- Right: provider links, each opening in a new tab
  (`target="_blank" rel="noopener"`), prefilled with the query
  `Summarize https://avp.software`:
  - Google AI Mode:
    `https://www.google.com/search?udm=50&aep=11&q=Summarize%20https%3A%2F%2Favp.software`
  - ChatGPT: `https://chatgpt.com/?q=Summarize%20https%3A%2F%2Favp.software`
  - Claude: `https://claude.ai/new?q=Summarize%20https%3A%2F%2Favp.software`
  - Perplexity: `https://www.perplexity.ai/search?q=Summarize%20https%3A%2F%2Favp.software`

Text links with the provider name; no logo assets required.

## 7. Motion system

- One small shared inline script in `index.astro`: an
  IntersectionObserver that adds `.in-view` to `[data-reveal]` elements;
  CSS transitions handle the rest. Elements start hidden only when
  `html.js` is present (hook already exists in `BaseLayout.astro`), so
  content is never invisible without JavaScript.
- Big type: scroll linked transform as described in section 4.
- Process pinning: pure CSS sticky, no JS.
- A single `@media (prefers-reduced-motion: reduce)` block disables all
  of it.

## 8. robots.txt

New `public/robots.txt`, plain text. ASCII kanban diagram in `#` comment
lines above permissive rules, in this spirit (final art drawn during
implementation, kept under 70 columns):

```
# +---------+     +-----------+     +---------+
# | Intake  |     | Approve   |     | Done    |
# |         |     |           |     |         |
# | [ ] --------> | [x] ----------> | [x]     |
# +---------+     +-----------+     +---------+
#
# Another card just moved itself. That is the job.
# Humans: https://avp.software/contact
# Machines: https://avp.software/llms.txt

User-agent: *
Allow: /

Sitemap: https://avp.software/sitemap-index.xml
```

Only include the Sitemap line if a sitemap actually exists or is added;
otherwise omit it rather than pointing at a 404.

## 9. llms.txt

New `public/llms.txt` following the llms.txt convention: an H1 with the
site name, a one paragraph summary, then linked sections for services
(the four process steps in one line each), selected work (titles plus
`/work/<slug>` URLs from `src/data/projects.ts`, written out statically),
and contact. Same facts as the landing page, no new claims. Keep it
under roughly 60 lines.

## Error handling and edge cases

- No JavaScript: all content visible (reveals gated on `html.js`), hero
  shows headline and tagline over the plain background, FAQ works via
  native `<details>` behavior.
- Canvas unsupported or logo rasterization fails: hero degrades to the
  plain background with type; wrap setup in a try/catch, never a blank
  page.
- Narrow screens: glyph count capped, process single column, big type
  clipped by the band, FAQ full width.
- View transitions: scripts must re-arm after Astro's `astro:page-load`
  event, matching the existing ViewTransitions setup.

## Testing

`npm run build` must pass. Manual verification via `npm run preview`:
scroll the page top to bottom, check hero interaction with mouse and
with `prefers-reduced-motion` emulated, FAQ keyboard operation, no
horizontal scroll on mobile widths, robots.txt and llms.txt served with
correct content. Lighthouse spot check that the landing page stays fast
(no new dependencies, no images added).

## Out of scope

Any change to the about, work, and contact pages, NavPill, BaseLayout,
the deploy workflow, the Dockerfile, or infra.
