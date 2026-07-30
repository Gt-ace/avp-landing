# Big type Skiper58 hover: design spec

## Goal

Integrate Skiper UI's `skiper58` text-roll treatment into the decorative
`DESIGN BUILD` / `AUTOMATE RUN` band. Preserve the current equal-and-opposite
scroll movement while giving pointer users a crisp, independent character-roll
response on each line.

## Interaction

- `DESIGN BUILD` continues moving right as the visitor scrolls down.
- `AUTOMATE RUN` continues moving left by the same amount.
- Hovering either line triggers Skiper58's staggered vertical character roll
  for that line only.
- The hover response uses Skiper58's native fixed animation. It does not track
  pointer position, tilt the text, add depth, or modify the scroll position.
- Scroll remains authoritative. The hover animation is composed inside the
  scrolling wrapper so the two transforms do not overwrite one another.
- The band remains decorative and excluded from the accessibility tree.

## Architecture

Install `@skiper-ui/skiper58` through the shadcn registry and adapt the generated
React `TextRoll` component to the existing Astro page. Mount one small React
island for the two decorative lines, or two instances within one island,
depending on the generated component's public API.

The outer Astro/DOM line wrappers retain the existing `data-speed` attributes
and CSS `--shift` transform. `TextRoll` owns only its internal character
animation. The current requestAnimationFrame-throttled scroll controller and
pure `calculateBigtypeShift` function remain unchanged unless integration
requires selecting a more specific inner wrapper.

Styling continues to use the site's Bodoni display face, ink color, oversized
scale, and current spacing. Registry demo layout and presentation styles are
not imported into the landing page.

## Responsive and motion behavior

- Desktop and other fine-pointer devices receive the hover roll.
- Touch devices keep the existing scroll-linked presentation without requiring
  a hover substitute.
- The existing responsive type scale and overflow clipping remain unchanged.
- Under `prefers-reduced-motion: reduce`, character rolling is disabled and the
  text remains readable and visually stable. Existing scroll behavior remains
  consistent with the project's current big-type motion policy.

## Verification

- Extend regression coverage where needed to prove scroll transforms continue
  to move both lines equally in opposite directions.
- Build the Astro site and run the full test suite.
- Verify in a browser that each line rolls independently on hover while both
  lines still react continuously to scrolling.
- Check desktop, mobile/touch-sized, and reduced-motion views.
- Confirm there is no horizontal page overflow and no browser-console error.

## Scope

This change is limited to the big-type band, the installed Skiper58 component
and its direct dependencies or configuration, focused tests, and the durable
design documentation. It does not change page copy, the Process or FAQ
sections, the hero workflow, or global scrolling.
