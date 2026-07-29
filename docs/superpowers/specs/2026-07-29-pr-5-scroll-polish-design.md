# PR #5 Scroll Motion and Resolved-System Polish

## Problem

The Tuesday Board hero has two related presentation regressions:

1. Artifact movement accelerates abruptly during the transition into the
   resolved system, so normal wheel and trackpad input reads as jerky.
2. The cobalt transformation field expands into a large scene-wide rectangle
   when the `A working system` card appears, making the color feel detached
   from the content it is meant to support.

## Root Cause

`segmentProgress` already applies a smoothstep curve, and `interpolatePose`
applies smoothstep to that result a second time. The nested easing concentrates
most of each pose change around the segment midpoint. The latest hero revision
also shortened the resolve interval from `0.42–0.88` to `0.36–0.72`, further
increasing the peak visual velocity within the existing scroll runway.

The cobalt field belongs to `.workflow-scene::before` and spans nearly the
entire right half of the viewport. At full progress it therefore reads as an
independent blue panel rather than as structure attached to the resolved
system.

## Approaches Considered

### 1. Single easing with a card-attached cobalt accent

Apply one smoothstep curve per motion segment, restore a wider resolve range,
slightly lengthen the sticky hero runway, and move the cobalt backing from the
scene to the resolved-system artifact.

This preserves native scrolling, the established palette, and the intended
transformation cue while addressing both root causes directly.

### 2. Single easing with a smaller scene field

Keep the scene-level pseudo-element but reduce its bounds around the final card.
This is a smaller CSS change, but the field cannot reliably track responsive
card positions and may still look detached at intermediate widths.

### 3. Remove the cobalt field

Delete the field and rely on the resolved card alone. This is visually clean,
but it weakens the designed transition from scattered work to a coherent
system.

## Approved Direction

Use approach 1.

### Motion

- Preserve native browser scrolling; do not capture or smooth the page scroll.
- Ensure normalized segment progress is eased exactly once.
- Widen the resolve interval so movement is distributed across more physical
  scroll distance.
- Add a modest amount of sticky runway on desktop and mobile without turning
  the hero into a prolonged scroll trap.
- Keep all DOM writes inside the existing `requestAnimationFrame` render pass.
- Preserve the reduced-motion profile: shorter travel, no rotation, and a
  complete scroll-linked narrative.

### Resolved-System Styling

- Remove the scene-wide cobalt pseudo-element.
- Add a restrained cobalt offset backing to the resolved-system artifact.
- Reveal the backing using the existing cobalt progress variable so it remains
  synchronized with the card.
- Keep the backing close to the card edges and subordinate to its paper surface.
- Use the same relationship at mobile sizes rather than introducing a separate
  full-width blue field.

## Verification

Automated regression checks will establish that:

- Pose interpolation does not re-ease an already eased segment value.
- The resolve transition remains incomplete at the old compressed endpoint and
  reaches completion near the widened endpoint.
- Existing reduced-motion, line-opacity, frame scheduling, and cleanup behavior
  remains intact.

Browser verification will inspect representative desktop and mobile viewports
at multiple scroll positions. It will confirm that:

- Artifacts progress continuously without a pronounced midpoint jump.
- The cobalt accent remains visually attached to `A working system`.
- No large standalone blue rectangle appears.
- The resolved card remains readable and does not overlap the hero copy.
- JavaScript-disabled and reduced-motion states retain meaningful content.

## Scope

The change is limited to the Tuesday Board motion model, hero scroll runway,
resolved-system styling, and their regression tests. It does not alter page
copy, workflow content, the broader palette, or sections below the hero.
