---
version: alpha
name: AVP Software
description: >-
  Editorial monochrome for the avp.software landing site. A serif display face
  over a clean sans body, near black ink on an off white ground, one rust accent
  reserved for interaction.
colors:
  primary: "oklch(10% 0.005 260)"
  secondary: "oklch(42% 0.005 260)"
  tertiary: "oklch(58% 0.15 35)"
  neutral: "oklch(98% 0.003 260)"
  surface: "oklch(100% 0 0)"
  border: "oklch(85% 0.003 260)"
  overlay: "oklch(0% 0 0 / 20%)"
typography:
  display-hero:
    fontFamily: Bodoni Moda
    fontSize: 8rem
    fontWeight: 600
    lineHeight: 1
  display-page:
    fontFamily: Bodoni Moda
    fontSize: 3.5rem
    fontWeight: 600
    lineHeight: 1.05
  headline-section:
    fontFamily: Bodoni Moda
    fontSize: 2.75rem
    fontWeight: 600
    lineHeight: 1.15
  body-lg:
    fontFamily: Geist
    fontSize: 1.25rem
    fontWeight: 500
    lineHeight: 1.5
  body-md:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.6
  body-prose:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.7
  caption:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
  label-sm:
    fontFamily: Geist
    fontSize: 0.6875rem
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.15em
spacing:
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3.5rem
  section-y: 6rem
  section-x: 10rem
  prose-max: 640px
rounded:
  none: 0px
  full: 9999px
components:
  nav-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 0.5rem
  nav-pill-hover:
    textColor: "{colors.tertiary}"
  scroll-hint:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 0.4rem
  faq-row:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 1.5rem
  faq-row-hover:
    textColor: "{colors.tertiary}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  card-overlay:
    backgroundColor: "{colors.overlay}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
---

# DESIGN.md: avp.software landing

## Overview

Editorial and monochrome. A serif display face paired with a clean sans body,
near black ink on an off white ground, a generous type scale, and restrained
motion. The feel target is a small studio that is precise and confident, not
loud.

The site is spacious rather than dense. Nothing competes with the type: there
are no filled buttons, no cards with shadows, and no decorative color. When a
rule below does not cover a case, choose the quieter option.

## Colors

The palette is a single neutral ramp plus one accent that exists only to signal
interaction.

- **Primary (`oklch(10% 0.005 260)`):** Near black ink for headlines, body copy,
  and marks. Carries almost all of the page's weight.
- **Secondary (`oklch(42% 0.005 260)`):** Muted grey for labels, captions, and
  metadata. Never used for a headline or for long-form copy.
- **Tertiary (`oklch(58% 0.15 35)`):** A rust accent, reserved for interactive
  states: hover, focus, and active. It is never a background and never
  decorative.
- **Neutral (`oklch(98% 0.003 260)`):** The off white page ground. Softer than
  pure white, which reads clinical against Bodoni.
- **Surface (`oklch(100% 0 0)`):** Pure white for the few raised elements (the
  nav pill and the scroll hint) so they separate from the ground without a
  border alone.
- **Border (`oklch(85% 0.003 260)`):** Hairline dividers, 1px.
- **Overlay (`oklch(0% 0 0 / 20%)`):** The only shadow color, used at low blur.

Color is authored entirely in oklch so lightness steps read evenly to the eye
rather than evenly in sRGB. Token values here mirror `src/styles/global.css`
one for one; that file is the runtime source of truth.

Tertiary at `58%` lightness sits near 3.7:1 against surface white. It is
therefore allowed on large type, icons, and hover transitions of already-legible
text, but is not a substitute for primary on body copy.

## Typography

Two families, used for strictly separate jobs.

- **Display, Bodoni Moda (serif):** Every heading and every large numeral.
  Optical sizing is pinned off (`font-optical-sizing: none`), because Bodoni
  thins its hairlines as the optical size grows and the large sizes on this site
  become hard to read, especially over video.
- **Body, Geist (sans):** Body copy, nav, labels, and everything interactive.
  Base weight is 500, not 400; at these sizes on an off white ground, 400 reads
  thin.
- **Labels, Geist at 0.6875rem:** Uppercase, weight 600, `0.15em` tracking.
  Used for section eyebrows, the scroll hint, and nav items.

Sizes in the token block are the desktop end of the scale. In the stylesheet
every display size is a fluid `clamp()` so the scale holds from mobile to wide:

| Token | Fluid value |
| --- | --- |
| `display-hero` | `clamp(3.5rem, 8vw, 8rem)` |
| `display-page` | `clamp(2rem, 4vw, 3.5rem)` |
| `headline-section` | `clamp(1.75rem, 3.5vw, 2.75rem)` |
| `body-lg` | `clamp(1rem, 1.6vw, 1.25rem)` |

Long-form prose caps at `55ch`.

## Layout

A single centered column, not a grid. Prose pages (About, Contact) cap at
`640px`; the work card frame caps at `64rem`.

Section rhythm is `clamp(3.5rem, 8vh, 6rem)` vertical by
`clamp(1.5rem, 10vw, 10rem)` horizontal, deliberately tightened from the
original spec to cut dead space between blocks. Vertical padding keys off `vh`
rather than `vw` so short landscape viewports do not scroll through empty space.

Anything pinned to a viewport edge adds `env(safe-area-inset-*)`; without it the
scroll hint sits under the iOS home indicator and the work label sits under the
notch.

## Elevation & Depth

Effectively flat. Hierarchy comes from type scale and from the ink/muted
contrast step, not from stacking.

Two elements lift off the ground, both pills: the nav and the scroll hint. Both
use white on the off white ground, a 1px `border` hairline, and a single soft
shadow of `0 2px 12px` in `overlay`. There is no elevation scale beyond this;
a third shadow level would be a design regression.

Depth in the hero is spatial rather than tonal: a wireframe torus knot rendered
in WebGL sits behind the wordmark at 55% opacity.

## Shapes

Two radii only, and they do not mix.

- **Pills (`9999px`):** Everything interactive and floating: nav, scroll hint,
  tags.
- **Square (`0px`):** Everything structural: sections, dividers, media frames,
  and the work cards.

The rule is that a shape either floats or it does not. There is no intermediate
`8px`-style radius anywhere in the system, and adding one would blur that
distinction.

## Components

- **Nav pill (`src/components/NavPill.tsx`):** The only interactive nav and the
  one React island (`client:load`). White surface, hairline border, label
  typography, full radius. Hover moves the label to tertiary.
- **Scroll hint:** Fixed to the bottom center, label typography in secondary,
  with a 1.6s bobbing arrow. Hides itself once the user has scrolled, and drops
  its animation under reduced motion.
- **FAQ row:** A native `<details>`/`<summary>` accordion on the page ground,
  separated by hairline dividers, square corners, `1.5rem` vertical padding. The
  disclosure marker is removed and replaced with an icon that rotates over 300ms.
- **Work card:** Square media frame with an overlay caption. The frame ratio
  changes at the breakpoint rather than only scaling. `4:5` under `640px`
  because a `4:3` frame on a portrait phone resolves to about a third of the
  screen, `4:3` above.
- **Reveal (`[data-reveal]`):** The shared scroll-in. 24px rise plus fade over
  700ms on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered via `--reveal-delay`.
  Opt-in per element, gated on `html.js` so no-JS renders everything visible.

## Do's and Don'ts

- Do use tertiary only for interactive states: hover, focus, active. Never as
  a fill, a background, or an accent for its own sake.
- Don't set body copy in Bodoni, or a heading in Geist. The two families do not
  swap jobs.
- Do pin `font-optical-sizing: none` on any new Bodoni heading above ~2rem.
- Don't introduce a third corner radius. Pill or square.
- Don't add a second shadow level. `0 2px 12px` in overlay is the only one.
- Do give every new motion a `prefers-reduced-motion: reduce` branch, and make
  the reduced branch a resolved static state, never a missing one.
- Do let every animated section render correctly with JavaScript disabled or
  failed.
- Don't nest interactive elements inside the pinned scroll scenes; they compete
  with the scroll gesture on touch.

## Page structure

`src/pages/index.astro`:

1. **Hero**, full viewport. `HeroKnot` canvas behind the `AVP Software`
   wordmark and tagline, with a scroll cue pointing at the process section.
2. **Process**, two column, sticky heading beside a four step list (Map,
   Design, Build, Run) with oversized numerals.
3. **Big type**, two oversized display lines (`DESIGN BUILD`, `AUTOMATE RUN`)
   that drift horizontally on scroll.
4. **FAQ**, two column accordion of the questions clients ask first.

Other pages: `/work` (card stack index plus `[slug]` detail pages), `/about`,
`/contact`. All inherit `src/layouts/BaseLayout.astro`.

## Hero interaction

`src/components/HeroKnot.astro` with logic in `src/scripts/hero-knot-motion.mjs`.

- A wireframe torus knot on a WebGL canvas, drawn in ink at 55% opacity,
  `aria-hidden` and `pointer-events: none`.
- Rotation is driven by two inputs summed into one target pose: pointer position
  and normal scroll progress. Scroll weighs more than the pointer, and the
  vertical offset is clamped.
- The pose damps toward that target at 6% per frame and snaps once inside an
  epsilon, so the loop stops rather than easing asymptotically forever.
- A coarse pointer gets scroll only, matched on `pointer: fine` rather than
  negated `pointer: coarse` so a device reporting neither falls to the
  scroll-only side.
- Geometry drops from 220x32 to 120x20 segments below 768px, and the knot's
  placement and camera distance change with it. On a narrow viewport it sits
  lower in world space and further back, because the centered copy leaves it the
  top third of the screen rather than the top two thirds.
- The frame loop is single-flight, pauses off-screen, and touches only rotation.
  Without WebGL the canvas stays empty and the hero reads as type alone.

## Related docs

- `CLAUDE.md`: repo overview, stack, and locked infra pattern.
- `docs/00-setup.md` through `docs/03-pages.md`: original design phase specs.
- Format: [DESIGN.md spec](https://github.com/google-labs-code/design.md),
  validated with `npx @google/design.md lint DESIGN.md`.
