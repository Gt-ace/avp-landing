# Work card stack unified motion: design spec

## Goal

Make the adapted Skiper17 work-card stack use the same pinned, scroll-driven
scale, rise, and rotation sequence on desktop, mobile, touch devices, and when
the browser reports `prefers-reduced-motion: reduce`.

This specification supersedes only the responsive and reduced-motion behavior
in `2026-07-30-work-skiper17-card-stack-design.md`. The existing project data,
semantic card links, media, titles, routes, visual treatment, scoped GSAP
lifecycle, and no-JavaScript fallback remain authoritative.

## Confirmed behavior

- Every JavaScript-capable viewport receives the Skiper17 stack animation.
- Mobile and touch devices use the same scroll progression as desktop.
- Reduced-motion users receive exactly the same animation and video behavior
  as users with no motion preference. The application intentionally does not
  branch on `prefers-reduced-motion` for this component.
- Without JavaScript, the server-rendered cards remain a stable vertical list
  of ordinary project links.

## Root cause

The existing `workStackMode` policy explicitly returns the static list below
768px and whenever reduced motion is enabled. Mobile and reduced-motion
browsers therefore cannot run Skiper17 by design, regardless of whether GSAP
is functioning.

Desktop animation is present in the current deployed build, but it is coupled
to an additional root Lenis controller introduced after the original design.
That controller changes global scrolling for one page and adds a second
lifecycle around the GSAP pin. The stack does not require it: ScrollTrigger can
scrub against native document scrolling directly.

## Architecture

`WorkCardStack` continues to server-render list markup for hydration safety.
After its first client effect, it enables `StickyCard002` unconditionally and
marks the island ready for paint. It no longer reads viewport width or motion
preferences. The volunteer-platform video plays after hydration on every
device and retains its poster if playback is unavailable.

`StickyCard002` remains the sole owner of the GSAP timeline, ScrollTrigger,
ResizeObserver, card transforms, active-card interactivity, and cleanup. It
uses native document scrolling and does not create a Lenis instance.

The obsolete work-stack policy and page-specific smooth-scroll helper are
removed with their tests and source-level contracts. Focused tests instead
assert unconditional enhancement and native-scroll ownership.

## Responsive layout

The pinned scene uses a stable small-viewport height so mobile browser chrome
expanding or collapsing does not continuously change the pin geometry. The
card frame stays 4:3, fills the available width within the page gutter, and is
constrained by the scene height. Desktop retains the existing maximum width
and generous gutter; mobile uses a narrower gutter so the project remains
legible.

Scroll distance is derived from the measured pinned scene height multiplied by
the number of card transitions. ResizeObserver refreshes only this component's
trigger when its scene changes size. There is no horizontal overflow.

## Interaction and accessibility

Each project remains one conventional anchor. Only the visually active card is
interactive while cards overlap; the active state follows scroll progress and
all cards return to normal interactivity when the trigger is destroyed.

Touch scrolling is not intercepted. Tapping the active card follows its normal
project route. Keyboard focus order follows the visual card order. The focus
indicator remains inset so clipping cannot hide it.

The operating-system reduced-motion preference is intentionally ignored for
this component, following the confirmed product requirement. The static
no-JavaScript list remains the only non-animated fallback.

## Verification

Automated tests must cover:

- unconditional client enhancement at 320px, 768px, and 1440px;
- no `matchMedia('(prefers-reduced-motion: reduce)')` branch;
- no page-specific Lenis controller;
- stable frame sizing and scroll-distance helpers;
- active-card interactivity and cleanup;
- semantic links and unchanged project routes.

Production-browser verification must cover 1440px desktop, 768px tablet,
390px mobile touch, and desktop/mobile contexts emulating reduced motion. In
each case, scrolling must reveal all three projects, change the active link in
order, keep the frame pinned without jumps or horizontal overflow, and finish
with Amber active. Browser logs must remain free of runtime errors. The full
test suite and Astro production build must pass.

## Scope

This repair changes only the `/work` stack's activation policy, responsive pin
geometry, page-specific smooth scrolling, focused tests, and related design
documentation. It does not change project content, routes, detail pages,
global navigation, other page motion, or the site's global scroll behavior.
