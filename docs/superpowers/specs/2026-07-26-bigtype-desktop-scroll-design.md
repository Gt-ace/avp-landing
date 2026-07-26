# Big type desktop scroll motion: design spec

## Goal

Keep both oversized type lines moving whenever the page scrolls on desktop:
`DESIGN BUILD` moves right while `AUTOMATE RUN` moves left, at equal speeds.

## Current behavior and root cause

The existing scroll handler applies equal-magnitude, opposite-sign speeds to
the two lines. Its only explicit runtime opt-out is an early return when the
browser reports `prefers-reduced-motion: reduce`. That preference can be
reported by a desktop browser while remaining off on mobile, leaving the
desktop lines completely static.

## Design

- Preserve the existing requestAnimationFrame-throttled scroll handler.
- Remove the motion-preference early return for this decorative scroll effect,
  because the requested behavior is that it always moves on desktop.
- Keep equal-magnitude direction values: the top line moves right as page
  scroll position increases, and the bottom line moves left.
- Extract the offset calculation into a small JavaScript module so direction,
  speed parity, and scroll response can be covered by Node's built-in test
  runner without adding a dependency.
- Keep all unrelated page behavior and styling unchanged.

## Verification

- A regression test proves increasing downward scroll moves the top line in
  the positive X direction and the bottom line in the negative X direction.
- The same test proves both movements have equal absolute distance.
- The page build succeeds after the module is wired into the Astro page.
- The final diff contains only the motion fix, its regression coverage, and
  these focused design/implementation notes.
