# Interactive “Untangler” Hero Design

**Date:** 2026-07-26  
**Status:** Approved

## Purpose

The hero should demonstrate AVP Software’s core promise: turning frustrating,
manual operational work into a clear working system. It should also suggest
that AVP works quickly and directly, without presenting the company as a
self-serve automation product.

The interaction thesis is:

> Touch one part to feel the system respond; scroll to see the whole workflow
> resolve.

## Visitor and outcome

The primary visitor is someone responsible for improving a small team’s
operations. They recognize the scattered emails, spreadsheets, approvals, and
manual handoffs in the initial scene. Within the first viewport, they should
understand that AVP finds order in this mess and builds the system that makes
work move.

The interaction is explanatory and expressive. It is not a puzzle, workflow
editor, or product simulation.

## Visual composition

Preserve the established monochrome editorial identity, current hero title,
tagline, navigation, and Process scroll link.

The `AVP Software` title and tagline remain anchored in the lower-left. A
workflow scene occupies the upper and right areas of the viewport, leaving a
calm reading zone around the main copy. It contains eight compact text
fragments, connected by restrained hairlines.

The initial state represents a plausible manual workflow with fragments such
as:

- Email request
- Missing details
- Spreadsheet
- Copy/paste
- Approval?
- Reminder
- Accounting system
- Done

Fragments are typographic labels or paper-like process markers, not cards with
input/output ports. Connections may be offset, interrupted, or indirect in the
messy state, but the overall composition must remain intentional and legible.
It should look like an operational diagram being understood, not debris or a
physics toy.

The resolved client workflow is:

`Request → Check details → Approval → Sync systems → Done`

This is deliberately separate from AVP’s `Map → Design → Build → Run` process
in the following section. The hero demonstrates the client outcome; the next
section explains how AVP produces it.

## Interaction model

### Pointer response

Pointer interaction is secondary delight rather than required navigation.

On fine-pointer devices:

- A fragment subtly acknowledges pointer proximity.
- Nearby fragments move partway toward their resolved positions, creating a
  local clarity field around the pointer.
- A fragment can be dragged. Its connections stretch continuously and nearby
  fragments respond.
- Releasing it settles the fragment with a restrained, interruptible magnetic
  spring.
- The interaction never asks the visitor to find a correct drop target or
  complete the workflow manually.

When pointer influence ends, locally affected fragments ease back toward the
state dictated by scroll progress. Pointer interaction must never fight the
scroll transformation.

### Scroll transformation

Scroll is the canonical narrative and is available to every visitor.

The hero uses a slightly extended scroll stage with a sticky, viewport-height
scene. Normal page scrolling is never captured, slowed, or replaced.

As scroll progress advances:

1. Fragment rotations straighten and interrupted connections begin to align.
2. Manual or duplicate artifacts recede while the essential steps move into a
   readable sequence.
3. The workflow resolves into one clear path.
4. The final connection directs the eye toward the Process section below.

The transformation should spend most of its time between the initial and final
states rather than delaying the response. Scroll progress owns the base state;
pointer proximity adds a temporary local offset on top of it.

### Touch and reduced motion

Touch devices use the scroll transformation as the primary experience. A tap
briefly creates the same localized response as pointer proximity; touch drag is
not enabled.

With `prefers-reduced-motion: reduce`, render the clear resolved workflow as a
static composition. Do not run autonomous movement, scroll interpolation,
springs, or connection animation.

## Motion character

The movement explains a change of state and should feel controlled rather than
playful.

- Use transform and opacity for fragment motion.
- Use interruptible spring behavior for pointer-driven movement.
- Keep overshoot very small; no bouncing or elastic wires.
- Connections should follow their fragments continuously.
- Do not add perpetual idle motion. The initial diagram may be still until the
  visitor moves or scrolls.
- The title and tagline retain their existing entrance treatment and remain
  readable throughout.

## Technical architecture

Replace the decorative dot-grid component with one focused hero workflow
component.

The component has three independently understandable parts:

1. **Workflow model:** fragment labels, messy positions, resolved positions,
   visibility, and connection relationships.
2. **Renderer:** semantic HTML fragments above one decorative SVG connection
   layer.
3. **Controller:** normalized scroll progress, pointer proximity, drag state,
   spring integration, and animation lifecycle.

The renderer receives computed positions and does not own interaction policy.
The controller treats scroll progress as the authoritative base state and
pointer/drag effects as temporary additions. Geometry is measured on setup and
resize, not on every animation frame.

No node-editor component library should be used. React Flow, Rete, and similar
packages would add editor semantics, weight, and a visual vocabulary that
misrepresents AVP as an automation product. Implement the interaction as a
framework-free Astro component with a focused TypeScript controller; do not
introduce a React island solely for animation.

## Responsive behavior

- **Wide desktop:** workflow occupies the upper-right and can spread
  horizontally before resolving into a clear path.
- **Narrow desktop/tablet:** reduce fragment count or shorten labels before
  shrinking them below comfortable reading size.
- **Mobile:** use a compact vertical or stepped resolved path in the upper
  portion of the hero. Preserve the title and tagline reading order. Scroll
  transformation remains; precision dragging is omitted.

The layout must tolerate browser resizing and orientation changes without
connections crossing the title or leaving the viewport.

## Failure and fallback behavior

The hero’s content and navigation never depend on the animation.

- If scripting or SVG setup fails, show the static resolved workflow.
- If geometry is temporarily unavailable, defer setup without shifting page
  content.
- Pause animation work when the hero is off-screen.
- Recalculate geometry after meaningful resize changes.
- Decorative connection lines remain hidden from assistive technology.
- Draggable fragments are not announced as controls because completing a drag
  is not necessary to access information or functionality.

## Performance constraints

- Keep the scene to roughly seven to nine fragments and a small fixed set of
  connections.
- Update visual state in a single animation frame loop only while pointer,
  drag, spring, or visible scroll activity requires it.
- Animate transforms and opacity; avoid per-frame layout reads.
- Stop work when off-screen and avoid adding a general-purpose physics engine.

## Verification

Implementation is complete when:

- The unchanged title, tagline, navigation, and Process link remain usable.
- The messy-to-clear story is understandable without interacting.
- Pointer proximity, drag interruption, release, and rapid re-grab remain
  smooth.
- Normal scrolling is never blocked or hijacked.
- Desktop, tablet, mobile, touch, keyboard-only, and reduced-motion states are
  verified.
- The static fallback remains meaningful with JavaScript unavailable.
- Connection geometry remains correct after resize and orientation changes.
- The production build succeeds without adding a node-editor or physics
  dependency.

## Out of scope

- A functional workflow builder
- User-authored nodes or persisted layouts
- Correct/incorrect drop targets
- Technology logos or integration catalogs in the hero
- Invented client results, benchmarks, or testimonials
- A broader redesign of the landing page
