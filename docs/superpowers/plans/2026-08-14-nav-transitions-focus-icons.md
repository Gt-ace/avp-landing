# Nav chevron, work transitions, and About focus icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the nav pill's chevron, retune the `/work` view transitions to 300ms with a directional back animation, and give the About page's Focus list animated icons.

**Architecture:** Three independent changes. The nav pill change is local to one React island and its two test files. The transition change is CSS plus one inline listener in the shared layout. The Focus icons add a second UI framework integration (Svelte) whose runtime ships only on `/about`, behind `client:visible`.

**Tech Stack:** Astro 4.16 (`output: 'static'`), React 18 islands, Framer Motion 11, Svelte 5 (new), `@jis3r/icons` 2.9.0 (new), `node:test` for source-assertion tests, Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-08-14-nav-transitions-focus-icons-design.md`

## Global Constraints

- **One easing curve site-wide:** `cubic-bezier(0.16, 1, 0.3, 1)`. Do not introduce a second curve anywhere in this work.
- **Design tokens come from `src/styles/global.css`:** `--color-ink`, `--color-muted`, `--color-border`, `--color-bg`, `--font-display`, `--font-body`, `--text-label`. Do not define a parallel scale.
- **Reduced motion ships with the motion.** Every animated surface added here gets a `prefers-reduced-motion: reduce` path in the same task.
- **`TOUCH_TARGET` is 44 and stays 44.** No interactive box shrinks below it in either direction while it is interactive.
- **`npm test`** runs `node --test tests/*.test.mjs` followed by `vitest run`. Both must pass at every commit.
- **Test style:** these are source-assertion tests. They read a file with `readFile` and assert on its text. Follow the existing files exactly; do not introduce a DOM test runner.

---

## File Structure

**Modified:**
- `src/components/NavPill.tsx` — remove the chevron, collapse the disclosure button's box, narrow the open pill
- `tests/nav-pill.test.mjs` — drop the chevron test, retarget the button test, add the collapse assertion
- `tests/nav-pill-geometry.test.ts` — pin the new open width
- `src/layouts/BaseLayout.astro` — 300ms transitions, direction attribute listener, back-direction keyframes
- `src/pages/work/[slug].astro` — `fade({ duration: 300 })`
- `src/pages/about.astro` — icon column in the Focus rows
- `src/styles/global.css` — Focus icon layout and reduced-motion neutraliser
- `astro.config.mjs` — register the Svelte integration
- `package.json` — three new dependencies

**Created:**
- `tests/view-transitions.test.mjs` — locks the two durations together, asserts the back rules exist
- `src/components/focus/FocusIcon.svelte` — the icon wrapper island
- `tests/focus-icons.test.mjs` — asserts the wrapper's accessibility and reduced-motion behaviour, and the page wiring

---

## Deviation from the spec, decided while planning

The spec says the disclosure **button** animates its own `minWidth` to 0. The plan instead moves the 44px floor off the button and onto the inner `motion.span` that already animates width. Same result, three advantages:

1. The button stays a plain `<button>`, which `tests/nav-pill.test.mjs:105` slices on by searching for the literal `<button`.
2. No new layout-animating element is introduced. The span already animated `width`; nothing that did not animate before starts animating.
3. The whole 44px box collapses rather than the 14px glyph, so `DESKTOP_OPEN_WIDTH` drops by 44 (480 → **436**), not by 14. The spec's 466 assumed the button kept its box.

436 is still comfortable: the open centre slot holds three links at roughly 234px total, inside 436 − 88 (the A and P) = 348px of clear width.

---

## Task 1: Remove the nav pill chevron

**Files:**
- Modify: `src/components/NavPill.tsx`
- Test: `tests/nav-pill.test.mjs`, `tests/nav-pill-geometry.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `DESKTOP_OPEN_WIDTH = 436` exported from `src/components/NavPill.tsx`. `CLOSED_WIDTH`, `MOBILE_PANEL_WIDTH`, `PILL_HEIGHT`, `MOBILE_ROW_HEIGHT`, `TOUCH_TARGET`, `getPillGeometry`, and `shouldCloseOnFocusOut` keep their current names and signatures.

- [ ] **Step 1: Replace the chevron test with a removal test**

In `tests/nav-pill.test.mjs`, delete the whole `test('the chevron marks the pill as openable and reports state', ...)` block at lines 123-136 and put this in its place:

```js
test('the disclosure control is the V alone, with no glyph beside it', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.doesNotMatch(
    source,
    /function Chevron/,
    'the chevron was removed on purpose; the V is the whole control now'
  )
  assert.doesNotMatch(
    source,
    /CHEVRON_GAP/,
    'the gap only existed to separate the V from the chevron'
  )
})

test('the collapsing V takes its touch box with it', async () => {
  const source = await read('../src/components/NavPill.tsx')
  const button = source.slice(
    source.indexOf('<button'),
    source.indexOf('</button>')
  )

  assert.doesNotMatch(
    button,
    /minWidth: TOUCH_TARGET/,
    'a 44px floor on the button leaves an empty box between the A and the links once the V collapses'
  )
  assert.match(
    button,
    /minHeight: TOUCH_TARGET/,
    'the vertical floor still applies: the button is 44px tall in both states'
  )
  assert.match(
    source,
    /width: isOpen \? 0 : TOUCH_TARGET/,
    'the span that holds the V owns the horizontal floor, and collapses it to nothing when open'
  )
})
```

- [ ] **Step 2: Pin the new open width**

In `tests/nav-pill-geometry.test.ts`, add this case inside the `describe('NavPill geometry', ...)` block, after the `'expands sideways on desktop without growing taller'` case:

```ts
  it('recovers the width the collapsed disclosure box no longer needs', () => {
    // The button used to hold a 44px floor even while open, because it still
    // showed a chevron. With the chevron gone the whole box collapses, so the
    // open pill is 44px narrower than it was.
    expect(DESKTOP_OPEN_WIDTH).toBe(436)
  })
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `npx vitest run tests/nav-pill-geometry.test.ts && node --test tests/nav-pill.test.mjs`

Expected: the vitest case FAILS with `expected 480 to be 436`. The node tests FAIL on `the disclosure control is the V alone` (`function Chevron` still matches) and on `the collapsing V takes its touch box with it`.

- [ ] **Step 4: Delete the Chevron component and its constant**

In `src/components/NavPill.tsx`, delete the entire `Chevron` function together with its doc comment (the block starting `/**\n * The affordance.` and ending with the closing brace of `function Chevron`), and delete the line `const CHEVRON_GAP = 5`.

Leave `EASE_OUT_QUART` alone: `NavLink` still uses it.

- [ ] **Step 5: Narrow the open pill**

Change the constant and its comment:

```ts
/**
 * Open width holds the three links between the A and the P. The disclosure
 * box collapses to nothing when the pill opens, so nothing but the links and
 * the two letterforms is inside this.
 */
export const DESKTOP_OPEN_WIDTH = 436
```

- [ ] **Step 6: Move the touch floor onto the collapsing span**

In the `<button>`'s inline `style` object, delete the line `minWidth: TOUCH_TARGET,`. Keep `minHeight: TOUCH_TARGET,` and every other property.

Then replace the `motion.span` inside the button, and delete the `<Chevron ... />` element that followed it, so the button's children become exactly this:

```tsx
            {/* The V collapses to nothing rather than unmounting, so the
                button keeps a stable identity for focus across the toggle.
                It carries the 44px horizontal floor rather than the button,
                so the whole box goes with it: a floor on the button would
                leave an empty 44px gap before the first link once open. */}
            <motion.span
              aria-hidden="true"
              animate={{
                width: isOpen ? 0 : TOUCH_TARGET,
                opacity: isOpen ? 0 : 1,
              }}
              initial={false}
              transition={shapeTransition}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Letter src="/v.svg" height={VP_HEIGHT} />
            </motion.span>
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`

Expected: PASS. Every nav-pill test, both files, plus everything else.

- [ ] **Step 8: Verify in the browser**

Run: `npm run dev`

Check, at a desktop width and at 390px:
- Closed pill reads `A  V  P`, with the V horizontally centred between them.
- Hovering (desktop) or tapping (narrow) opens it; the V collapses and no empty gap is left before `WORK`.
- Tab to the V: the focus ring is visible and clipped inside the pill, not cut off.
- Escape closes the pill and returns the ring to the V.

- [ ] **Step 9: Commit**

```bash
git add src/components/NavPill.tsx tests/nav-pill.test.mjs tests/nav-pill-geometry.test.ts
git commit -m "feat(nav): drop the chevron and let the V collapse its own box"
```

---

## Task 2: Retune the work transitions to 300ms

**Files:**
- Modify: `src/layouts/BaseLayout.astro`, `src/pages/work/[slug].astro`
- Test: `tests/view-transitions.test.mjs` (create)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: a single site-wide transition duration of `300ms`, asserted to be identical in both files. Task 3 adds rules to the same `<style is:global>` block in `BaseLayout.astro`.

- [ ] **Step 1: Write the failing test**

Create `tests/view-transitions.test.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

test('the page fade and the card morph run to the same clock', async () => {
  // Naming only the groups once left the outgoing page gone at the UA default
  // 250ms while the morph still had time to run. The two numbers have to move
  // together or the swap smears.
  const layout = await read('../src/layouts/BaseLayout.astro')
  const detail = await read('../src/pages/work/[slug].astro')

  const groupDuration = layout.match(/animation-duration: (\d+)ms/)?.[1]
  const morphDuration = detail.match(/fade\(\{ duration: (\d+) \}\)/)?.[1]

  assert.equal(groupDuration, '300', 'the site-wide view transition is 300ms')
  assert.equal(morphDuration, '300', 'the /work card morph is 300ms')
  assert.equal(groupDuration, morphDuration)
})

test('the one easing curve is not forked', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')
  const curves = new Set(
    [...layout.matchAll(/cubic-bezier\(([^)]*)\)/g)].map(([, args]) =>
      args.replace(/\s+/g, '')
    )
  )

  assert.deepEqual(
    [...curves],
    ['0.16,1,0.3,1'],
    'the site has one easing curve; a second one in the layout is a fork'
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/view-transitions.test.mjs`

Expected: FAIL on the first test with `'480' != '300'`.

- [ ] **Step 3: Change both durations**

In `src/layouts/BaseLayout.astro`, inside the `<style is:global>` block, change:

```css
    animation-duration: 480ms;
```

to:

```css
    animation-duration: 300ms;
```

In `src/pages/work/[slug].astro`, change:

```ts
const morph = fade({ duration: 480 })
```

to:

```ts
const morph = fade({ duration: 300 })
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/view-transitions.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 5: Verify the forward morph in the browser**

Run: `npm run dev`, open `/work`, and click into a project.

Check:
- The card's title and image morph into the detail page's title and first image; they do not cross-fade in place.
- Do this on the video card too. Its title morphs; its video does not, and playback must not stop.
- Open DevTools, Animations panel, set 25% speed, and repeat: the old page should be gone at roughly the moment the morph lands, not before it.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/BaseLayout.astro "src/pages/work/[slug].astro" tests/view-transitions.test.mjs
git commit -m "feat(work): tighten the page transition to 300ms"
```

---

## Task 3: Give back navigation its own choreography

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/view-transitions.test.mjs:1` (extend the file created in Task 2)

**Interfaces:**
- Consumes: the 300ms duration and the `<style is:global>` block from Task 2.
- Produces: a `data-nav-direction` attribute on `<html>`, written on every client-side navigation, whose value is Astro's `direction` (`'forward'` or `'back'`).

- [ ] **Step 1: Write the failing test**

Append to `tests/view-transitions.test.mjs`:

```js
test('the layout records which way the visitor is going', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')

  assert.match(
    layout,
    /astro:before-preparation/,
    'the attribute has to land before startViewTransition, which is what this event is awaited for'
  )
  assert.match(
    layout,
    /dataset\.navDirection = /,
    'the direction is read back from CSS, so it lives on the document element'
  )
  assert.match(
    layout,
    /__avpNavDirectionHooked/,
    'the swap re-runs inline scripts; the listener must only be added once'
  )
})

test('back reverses the direction instead of cross-fading', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')

  assert.match(
    layout,
    /\[data-nav-direction='back'\]::view-transition-old\(root\)/,
    'the outgoing page needs its own rule, scoped by an attribute so it beats the (*) default'
  )
  assert.match(
    layout,
    /\[data-nav-direction='back'\]::view-transition-new\(root\)/
  )

  const out = layout.match(
    /\[data-nav-direction='back'\]::view-transition-old\(root\)\s*\{([^}]*)\}/
  )[1]
  const into = layout.match(
    /\[data-nav-direction='back'\]::view-transition-new\(root\)\s*\{([^}]*)\}/
  )[1]

  assert.match(out, /200ms/, 'the outgoing page leaves faster than the new one arrives')
  assert.match(into, /300ms/)
  assert.doesNotMatch(
    out,
    /ease-in\b/,
    'ease-in delays the exact frames the visitor is watching'
  )
})

test('reduced motion still wins over the directional rules', async () => {
  const layout = await read('../src/layouts/BaseLayout.astro')
  const guard = layout.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n  \}/
  )

  assert.ok(guard, 'the layout has no reduced-motion block')
  assert.match(
    guard[1],
    /animation: none !important/,
    'only !important beats an attribute-scoped rule'
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/view-transitions.test.mjs`

Expected: FAIL on `the layout records which way the visitor is going`, with no match for `astro:before-preparation`.

- [ ] **Step 3: Record the direction**

In `src/layouts/BaseLayout.astro`, directly below the existing `is:inline` script that adds the `js` class in `<head>`, add:

```astro
    <!--
      CSS below picks the back animation off this attribute. It has to be set
      before `document.startViewTransition` runs, which `astro:before-preparation`
      guarantees: Astro awaits that event before starting the transition. Inline
      and guarded because the swap re-runs inline scripts against a document
      that already has the listener.
    -->
    <script is:inline>
      if (!window.__avpNavDirectionHooked) {
        window.__avpNavDirectionHooked = true
        document.addEventListener('astro:before-preparation', (event) => {
          document.documentElement.dataset.navDirection = event.direction
        })
      }
    </script>
```

- [ ] **Step 4: Add the back-direction rules**

In the same file's `<style is:global>` block, immediately after the
`::view-transition-group(*)` rule and **before** the
`@media (prefers-reduced-motion: reduce)` block, add:

```css
  /*
   * Back is not the forward morph played backwards. The incoming /work
   * document is snapshotted before the card stack hydrates and pins, so a
   * morph would animate toward the un-pinned list geometry (see the comment
   * in WorkCardStack.tsx). This gets the feeling of reversal without it.
   *
   * Scoped by attribute so it outranks the (*) rule above regardless of source
   * order, and targeted at `root` so the named card groups are untouched.
   *
   * The outgoing page runs 100ms shorter than the incoming one on purpose:
   * matched durations leave both pages half-transparent through the middle of
   * the swap, which reads as a smear rather than a reversal.
   */
  html[data-nav-direction='back']::view-transition-old(root) {
    animation: avp-back-out 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  html[data-nav-direction='back']::view-transition-new(root) {
    animation: avp-back-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes avp-back-out {
    to {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  @keyframes avp-back-in {
    from {
      opacity: 0;
      transform: translateY(-12px);
    }
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/view-transitions.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 6: Verify both directions in the browser**

Run: `npm run dev`.

Check:
- `/work` → a project: the card still morphs. `<html>` carries `data-nav-direction="forward"`.
- Browser back: `<html>` flips to `data-nav-direction="back"`, the detail page sinks and fades while `/work` settles down into place. Nothing morphs.
- The in-page "back to work" link on the detail page is a forward navigation and will cross-fade, not reverse. That is correct and expected; only browser/gesture back reverses.
- Set the OS to reduce motion and repeat: both directions swap instantly, with no movement.
- Run it at 25% in the Animations panel and confirm the two pages are never both at half opacity for long.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/BaseLayout.astro tests/view-transitions.test.mjs
git commit -m "feat(work): reverse the transition on back navigation"
```

---

## Task 4: Add Svelte and the Focus icon wrapper

**Files:**
- Modify: `package.json`, `astro.config.mjs`
- Create: `src/components/focus/FocusIcon.svelte`
- Test: `tests/focus-icons.test.mjs` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `src/components/focus/FocusIcon.svelte`, default export, props `{ icon: 'layout-panel-left' | 'route' | 'cpu', delay?: number }`, `delay` in milliseconds, default `0`. Renders a `<span class="focus-icon" aria-hidden="true">`. Task 5 imports it and passes `icon` and `delay`.

**Reference — the upstream contract, already verified against `@jis3r/icons@2.9.0`:**
- Each icon accepts `color` (default `'currentColor'`), `size` (default `24`), `strokeWidth` (default `2`), `animate` (default `false`), `class`.
- Setting `animate` true adds an `.animate` class that starts the CSS keyframes. Setting it back to false removes the class and returns the glyph to its resting state, which for all three chosen icons is fully visible.
- Upstream's own hover handler early-returns while `animate` is true, so `animate` must be released after the run or hover replay never fires again.
- Subpath import specifiers resolve through the package's `"./icons/*"` export condition: `@jis3r/icons/icons/route` → `dist/icons/route.svelte`.

- [ ] **Step 1: Install the dependencies**

```bash
npm install svelte@^5.1.16 @astrojs/svelte@^6.0.2 @jis3r/icons@^2.9.0
```

`@astrojs/svelte@6.0.2` declares peer dependencies `astro ^4.0.0`, `svelte ^5.1.16`, `typescript ^5.3.3`. Do **not** install `@astrojs/svelte@9`; it requires Astro 7.

- [ ] **Step 2: Register the integration**

Rewrite `astro.config.mjs` to:

```js
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import svelte from '@astrojs/svelte'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://avp.software',
  output: 'static',
  // Svelte earns its place on /about only: @jis3r/icons is a Svelte package,
  // and Astro code-splits island runtimes per page, so no other route pays for
  // it. Every other island on the site stays React.
  integrations: [react(), svelte(), tailwind()],
})
```

- [ ] **Step 3: Write the failing test**

Create `tests/focus-icons.test.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

test('the icon never reaches a screen reader', async () => {
  // Upstream renders <div role="img" aria-label="route">, so a reader would
  // announce "route, Process automations". aria-hidden on our own wrapper
  // hides that whole subtree; the row's text is the accessible name.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.match(source, /aria-hidden="true"/)
  assert.match(
    source,
    /class="focus-icon"/,
    'global.css hangs the reduced-motion neutraliser off this class'
  )
})

test('a visitor who asked for less motion gets none of it', async () => {
  // No file in @jis3r/icons@2.9.0 references prefers-reduced-motion, so the
  // guard is entirely ours: never start the animation here, and neutralise
  // the upstream keyframes in global.css.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(
    source,
    /matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/
  )
})

test('the run is released so hover can replay it', async () => {
  // Upstream's mouseenter handler early-returns while `animate` is true.
  // Holding it true forever would animate once and then go permanently inert.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.match(source, /animate = true/)
  assert.match(source, /animate = false/)
})

test('only the three chosen icons are pulled in', async () => {
  // A barrel import of @jis3r/icons would put 555 components in the graph and
  // lean on tree-shaking to take them back out.
  const source = await read('../src/components/focus/FocusIcon.svelte')

  assert.doesNotMatch(
    source,
    /from '@jis3r\/icons'/,
    'import the subpaths, not the barrel'
  )
  for (const icon of ['layout-panel-left', 'route', 'cpu']) {
    assert.match(source, new RegExp(`@jis3r/icons/icons/${icon}`))
  }
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `node --test tests/focus-icons.test.mjs`

Expected: FAIL — all four cases error, because `src/components/focus/FocusIcon.svelte` does not exist.

- [ ] **Step 5: Write the component**

Create `src/components/focus/FocusIcon.svelte`:

```svelte
<script>
  import LayoutPanelLeft from '@jis3r/icons/icons/layout-panel-left'
  import Route from '@jis3r/icons/icons/route'
  import Cpu from '@jis3r/icons/icons/cpu'

  // Named subpaths rather than the barrel: the package ships 555 components
  // and importing the index puts all of them in the graph.
  const ICONS = {
    'layout-panel-left': LayoutPanelLeft,
    route: Route,
    cpu: Cpu,
  }

  // The longest of the three runs is cpu's two-beat pulse at 1.0s. Release a
  // little after that: upstream's own mouseenter handler early-returns while
  // `animate` is true, so holding it would animate once and then never again.
  const RUN_MS = 1100

  let { icon, delay = 0 } = $props()

  const Glyph = ICONS[icon]

  let animate = $state(false)

  // client:visible hydrates this island when it enters the viewport, so mount
  // already means "in view". No second observer is needed, and the stagger is
  // a prop rather than shared state between the three islands.
  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const start = setTimeout(() => {
      animate = true
    }, delay)
    const end = setTimeout(() => {
      animate = false
    }, delay + RUN_MS)

    return () => {
      clearTimeout(start)
      clearTimeout(end)
    }
  })
</script>

<span class="focus-icon" aria-hidden="true">
  <Glyph {animate} size={20} strokeWidth={1.5} />
</span>

<style>
  .focus-icon {
    display: inline-flex;
    align-items: center;
    color: var(--color-muted);
  }

  /* The other half of the reduced-motion guard — the one that stops a hover
     starting a run — is in global.css, because it has to reach inside the
     upstream component's own scoped styles. Task 5 adds it. */
</style>
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test tests/focus-icons.test.mjs`

Expected: PASS, all four.

- [ ] **Step 7: Verify the build accepts two framework integrations**

Run: `npm run build`

Expected: exit 0. `dist/` is produced. The component is not referenced by any page yet, so nothing about the output should change beyond the config.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/components/focus/FocusIcon.svelte tests/focus-icons.test.mjs
git commit -m "feat(about): add the Svelte island that wraps a jis3r icon"
```

---

## Task 5: Wire the icons into the About Focus list

**Files:**
- Modify: `src/pages/about.astro`, `src/styles/global.css`
- Test: `tests/focus-icons.test.mjs:1` (extend the file created in Task 4)

**Interfaces:**
- Consumes: `FocusIcon.svelte` from Task 4, with props `icon` and `delay`.
- Produces: the finished Focus list. Nothing depends on it.

**Constraint that will bite you:** `tests/payload-hygiene.test.mjs:193-207` asserts that `src/pages/about.astro` contains exactly one `>Focus<` and exactly **three literal `<li>`** occurrences, matched with `/<li>/g`. Adding an attribute to the `<li>` breaks it. Keep the `<li>` bare and hang the styling off `.about-focus li`, which is how the file already works.

- [ ] **Step 1: Write the failing test**

Append to `tests/focus-icons.test.mjs`:

```js
test('the three focus rows carry their icons in reading order', async () => {
  const source = await read('../src/pages/about.astro')

  assert.match(
    source,
    /import FocusIcon from '\.\.\/components\/focus\/FocusIcon\.svelte'/
  )

  const rows = [...source.matchAll(/icon="([^"]+)"\s+delay=\{(\d+)\}/g)].map(
    ([, icon, delay]) => [icon, Number(delay)]
  )

  assert.deepEqual(rows, [
    ['layout-panel-left', 0],
    ['route', 80],
    ['cpu', 160],
  ])
})

test('the runtime is not fetched by a visitor who never scrolls that far', async () => {
  const source = await read('../src/pages/about.astro')

  const directives = [...source.matchAll(/client:(\w+)/g)].map(([, d]) => d)

  assert.deepEqual(
    directives,
    ['visible', 'visible', 'visible'],
    'client:visible is also what makes "in view" true at mount, which is the reveal trigger'
  )
})

test('the focus list still names its category once, in three bare rows', async () => {
  // payload-hygiene.test.mjs counts these exactly. Restating it here so the
  // reason a bare <li> matters is next to the markup that has to keep it.
  const source = await read('../src/pages/about.astro')
  const markup = source.split('<style>')[0]

  assert.equal((markup.match(/>Focus</g) ?? []).length, 1)
  assert.equal((markup.match(/<li>/g) ?? []).length, 3)
})

test('the icon column does not squeeze the labels on a phone', async () => {
  const source = await read('../src/pages/about.astro')
  const row = source.match(/\.about-focus li \{([^}]*)\}/)

  assert.ok(row, 'about.astro has no .about-focus li rule')
  assert.match(
    row[1],
    /grid-template-columns: auto 1fr/,
    'an auto icon column plus a fluid text column, so the label takes the slack'
  )
})

test('a hover cannot start a run that reduced motion asked not to happen', async () => {
  // The script guard in FocusIcon only covers the reveal. The upstream
  // component starts its own run on mouseenter, inside styles this project
  // cannot edit, so the neutraliser has to be global and !important.
  const css = await read('../src/styles/global.css')
  const guard = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/
  )

  assert.ok(guard, 'global.css has no reduced-motion block')
  assert.match(guard[1], /\.focus-icon \*/)
  assert.match(guard[1], /animation: none !important/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/focus-icons.test.mjs`

Expected: FAIL on `the three focus rows carry their icons in reading order`, with no match for the import.

- [ ] **Step 3: Add the icons to the markup**

In `src/pages/about.astro`, add to the frontmatter imports:

```astro
import FocusIcon from '../components/focus/FocusIcon.svelte'
```

Replace the `.about-focus` block's `<ul>` with:

```astro
      <ul>
        <li>
          <FocusIcon icon="layout-panel-left" delay={0} client:visible />
          Web platforms
        </li>
        <li>
          <FocusIcon icon="route" delay={80} client:visible />
          Process automations
        </li>
        <li>
          <FocusIcon icon="cpu" delay={160} client:visible />
          AI-assisted products
        </li>
      </ul>
```

The `<li>` stays bare on purpose. See the constraint above.

- [ ] **Step 4: Lay out the row**

The `<li>` elements are `about.astro`'s own markup, so its scoped `<style>` block still reaches them. Only the `.focus-icon` wrapper is inside the island and needs a global rule.

In `src/pages/about.astro`'s `<style>` block, replace the existing `.about-focus li` rule with:

```css
  /*
   * The icon sits in its own column so a long label wraps against the text
   * column rather than under the glyph. `auto` rather than a fixed width: the
   * icon is 20px today and the column should follow it if that changes.
   */
  .about-focus li {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-ink);
  }
```

Then append to `src/styles/global.css`:

```css
/*
 * @jis3r/icons ships no prefers-reduced-motion handling in any of its 555
 * components, and its keyframes live in styles this project does not own.
 * FocusIcon's script guard stops the scroll reveal; this stops the run a
 * hover would start. Global and !important because it has to reach inside a
 * scoped Svelte component.
 */
@media (prefers-reduced-motion: reduce) {
  .focus-icon *,
  .focus-icon *::before,
  .focus-icon *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`

Expected: PASS, including `tests/payload-hygiene.test.mjs`.

- [ ] **Step 6: Verify the build and the page**

Run: `npm run build && npm run preview`

Check on `/about`:
- The three icons render in `--color-muted`, one per row, vertically centred against their labels.
- Scrolling the Focus list into view fires them in sequence, roughly 80ms apart, top to bottom. They finish visible, not blank.
- Hovering an icon on a desktop pointer replays it.
- At 320px the labels do not wrap under the icons.
- With the OS set to reduce motion, reload: all three render statically, and hover does nothing.

Then check that the runtime is scoped:
- Open `/` and `/work` with the Network panel filtered to JS. No Svelte chunk is requested.
- Open `/about` without scrolling to the Focus list. Still no Svelte chunk.
- Scroll down. The chunk loads then.

- [ ] **Step 7: Commit**

```bash
git add src/pages/about.astro src/styles/global.css tests/focus-icons.test.mjs
git commit -m "feat(about): give the focus list animated icons"
```

---

## Final verification

- [ ] **Run the full suite**

Run: `npm test`
Expected: every test passes, in both runners.

- [ ] **Build clean**

Run: `npm run build`
Expected: exit 0, no warnings about the Svelte integration.

- [ ] **Walk the site once at 390px and once at 1440px**

- Nav pill opens and closes at both widths, with no empty gap where the chevron was.
- `/work` → project → browser back reads as forward-then-reverse, not two identical fades.
- `/about` Focus icons stagger in on scroll.
- Repeat the whole walk with reduced motion on. Nothing moves; everything is legible and reachable.

## Out of scope

Do not touch, in any task: the hero's scroll cue arrow on the home page, the `/work` card stack's scroll hint arrow, the FAQ, the process section, the big-type section, the forward morph's mechanism, or icons anywhere but the About Focus list.
