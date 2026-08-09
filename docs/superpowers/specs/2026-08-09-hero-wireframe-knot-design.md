# Hero Wireframe Knot Design

**Date:** 2026-08-09
**Status:** Approved

## Starting state

For a session picking this up cold:

- Work happens on branch `feat/hero-wireframe-knot`, which currently contains
  only this document.
- `three@0.185.1` is already added to `package.json` and `package-lock.json` but
  is **uncommitted**. It was installed to measure bundle impact. Commit both
  files together with the first implementation commit; the Dockerfile builder
  runs `npm ci`, so a `package.json` without its lockfile entry breaks the
  deploy.
- The prototype this design was approved from is preserved beside this document
  as `2026-08-09-hero-wireframe-knot-prototype.html`. Open it in a browser to see
  the approved look; it is scene **C**. It loads Three.js from a CDN and needs
  network access. It is reference material, not shippable code: it lives in
  `docs/`, is not part of the build, and its structure should not be copied.
  Every value needed to rebuild the look is also written into this document.
- Reference skills `threejs-fundamentals`, `threejs-geometry`,
  `threejs-materials`, `threejs-animation`, and `threejs-interaction` are
  installed locally. They live in the gitignored `.agents/skills/` cache and are
  symlinked from `.claude/skills/`.
- Nothing in this design has been implemented yet. The next step is to turn this
  document into an implementation plan with the `writing-plans` skill, saved to
  `docs/superpowers/plans/` following the existing files there.

## Purpose

The homepage hero currently shows the title, tagline, and scroll cue on an
otherwise blank field. The first viewport reads as unfinished. This design adds
one restrained 3D element that gives the hero presence without turning it into a
demo.

This is deliberately small in scope. The previous hero attempt (the "untangler",
later rebuilt as "Tuesday Board") tried to tell a scroll-driven story about
messy work resolving into a clear workflow. It took roughly twenty commits and
was removed. Its failure modes were scroll-pinned staging, drag physics, and
per-frame geometry. None of those appear here.

## What stays unchanged

The title, tagline, scroll cue, their entrance animations, the navigation, and
every section below the hero. This change adds a decorative canvas behind the
existing hero content and nothing else.

## Visual composition

A single torus knot rendered as a wireframe:

- `TorusKnotGeometry(1.4, 0.42, 220, 32, p = 2, q = 3)`
- wrapped in `WireframeGeometry`
- drawn as `LineSegments` with `LineBasicMaterial`
- color `--color-ink` (approximately `0x1a1a1f` in sRGB), `transparent: true`,
  `opacity: 0.55`

Placement follows the approved prototype: the knot sits on the right side of the
hero, offset so it never overlaps the title and tagline reading zone. Camera at
`z = 7.5`, mesh offset roughly `x = 1.6`, `y = 0.2`. The canvas is transparent
and sits over the existing `--color-bg`; it does not paint its own background.

These numbers come from a desktop-width prototype and are **not** valid at every
viewport. The camera's vertical field of view is fixed at 45° while the
horizontal extent shrinks with the aspect ratio, so the same world offset drifts
inward as the viewport narrows. Narrow-viewport placement is specified under
Responsive behavior.

The canvas is decorative. It is `aria-hidden="true"`, is not focusable, and
never carries content or functionality.

### Where the canvas sits

The hero lives inline in `src/pages/index.astro` as `<section class="hero">`,
with scoped styles in the same file. It contains `.hero-content` (title and
tagline) and `.hero-scroll` (the scroll cue), both already at `z-index: 2`.

`HeroKnot.astro` is inserted as the first child of that section. Its canvas is
absolutely positioned to fill the section at a `z-index` below `2`, so existing
hero content continues to paint on top without any change to their rules. The
renderer is constructed with `alpha: true` so the page background shows through,
and `antialias: true`, which matters more than usual because the entire subject
is one-pixel lines.

### Why wireframe, and what controls its weight

`LineBasicMaterial.linewidth` above `1` is ignored on effectively all WebGL
platforms. Lines always render one device pixel wide. Line weight therefore
cannot be set directly, and is instead governed by three things:

1. geometry segment density (tubular by radial segments)
2. material opacity
3. renderer pixel ratio, because a higher ratio makes lines *thinner* in CSS
   terms

Pixel ratio is capped at `2` via `min(devicePixelRatio, 2)`, matching the
approved prototype. Do not lower this cap to gain performance. Doing so would
visibly thicken the lines and change the approved look. Performance is managed
through segment count instead.

## Motion model

The knot is still until triggered. There is no idle or automatic rotation. With
no input, it holds a fixed pose.

The rotation target comes from two inputs:

- **Cursor position**, normalized to `-1..1` across the viewport as
  `nx = clientX / innerWidth * 2 - 1` and `ny = clientY / innerHeight * 2 - 1`.
  The axes cross: vertical cursor movement drives x rotation, horizontal cursor
  movement drives y rotation. This is what makes the knot appear to turn toward
  the pointer rather than away from it.
  - `rotation.x` offset `= ny * 0.35`
  - `rotation.y` offset `= nx * 0.5`
- **Scroll progress**, `p = min(1, scrollY / (innerHeight * 0.8))`, giving
  `rotation.y` offset `= p * 1.2`. The `0.8` factor means the knot completes its
  scroll rotation slightly before the hero has fully left the viewport.

### How the two inputs combine

The prototype let these two inputs overwrite each other: whichever event fired
last owned the y rotation, so moving the cursor after scrolling snapped the knot
back. That snap is a defect, not part of the approved look.

The two inputs therefore **sum**, and the combined y offset is **clamped to
`+1.2` rad**, which is the maximum the prototype could reach. This preserves the
approved motion envelope while removing the snap. Because summing is a change
from what was demonstrated on screen, the combined feel must be looked at again
before the work is called done; see Verification.

### Damping and loop lifecycle

Current rotation eases toward the target by a fixed damping factor (`0.06` per
frame), which keeps motion smooth and interruptible. The base pose is
`(0.4, 0.6, 0)`.

The animation loop is not permanently running. It has three states:

- **Running:** rotation is converging on the target.
- **Idle but listening:** rotation has converged, the loop has stopped, and
  cursor and scroll handlers remain attached. Either handler setting a new
  target restarts the loop. This is the state the knot rests in, and it must be
  able to leave it any number of times.
- **Torn down:** the hero has left the viewport. The `IntersectionObserver`
  stops the loop and detaches input handling. Re-entering the viewport
  reattaches and returns the knot to idle-but-listening.

Scroll is never captured, pinned, slowed, or scrubbed. The hero scrolls away
normally.

## Responsive behavior

- **Fine pointer (desktop):** cursor and scroll inputs both active.
- **Coarse pointer (touch):** no cursor input and no cursor listeners attached.
  Scroll input alone drives the knot.
- **Mobile density:** segment counts drop to `(120, 20)`. Implementation must
  visually confirm this still reads as intentional. If it reads as faceted or
  cheap, mobile renders nothing instead of shipping a degraded knot. Both
  branches are approved here; see Deferred decision.

### Narrow-viewport placement

> **Amended 2026-08-09, owner request, after phase 2.** The hero copy no longer
> sits at the bottom of the section. It is now vertically centred at every
> width (`top: 50%` with a `-50%` translate), left aligned, and the hero has
> gained a masked grid background at `z-index: 0`. The paragraph below is
> preserved for its reasoning, but its stated bottom offset is no longer true.
>
> Consequence for phase 4: the empty region above the title is now roughly the
> top third of the viewport rather than the top two thirds, so the provisional
> narrow placement (`y: 1.5`, `cameraZ: 9`) has materially less room than when
> it was chosen and must be re-derived on a real narrow viewport, not merely
> confirmed. On desktop the copy is now at the same vertical centre as the
> knot, so the no-overlap check matters most at intermediate widths around
> 1024px, where the horizontal extent shrinks but the copy does not.

Below 768px the hero content changes shape: the title and tagline span nearly
the full width (`left`/`right: 1.5rem`) and sit at `bottom: max(5.5rem, 14vh)`.
A right-side offset has nowhere to go. The knot therefore moves to the **upper
region** of the hero, above the text block rather than beside it:

- horizontal offset returns to roughly centered (`x` near `0`)
- the knot moves up (positive `y`) and back (larger camera `z`) so it occupies
  the empty area above the title
- it must clear the title's top edge with margin, not merely avoid touching it

The transition between the wide and narrow arrangements is driven by measured
viewport width, resolved in `getSegmentCounts`' sibling placement function, not
by CSS media queries inside the scene code.

The canvas is sized to the hero element and re-measured with a
`ResizeObserver`, never by reading layout on every frame.

## Fallbacks

The hero's content and navigation never depend on the canvas.

- **`prefers-reduced-motion: reduce`:** render nothing, and do not import
  Three.js at all. Today's hero stands unchanged. The knot is decorative and
  carries no information, so downloading 129 KB to paint a motionless line
  drawing for someone who asked for less motion is a bad trade. An earlier hero
  did show reduced-motion visitors its animation, but that hero conveyed
  meaning; this one does not. Owner decision, 2026-08-09.
- **No WebGL support:** render nothing. Today's hero stands unchanged. No error
  state and no placeholder.
- **Script or chunk fetch failure:** same as above, nothing renders and the hero
  is unaffected.
- **Hero scrolled out of view:** an `IntersectionObserver` stops the loop and
  detaches input handling.

## Technical architecture

No React island. This follows both the removed hero's explicit rule ("do not
introduce a React island solely for animation") and the repo's existing pattern.

Three parts:

1. **`src/components/HeroKnot.astro`** — the canvas element, its `aria-hidden`
   attribute, and the mount script.
2. **`src/scripts/hero-knot-motion.mjs`** — pure functions with no Three.js
   import, unit tested.
3. **Scene wiring** inside the component's script — imperative Three.js setup,
   not unit tested.

The pure functions in the motion module:

- `calculateRotationTarget(pointerX, pointerY, scrollProgress, basePose)`
  returning `{ x, y }`, summing both inputs with the y offset clamped to `+1.2`
- `dampToward(current, target, factor)` returning the next value
- `isConverged(current, target, epsilon)` returning a boolean
- `getSegmentCounts(viewportWidth)` returning `{ tubular, radial }`
- `getPlacement(viewportWidth, viewportHeight)` returning `{ x, y, cameraZ }`,
  covering both the wide and narrow arrangements
- `shouldRender(prefersReducedMotion, hasWebGL)` returning `'animated'` or
  `'none'`. There is deliberately no static-frame state; see Fallbacks.

The clamp, the narrow/wide placement switch, and the convergence threshold are
all pure and therefore all directly testable. That is the point of the split.

This mirrors `src/scripts/bigtype-motion.mjs`, a pure function tested in
`tests/bigtype-motion.test.mjs`. The renderer holds no interaction policy; the
motion module holds no Three.js types.

## Loading and performance

Measured in this repo against `three@0.185.1`:

- Three.js builds to its own chunk: 514 KB raw, 129 KB gzipped.
- With a dynamic `import('three')`, that chunk is not preloaded and is not
  referenced anywhere in the built HTML. It is fetched at runtime only when the
  hero decides to mount.
- The homepage HTML contains no reference to Three.js, so the title text remains
  the LCP element.

Rules that preserve these properties:

- Import Three.js only through a dynamic `import()` inside the mount path, after
  the render decision has been made. A reduced-motion visitor, or one without
  WebGL, never downloads the 129 KB chunk.
- Use named imports so unused Three.js modules can be dropped.
- Create geometry, material, and renderer once. No per-frame allocation.
- Dispose geometry, material, and renderer if the component tears down.

## Scope fence

Not part of this change:

- sticky scroll pinning or any scroll-scrubbed narrative
- idle or automatic rotation
- custom shaders, postprocessing, or bloom
- `Line2` / `LineMaterial`; the answer to thin lines is density and opacity, not
  a different line implementation
- any change to the title, tagline, or the sections below the hero
- any React dependency for this feature

## Verification

Implementation is complete when:

- `npm run build` succeeds, with `package-lock.json` committed alongside
  `package.json`. The Dockerfile builder runs `npm ci`, so a missing lock entry
  breaks the deploy.
- `npm test` passes, including new tests for the motion module.
- On desktop, cursor movement and scroll both rotate the knot smoothly, and the
  knot stops moving once input stops.
- The summed cursor-plus-scroll motion has been looked at on screen and approved,
  since summing differs from the prototype's last-writer-wins behavior. Moving
  the cursor after scrolling must not snap the knot.
- The knot leaves and re-enters the idle state repeatedly. It does not freeze
  permanently after the first time it settles, and it still responds after the
  hero has scrolled out of view and back in.
- On a narrow viewport the knot sits above the title with visible margin, not
  beside or behind it.
- On a touch device, scroll rotates the knot and no cursor handlers are
  attached.
- Under reduced motion, nothing renders and the Three.js chunk is never
  requested, confirmed in the devtools network panel.
- With WebGL disabled, the hero renders exactly as it does today.
- The title and tagline stay fully readable, and the knot never overlaps them at
  any viewport width.
- The title text is still the LCP element, confirmed in devtools.
- Resize and orientation changes neither distort the knot nor push it over the
  text.

## Deferred decision

Mobile density is the only decision left to implementation. The implementer must
look at `(120, 20)` on a real narrow viewport and choose one of two pre-approved
branches: keep it if it reads as intentional, or render nothing on mobile if it
does not. No third option, and no widening of scope to rescue it.

## Out of scope

- A second hero concept or any A/B variant
- Reintroducing the untangler or Tuesday Board workflow narrative
- Technology logos or integration marks in the hero
- A broader redesign of the landing page
