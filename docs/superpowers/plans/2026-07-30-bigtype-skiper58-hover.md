# Big Type Skiper58 Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Skiper58's staggered character-roll hover to `DESIGN BUILD` and `AUTOMATE RUN` without changing their equal-and-opposite scroll motion.

**Architecture:** The shadcn registry supplies the React `TextRoll` primitive. A focused `BigTypeRoll` React island renders both lines; an outer transform wrapper remains owned by the existing requestAnimationFrame-throttled Astro scroll controller, while Skiper58 owns only inner character animation. Reduced-motion handling disables the hover animation, and server-rendered markup keeps the decorative band present before hydration.

**Tech Stack:** Astro 4, React 18, Framer Motion 11, Tailwind CSS 3, Skiper UI shadcn registry, Node test runner, Playwright browser verification

## Global Constraints

- Preserve the exact visible copy `DESIGN BUILD` and `AUTOMATE RUN`.
- `DESIGN BUILD` moves right and `AUTOMATE RUN` moves left by equal amounts while scrolling down.
- Hover rolls only the line under the pointer; it does not track pointer position, tilt text, or alter scroll state.
- Keep the big-type band decorative with `aria-hidden="true"`.
- Keep character rolling available on fine-pointer desktops under
  `prefers-reduced-motion: reduce`.
- Keep the current Bodoni display face, ink color, responsive type scale, spacing, and overflow clipping.
- Preserve Skiper UI's generated provenance/attribution comments.
- Do not change the hero workflow, Process, FAQ, page copy, or global scroll behavior.

---

## File Structure

- Create `components.json`: shadcn registry configuration for the existing Astro/Tailwind project.
- Modify `tsconfig.json`: add the `@/*` alias required by generated shadcn source.
- Create `src/components/ui/skiper-ui/skiper58.tsx`: registry-provided `TextRoll` with its native hover behavior retained.
- Create `src/components/BigTypeRoll.tsx`: one React island that renders both scrolling line shells and two independent `TextRoll` instances.
- Modify `src/pages/index.astro`: mount the island, direct scroll transforms to dedicated wrappers, and expose scoped big-type styles globally to React-rendered markup.
- Modify `tests/bigtype-motion.test.mjs`: retain direction/parity coverage and add integration-source assertions.
- Modify `package.json`: ensure the Node big-type regression runs before Vitest on `npm test`.
- Modify `package-lock.json`: record any dependency metadata changed by the registry command.

---

### Task 1: Registry component and integration contract

**Files:**
- Create: `components.json`
- Modify: `tsconfig.json`
- Create: `src/components/ui/skiper-ui/skiper58.tsx`
- Create: `src/components/BigTypeRoll.tsx`
- Modify: `tests/bigtype-motion.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `TextRoll({ children, className?, center? })` from the Skiper58 registry.
- Produces: `BigTypeRoll(): JSX.Element`, `.bigtype-line[data-speed]`, and `[data-bigtype-shift]` for the page controller.

- [ ] **Step 1: Add the failing integration contract**

Append to `tests/bigtype-motion.test.mjs`:

```js
import { readFile } from 'node:fs/promises'

test('big type composes scroll wrappers with independent Skiper58 rolls', async () => {
  const component = await readFile(
    new URL('../src/components/BigTypeRoll.tsx', import.meta.url),
    'utf8'
  )
  const page = await readFile(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  )

  assert.match(component, /from ['"].*skiper58['"]/)
  assert.match(component, /data-speed="-0\.35"/)
  assert.match(component, /data-speed="0\.35"/)
  assert.equal((component.match(/data-bigtype-shift/g) || []).length, 2)
  assert.match(component, />DESIGN BUILD<\/TextRoll>/)
  assert.match(component, />\s*AUTOMATE RUN\s*<\/TextRoll>/)
  assert.match(page, /<BigTypeRoll client:visible \/>/)
  assert.match(page, /querySelector<HTMLElement>\('\\[data-bigtype-shift\\]'\)/)
})

test('Skiper58 keeps hover animation enabled for reduced-motion desktops', async () => {
  const source = await readFile(
    new URL(
      '../src/components/ui/skiper-ui/skiper58.tsx',
      import.meta.url
    ),
    'utf8'
  )

  assert.doesNotMatch(source, /useReducedMotion/)
  assert.match(source, /whileHover=['"]hovered['"]/)
})
```

Change `package.json`:

```json
"test": "node --test tests/bigtype-motion.test.mjs && vitest run --exclude='**/.worktrees/**' --exclude='**/bigtype-motion.test.mjs'"
```

- [ ] **Step 2: Run the contract to verify it fails**

Run:

```bash
npm test
```

Expected: the existing direction/parity test passes, then the integration test fails with `ENOENT` for `src/components/BigTypeRoll.tsx`.

- [ ] **Step 3: Configure shadcn and install the requested registry component**

Add the source alias to `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Create `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.cjs",
    "css": "src/styles/global.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Run the exact requested command:

```bash
pnpm dlx shadcn add @skiper-ui/skiper58
```

Expected: shadcn resolves the trusted Skiper UI registry and creates
`src/components/ui/skiper-ui/skiper58.tsx`. Framer Motion is already present,
so no duplicate animation dependency is introduced.

- [ ] **Step 4: Keep Skiper58 hover available under reduced motion**

In `src/components/ui/skiper-ui/skiper58.tsx`, preserve the generated source,
provenance comments, and native hover state without adding a reduced-motion
gate:

```tsx
return (
  <motion.div
    initial="initial"
    whileHover="hovered"
    className={className}
  >
    {/* Keep the registry-generated character markup and variants unchanged. */}
  </motion.div>
)
```

Keep the registry's character timing, layout, and public `children`,
`className`, and `center` props unchanged.

- [ ] **Step 5: Add the focused React island**

Create `src/components/BigTypeRoll.tsx`:

```tsx
import { TextRoll } from './ui/skiper-ui/skiper58'

export default function BigTypeRoll() {
  return (
    <>
      <div className="bigtype-line" data-speed="-0.35">
        <div className="bigtype-shift" data-bigtype-shift>
          <TextRoll className="bigtype-roll">DESIGN BUILD</TextRoll>
        </div>
      </div>
      <div className="bigtype-line" data-speed="0.35">
        <div className="bigtype-shift" data-bigtype-shift>
          <TextRoll className="bigtype-roll" center>
            AUTOMATE RUN
          </TextRoll>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 6: Run the focused test and inspect any registry-specific mismatch**

Run:

```bash
node --test tests/bigtype-motion.test.mjs
```

Expected: all three big-type tests pass.

- [ ] **Step 7: Commit the registry checkpoint**

```bash
git add components.json tsconfig.json package.json package-lock.json \
  src/components/ui/skiper-ui/skiper58.tsx src/components/BigTypeRoll.tsx \
  tests/bigtype-motion.test.mjs
git commit -m "feat: add Skiper58 big type roll"
```

Expected: one commit containing only shadcn configuration, the generated and
adapted component, the focused island, dependency metadata, and its contract.

---

### Task 2: Compose hover animation with scroll motion

**Files:**
- Modify: `src/pages/index.astro`
- Test: `tests/bigtype-motion.test.mjs`

**Interfaces:**
- Consumes: `BigTypeRoll(): JSX.Element`, `.bigtype-line[data-speed]`, and `[data-bigtype-shift]`.
- Produces: scroll-owned `--shift` on each dedicated wrapper, with Skiper58 free to animate descendant characters.

- [ ] **Step 1: Mount the island and keep the decorative shell**

Add this import to the frontmatter in `src/pages/index.astro`:

```astro
import BigTypeRoll from '../components/BigTypeRoll'
```

Replace the two static lines with:

```astro
<section class="bigtype" aria-hidden="true">
  <BigTypeRoll client:visible />
</section>
```

- [ ] **Step 2: Target the dedicated scroll wrapper**

In the big-type `update()` loop, replace:

```ts
const span = line.firstElementChild as HTMLElement
span.style.setProperty('--shift', `${shift}px`)
```

with:

```ts
const shiftTarget = line.querySelector<HTMLElement>('[data-bigtype-shift]')
shiftTarget?.style.setProperty('--shift', `${shift}px`)
```

This keeps the scroll transform on `.bigtype-shift` and leaves Skiper58's
character transforms independent.

- [ ] **Step 3: Adapt the scoped styles for React-rendered descendants**

Replace the existing big-type rules with:

```css
.bigtype {
  overflow: hidden;
  padding: clamp(3rem, 7vh, 5rem) 0;
  background: var(--color-bg);
}

:global(.bigtype-line) {
  display: flex;
  justify-content: center;
}

:global(.bigtype-shift) {
  transform: translateX(var(--shift, 0px));
  will-change: transform;
}

:global(.bigtype-roll) {
  font-family: var(--font-display);
  font-size: clamp(4.5rem, 16vw, 15rem);
  font-weight: 600;
  font-optical-sizing: none;
  line-height: 0.95;
  white-space: nowrap;
  color: var(--color-ink);
}
```

Do not apply `transform` to `.bigtype-roll` or its generated characters.

- [ ] **Step 4: Run focused and full automated verification**

Run:

```bash
node --test tests/bigtype-motion.test.mjs
npm test
npm run build
```

Expected: all big-type assertions pass, all Vitest suites pass, and Astro
finishes a static production build without React hydration or TypeScript
errors.

- [ ] **Step 5: Commit the composition**

```bash
git add src/pages/index.astro tests/bigtype-motion.test.mjs
git commit -m "feat: animate big type on hover"
```

Expected: one focused integration commit.

---

### Task 3: Browser verification and final polish

**Files:**
- Modify if evidence requires it: `src/components/BigTypeRoll.tsx`
- Modify if evidence requires it: `src/components/ui/skiper-ui/skiper58.tsx`
- Modify if evidence requires it: `src/pages/index.astro`
- Verify: `tests/bigtype-motion.test.mjs`

**Interfaces:**
- Consumes: the completed big-type island and scroll controller.
- Produces: visually verified desktop, mobile/touch-sized, and reduced-motion behavior with no overflow or console errors.

- [ ] **Step 1: Start the local site**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Astro reports a local URL and remains running for browser checks.

- [ ] **Step 2: Verify desktop scroll and hover**

At 1440 × 1000:

1. Scroll until the big-type band is centered.
2. Record each `[data-bigtype-shift]` computed transform.
3. Scroll down 180 px and confirm the top transform increases while the bottom
   transform decreases by the same magnitude.
4. Hover `DESIGN BUILD`; confirm only its characters roll vertically.
5. Hover `AUTOMATE RUN`; confirm only its characters roll vertically.
6. Confirm moving the pointer within a line does not add tilt or cursor-follow
   movement.

Expected: scroll and hover run concurrently without a transform snap, text
clip, layout shift, or horizontal page scrollbar.

- [ ] **Step 3: Verify mobile and reduced motion**

At 375 × 812, confirm both lines remain clipped by the band rather than
creating page-level horizontal overflow. Then emulate
`prefers-reduced-motion: reduce`, reload, and hover both lines.

Expected: the scroll-linked layout and character roll both remain available,
matching the existing big-type motion policy.

- [ ] **Step 4: Check console and production build**

Confirm the browser console has no hydration, React key, or motion warnings.
Then run:

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected: tests and build exit 0, `git diff --check` prints nothing, and status
lists only intentional task files plus pre-existing unrelated untracked files.

- [ ] **Step 5: Commit evidence-driven polish if needed**

If browser verification required code changes:

```bash
git add src/components/BigTypeRoll.tsx \
  src/components/ui/skiper-ui/skiper58.tsx src/pages/index.astro \
  tests/bigtype-motion.test.mjs
git commit -m "fix: polish big type roll interaction"
```

If no changes were required, do not create an empty commit.

- [ ] **Step 6: Put only this feature on `main` and push**

The current branch predates this request and is 16 commits ahead of `main`.
Do not merge those unrelated commits implicitly. Switch to `main`, cherry-pick
only the design, plan, and implementation commits created for this feature,
rerun `npm test` and `npm run build` on `main`, then push:

```bash
git switch main
git cherry-pick 0aa4699^..feat/tuesday-board-hero
npm test
npm run build
git push origin main
```

Expected: `origin/main` contains only the Skiper58 design/plan and implementation
commits from this request, with all checks passing on the exact pushed tree.
