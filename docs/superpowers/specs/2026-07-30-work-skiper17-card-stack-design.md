# Work Skiper17 card stack: design spec

## Goal

Replace the project rows on `/work` with an image-led sticky card stack based
on Skiper UI's `StickyCard002`. Keep every existing `/work/[slug]` project
detail page unchanged. A visitor should be able to identify a project by its
title, click anywhere on its card, and arrive at the same detail route as
today.

The work index remains an editorial portfolio surface, not a component demo.
Skiper17 supplies the scroll choreography; AVP's typography, monochrome
palette, project media, routing, and accessibility requirements remain
authoritative.

## Feasibility and selected approach

The integration is feasible, but the registry component is not a drop-in
solution for the requested behavior. Its published `CardData` accepts only
`id`, `image`, and `alt`, and it renders each item as an unlinked `<img>`.
It therefore cannot render the volunteer-platform video or navigate to a
project without adaptation.

Install the registry source locally and extend that local copy. The adapted
component will accept a link, title, and image-or-video media description for
each card while preserving Skiper17's pinned GSAP scale, rise, and rotation
sequence. This is preferable to placing click overlays over the stock
component because the media, title, focus state, and link remain one semantic
unit.

## Content and data flow

`src/data/projects.ts` remains the source of truth. The `/work` page maps its
three projects, in their current order, to a small serializable card model:

- `id`: the project slug.
- `title`: the existing project title.
- `href`: `/work/${slug}`.
- `media`: either an image or the project's existing responsive video data.
- `alt`: a concise project-specific description for image cards.

Media selection is deterministic:

1. `volunteer-platform` uses its existing `video` object, including desktop
   WebM/MP4 sources, mobile MP4 source, and poster. The video is muted,
   autoplaying, looping, and inline, matching its current `/work` behavior.
2. `crux` uses the first entry in `project.images`.
3. `amber` uses the first entry in `project.images`.

No new project record, title, screenshot, video, description, or marketing
claim is introduced. `previewImages` may remain in the shared project type for
compatibility, but the new stack does not use it.

## Component architecture

Add the Skiper17 registry component under the repository's established
Skiper UI location and adapt it locally. A focused React wrapper receives the
mapped cards from `src/pages/work/index.astro` and owns the interactive stack.
The Astro page continues to own page composition and project-data mapping.

Each rendered card is one anchor containing:

- one full-bleed `<img>` or `<video>`;
- one project-title overlay;
- a focus indicator that remains visible against the media.

The card stack is server-rendered as useful link markup and hydrated as a
React island for GSAP behavior. JavaScript adds motion but is not required to
discover or open a project.

The registry demo component and demo imagery are not rendered. Registry layout
classes are adapted to the AVP work page rather than importing its example
visual treatment. Avoid adding a generic `cn` utility solely for this
component if simple local class composition is sufficient.

## Layout and visual treatment

The stack replaces the complete `.project-row` list. It begins below the
fixed navigation clearance already established on the work page and occupies
one deliberate scroll sequence.

- One large centered card is the focal element.
- Cards use a consistent landscape frame suitable for the existing desktop
  screenshots and volunteer video.
- The media fills the frame with `object-fit: cover`.
- Corners are restrained rather than adopting the registry demo's exaggerated
  rounding.
- The project title is the only visible project information. It uses AVP's
  Bodoni display face and appears in a quiet, consistent overlay near the
  lower-left edge.
- A subtle media scrim behind the title provides reliable contrast without
  recoloring the project imagery.
- Client, year, description, technology, credits, and “Read more” are not
  shown on the index. They remain available on the existing detail pages.

The card itself is the hit target. Pointer hover may slightly strengthen the
title/scrim or show an understated focus cue, but must not add a second motion
effect that competes with the scroll-driven stack.

## Scroll interaction

On standard-motion layouts, the first card is initially present. As the
visitor scrolls:

1. the current card scales down and rotates slightly;
2. the next card rises into place;
3. the sequence repeats until the final project is visible;
4. normal document scrolling resumes after the final card.

The original interaction is retained in spirit, but its implementation must
be isolated:

- use the component's own container/ref as the ScrollTrigger target instead of
  the global `.sticky-cards` selector;
- keep GSAP queries scoped to that component instance;
- clean up only the timeline and ScrollTrigger created by this instance;
- never call `ScrollTrigger.getAll().forEach(...kill)` because that could stop
  unrelated animation on current or future pages;
- refresh measurements on meaningful container or viewport-size changes;
- remove observers, listeners, timelines, and triggers when Astro navigation
  unmounts the island.

Native browser scrolling remains authoritative. Do not install a root Lenis
controller merely because the registry demo wraps itself in `ReactLenis`.
The adapted `StickyCard002` does not require Lenis to create its GSAP
ScrollTrigger sequence, and a second global scroll controller would add risk
to the site's existing native-scroll and Astro-transition behavior. If the
registry installer adds Lenis as a declared dependency, it may remain an
upstream dependency, but it is not mounted on the page.

## Responsive behavior

Layouts at `768px` and wider receive the full pinned scale-and-rotation
sequence. Card size is fluid and remains clear of the fixed navigation.

Layouts below `768px` render the same three cards as a stable vertical linked
list without ScrollTrigger pinning, scale, or rotation. This avoids mobile
browser viewport jumps and keeps every project immediately discoverable.

The design must not create horizontal page overflow at any supported width.
Touch users navigate by tapping anywhere on a card and do not need hover or
pointer precision.

## Accessibility and fallback behavior

- Every card is a conventional internal link with an informative accessible
  name derived from its project title.
- Image alt text describes the project view rather than repeating generic
  words such as “image.”
- The decorative title scrim is ignored by assistive technology when the
  anchor already has a complete accessible name, avoiding duplicate speech.
- The video is muted and has no audio controls because it functions as moving
  showcase media. Its poster supplies the loading and failure state.
- Keyboard focus is clearly visible and follows the visual project order.
- Under `prefers-reduced-motion: reduce`, do not pin, scrub, scale, or rotate
  the cards. Present all three as stable vertical links and do not autoplay
  the volunteer video.
- Without JavaScript, present the same stable vertical linked-card layout.
- If video playback fails or autoplay is blocked, the volunteer poster remains
  visible and the link remains usable.

## Navigation and unchanged detail pages

Activating a card performs ordinary same-site navigation to its current
`/work/[slug]` route. No click interception, modal, expanded-card state, or
external link is introduced.

`src/pages/work/[slug].astro` and its rendered content remain unchanged. The
existing detail title, description, technology list, external “Visit project”
link, credits, video, and image gallery are outside this change. The old
index-to-detail named image/title morph is not a requirement of the React
stack; ordinary Astro navigation may replace it if the framework cannot attach
dynamic transition directives cleanly inside the island.

## Dependencies and repository conventions

Use the existing shadcn registry configuration to obtain
`@skiper-ui/skiper17`. The upstream component declares `gsap`,
`@gsap/react`, `framer-motion`, and `lenis`; Framer Motion already exists in
the project.

The repository currently uses `package-lock.json` and npm in its documented
development and deployment workflow. Do not introduce a competing
`pnpm-lock.yaml`. The implementation plan must use the repository's active
package-manager convention for persisted dependency changes, even if
`pnpm dlx shadcn add @skiper-ui/skiper17` is used as the one-off registry
installer command. Dependency installation must leave one authoritative
lockfile.

Retain Skiper UI's required free-license attribution in the copied source
unless the project has a license tier that removes that requirement.

## Verification and acceptance criteria

The work is complete when all of the following are true:

- `/work` shows exactly three cards in the current project-data order.
- Only the project title is visibly shown on each card.
- Volunteer Platform renders its responsive video when motion and playback are
  allowed, with its poster as fallback.
- Crux and Amber render the first image from their `images` arrays.
- Clicking or keyboard-activating any part of a card opens the correct existing
  `/work/[slug]` page.
- All three detail pages render exactly as before.
- Standard-motion desktop scrolling produces the pinned rise, scale, and
  slight-rotation sequence without scroll jumps.
- Reduced-motion and no-JavaScript modes show stable, usable vertical links.
- Below `768px`, cards render as an unpinned vertical list that does not trap
  scrolling or overflow horizontally.
- Video failure or blocked autoplay does not leave an empty card.
- Navigating to and away from `/work` produces no stale pin spacers, duplicate
  ScrollTriggers, console errors, or interference with other page motion.
- The production Astro build and full automated test suite pass.
- Browser verification covers desktop, mobile, keyboard navigation,
  reduced-motion, and Astro client-side navigation.

## Scope boundaries

This change is limited to the `/work` index, the locally installed/adapted
Skiper17 component and direct wrapper, required dependencies and lockfile,
focused tests, and related documentation.

It does not redesign project detail pages, change project copy or order, add
filters or pagination, introduce a modal, alter global navigation, add
site-wide smooth scrolling, or modify the homepage.
