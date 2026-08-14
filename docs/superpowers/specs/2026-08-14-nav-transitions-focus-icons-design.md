# Design: nav chevron removal, work page transitions, About focus icons

Date: 2026-08-14
Status: approved for planning

Three independent changes to `avp.software`, specified together because
they were requested together. They touch different files and can ship in
any order.

1. Remove the chevron from the nav pill.
2. Retune the `/work` page transitions to 300ms and give back
   navigation its own choreography.
3. Give the About page's Focus list animated icons from
   `@jis3r/icons`.

## Shared constraints

Every part of this spec obeys the constraints the repo already holds
itself to:

- **One easing curve.** `cubic-bezier(0.16, 1, 0.3, 1)` is already used
  in `BaseLayout.astro`, `index.astro`, and `NavPill.tsx`. No new curve
  is introduced anywhere in this work.
- **Transform and opacity only.** No animation touches `width`,
  `height`, `top`, `left`, `margin`, or `padding`, with one deliberate
  exception noted in part 1.
- **Reduced motion ships with the motion.** Every animated surface
  added here has a `prefers-reduced-motion: reduce` path written at the
  same time, not afterwards.
- **Existing design tokens.** Colour, type, and spacing come from
  `src/styles/global.css`. Nothing defines a parallel scale.

---

## Part 1: remove the nav pill chevron

### Current behaviour

`src/components/NavPill.tsx` renders a fixed pill containing three
elements: the logo A (links home), a disclosure button, and the logo P
(links home). The disclosure button holds the logo V followed by a
drawn chevron. Opening the pill collapses the V to zero width and
rotates the chevron 180 degrees; the links appear beside it on desktop
or stacked beneath it below the 768px breakpoint.

The chevron exists as the affordance. The component's own comment
records why: the closed pill previously showed only the V, which read
as a wordmark rather than a control, so nothing signalled that the pill
opens.

### Target behaviour

The chevron is gone. The closed pill is A, V, P. The V alone is the
disclosure button. Opening the pill collapses the V exactly as it does
today, leaving the links between A and P.

```
closed:   A      V      P
open:     A  WORK ABOUT CONTACT  P
```

### Changes

**Delete** the `Chevron` component and the `CHEVRON_GAP` constant.
`EASE_OUT_QUART` stays: `NavLink` still uses it.

**Collapse the button, not just its contents.** The button currently
carries `minWidth: TOUCH_TARGET` (44) and `minHeight: TOUCH_TARGET`
unconditionally. With the chevron removed, an open desktop pill would
hold a 44px box of nothing between the A and the first link. The
button's minimum width must animate to 0 on the same spring that
collapses the V, so the two move as one and no empty gap is left
behind.

This means the button becomes a `motion.button` animating `minWidth`,
which is a layout-triggering property and the one exception to the
transform-and-opacity rule above. It is justified: the pill's shape
animation already animates `width` and `height` through Framer, the
button sits inside that same reflow, and there is no transform that
removes an element from the flex row without leaving its box behind.
The animation runs on a single small element inside a fixed-position
container, so the reflow cost is bounded.

`minHeight` stays at `TOUCH_TARGET` throughout. Only the horizontal
dimension collapses.

**Narrow the open pill.** `DESKTOP_OPEN_WIDTH` drops from 480 to 466,
recovering the chevron's 9px plus its 5px gap. `CLOSED_WIDTH` (140),
`MOBILE_PANEL_WIDTH` (320), `PILL_HEIGHT` (48), `MOBILE_ROW_HEIGHT`
(48), and `TOUCH_TARGET` (44) are all unchanged.

**Accessibility is unchanged.** The button keeps
`aria-label={isOpen ? 'Close menu' : 'Open menu'}` and
`aria-expanded`, so the control is still named and its state still
reported even though it now carries no visual glyph. The `<img>`
letterforms stay `alt=""`, and the focus-visible ring rule in the
component's inline `<style>` block is untouched.

**Escape still works.** `buttonRef.current?.focus()` on Escape targets
a button that is collapsed at the moment focus lands, but the same
keypress sets `isOpen` to false, so the button re-expands on the same
frame and the focus ring becomes visible as the pill closes.

**The no-JS fallback is unaffected.** `.static-primary-nav` in
`BaseLayout.astro` is a separate element shown only when the `js` class
is absent. It never had a chevron.

### Accepted trade-off

Touch has no hover, so a first-time visitor on a phone now has no
visual signal that the pill opens; discoverability rests on tapping the
logo. This was raised and accepted.

### Tests

- `tests/nav-pill.test.mjs:123` asserts `function Chevron` exists in the
  source. Delete that test.
- `tests/nav-pill-geometry.test.ts` asserts the open desktop width
  equals `DESKTOP_OPEN_WIDTH`. It imports the constant rather than
  hardcoding it, so it passes unchanged, but re-read it to confirm no
  other assertion hardcodes 480.
- `tests/nav-pill.test.mjs:186` asserts the pill does *not* contain a
  hardcoded `animate={{ width: isOpen ? 480 : 100 }}`. Unaffected.
- Add an assertion that the open desktop pill collapses the button to
  zero minimum width, so the empty-box regression cannot come back.

---

## Part 2: work page transitions

### Current behaviour

`BaseLayout.astro` sets one site-wide view transition duration of
**480ms** on `::view-transition-group(*)`, `-old(*)`, and `-new(*)`,
with `cubic-bezier(0.16, 1, 0.3, 1)`, plus a
`prefers-reduced-motion: reduce` block that sets `animation: none`.

Forward navigation from `/work` to a detail page morphs the card. On
`astro:before-preparation`, `WorkCardStack.tsx` writes
`view-transition-name: image-<slug>` and `title-<slug>` onto the clicked
card only, and `work/[slug].astro` carries the matching names with
`transition:animate={fade({ duration: 480 })}`. Video cards morph only
their title, because Chromium drops `<video>` playback across a
transition when the video or an ancestor carries a
`view-transition-name`.

Back navigation morphs nothing. Nothing on the incoming `/work`
document is named, so the page cross-fades at the same 480ms.

### Target behaviour

Forward keeps the morph, at 300ms. Back gets a directional slide and
fade, at 300ms, that reads as a reversal.

### Changes

**Retune the duration.** In `BaseLayout.astro`, `animation-duration`
goes from `480ms` to `300ms`. The timing function is unchanged. In
`work/[slug].astro`, `const morph = fade({ duration: 480 })` becomes
`fade({ duration: 300 })`. Both must move together: the comment in
`BaseLayout.astro` records that naming only the groups once left the
outgoing page gone at the UA default while the morph still had time to
run.

**Record the navigation direction.** Astro's
`astro:before-preparation` event carries a `direction` field
(`'forward'`, `'back'`, or a custom string). A listener in
`BaseLayout.astro` writes it to the document element:

```
document.documentElement.dataset.navDirection = event.direction
```

The listener must be registered once and survive the swap, following
the pattern already used in `work/[slug].astro` for the video tier
upgrade (a `window.__avp*` guard flag). The attribute must be written
before `document.startViewTransition` is called, which
`astro:before-preparation` guarantees: Astro awaits that event before
starting the transition.

**Give back its own animation.** Default root behaviour is the plain
cross-fade Astro already provides. Under
`[data-nav-direction='back']`, the root pseudo-elements get:

| Pseudo-element | Properties | Duration |
| --- | --- | --- |
| `::view-transition-old(root)` | `opacity: 1 → 0`, `translateY(0 → 16px)` | 200ms |
| `::view-transition-new(root)` | `opacity: 0 → 1`, `translateY(-12px → 0)` | 300ms |

Both use `cubic-bezier(0.16, 1, 0.3, 1)`. Outgoing runs shorter than
incoming on purpose: equal durations leave both pages at partial
opacity through the middle of the transition, which reads as a smear
rather than a swap.

These rules target `root` specifically, so they do not disturb the
named `image-<slug>` and `title-<slug>` groups. On a back navigation
those groups are unpaired anyway, since nothing on the incoming `/work`
page is named.

**Back deliberately does not morph.** The incoming `/work` document is
snapshotted before `WorkCardStack` hydrates and pins its layout, and
the stack is held `visibility: hidden` until
`data-work-stack-ready` is set. A morph on the way back would animate
toward the un-pinned list geometry, or toward a hidden element. This is
the exact failure the comment at `WorkCardStack.tsx:40-53` records
avoiding. The directional slide gets the feeling of reversal without
reintroducing it.

**Reduced motion is already covered.** The existing
`prefers-reduced-motion` block in `BaseLayout.astro` sets
`animation: none !important` on `-old(*)` and `-new(*)`, which
matches the new selectors too. Confirm the new rules sit *above* that
block, or that the `!important` still wins.

### Tests

Existing tests do not cover transition timing. Add a source assertion
that the duration in `BaseLayout.astro` and the `fade()` duration in
`work/[slug].astro` are the same number, so they cannot drift apart
again.

Manual check, because feel cannot be judged from source: navigate
`/work` to a project and back, on both a video card and an image card,
and confirm the back transition reads as a reversal rather than a
cross-fade. Run it at 5x duration in the DevTools animation inspector
to see the overlap.

---

## Part 3: About page Focus icons

### Current state

`src/pages/about.astro` ends with `.about-focus`: a `Focus` label above
a hairline-ruled list of three items, `Web platforms`, `Process
automations`, `AI-assisted products`. Each row is 1rem of vertical
padding with a `--color-border` rule beneath it. The page ships no
JavaScript of its own.

### Target state

Each row gains a 24px animated icon in a left column, optically aligned
to the row's text.

```
Focus
─────────────────────────────
  ▤   Web platforms
─────────────────────────────
  ⤳   Process automations
─────────────────────────────
  ▣   AI-assisted products
─────────────────────────────
```

### Dependencies

- `@astrojs/svelte@6.0.2` — peer dependencies `astro ^4.0.0`,
  `svelte ^5.1.16`, `typescript ^5.3.3`. Compatible with this repo's
  Astro 4.16.
- `svelte@^5.1.16`
- `@jis3r/icons@2.9.0` — MIT, peer dependency `svelte ^5.0.0`.

`svelte()` is added to the `integrations` array in `astro.config.mjs`
alongside the existing `react()` and `tailwind()`. Astro supports
multiple UI framework integrations in one project; the Svelte runtime
is code-split per island, so it ships only on `/about`.

The icons are plain CSS keyframes inside scoped Svelte styles. No
motion library is pulled in.

### Icon selection

| Row | Icon | Upstream motion |
| --- | --- | --- |
| Web platforms | `layout-panel-left` | panels fade in staggered, ~0.6s |
| Process automations | `route` | path draws through two waypoints via `stroke-dashoffset`, 0.8s |
| AI-assisted products | `cpu` | two-beat scale pulse, ~1.0s |

`cpu` is chosen over `sparkles` deliberately. Sparkles is the default
glyph on every page that mentions AI, and `route` in the row above
already carries the idea of flow, so a second flourish-shaped icon
would blur the three rows together.

The package exposes no `globe` or `workflow` icon (only `globe-x`), so
`layout-panel-left` carries "Web platforms": it draws an application
shell, which is more honest about the work than a globe would be.

Icon components accept `color` (defaults to `currentColor`), `size`,
`strokeWidth`, `animate`, and `class`. `color` is left at its default
so the icon inherits `--color-muted` from the row.

### Trigger

Upstream, each icon animates on `mouseenter` and resets after 750ms.
That means nothing at all happens on a phone.

`/about` is a page a visitor reads once, which puts it in the
first-time tier where a deliberate reveal is appropriate. The trigger
is therefore in-view rather than hover.

The mechanism is Astro's own `client:visible` directive rather than a
hand-written observer. Each row's icon is a thin Svelte wrapper,
`src/components/focus/FocusIcon.svelte`, hydrated with
`client:visible`. Astro hydrates it when it enters the viewport, so
"in view" is already established by the time the component mounts. The
wrapper then:

- takes an `icon` name and a `delay` number as props;
- sets its child icon's `animate` prop true once, `delay` ms after
  mount, and leaves it true;
- skips that entirely when
  `matchMedia('(prefers-reduced-motion: reduce)').matches`;
- renders `aria-hidden="true"` on its own root element.

The stagger comes from the `delay` prop, not from cross-island
coordination: the three rows pass `0`, `80`, and `160`. Each island is
independent, so no shared observer or state is needed and the list
markup stays in `about.astro`.

A visitor who never scrolls to the Focus list never fetches the Svelte
runtime at all.

Hover remains available on desktop as a replay, unchanged from
upstream. Because `animate` is a prop the components already accept,
none of this forks the package.

### Two upstream defects to patch on our side

Neither is fixed by forking the package. Both are handled in our own
wrapper and stylesheet, so `@jis3r/icons` can be upgraded freely.

**No reduced-motion handling.** No file in `@jis3r/icons@2.9.0`
references `prefers-reduced-motion`. A site-level rule in
`src/styles/global.css` neutralises it:

```css
@media (prefers-reduced-motion: reduce) {
  .focus-icon *,
  .focus-icon *::before,
  .focus-icon *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

Under reduced motion the icons render statically. They are decorative,
so removing their motion entirely loses no meaning. The in-view
observer should also skip setting `animate` when
`matchMedia('(prefers-reduced-motion: reduce)').matches`, so no
animation is started in the first place.

**Icon name announced to screen readers.** Each icon renders
`<div role="img" aria-label="route">`. Left alone, a screen reader
would announce "route, Process automations". The wrapper element
carries `aria-hidden="true"`, which hides the entire subtree including
the `role="img"` node. The row's own text is the accessible name.

Upstream also uses `transform: scale(0)` inside two `sparkles`
keyframes. None of the three chosen icons use that keyframe, so it does
not apply here; do not select `sparkles` later without revisiting it.

### Markup and styling

The list becomes a two-column grid per row: an auto-width icon column
and a `1fr` text column, `1rem` gap. The existing hairline rules,
padding, and type are unchanged. The icon column is `--color-muted` so
the icons sit quieter than the row text, which stays `--color-ink`.

Below 30rem the layout is unchanged: a 24px icon plus a 1rem gap costs
40px, which the narrowest supported width absorbs without wrapping the
labels.

The `.focus-icon` class named in the reduced-motion rule above is the
class on `FocusIcon.svelte`'s root element, which is also the element
carrying `aria-hidden="true"`.

### Tests

- `tests/payload-hygiene.test.mjs` reads `src/pages/about.astro` at two
  points (lines 154 and 194). Read both assertions before editing the
  page and confirm the new markup satisfies them.
- Add an assertion that the Focus icon wrapper carries
  `aria-hidden="true"`, so the screen-reader defect cannot be
  reintroduced.
- Add an assertion that `global.css` carries the reduced-motion
  neutraliser for `.focus-icon`.
- `npm run build` must still succeed with two UI framework integrations
  registered.

Manual check: confirm the three icons fire in sequence when the list
scrolls into view on a phone, and that hover replays them on a desktop
pointer.

---

## Out of scope

- The hero's scroll cue arrow on the home page. It is not in the
  navigation bar and stays.
- The `/work` card stack's own scroll hint arrow.
- Any change to the FAQ, process, or big-type sections.
- Replacing the existing forward morph with a different mechanism.
- Icons anywhere other than the About page's Focus list.
