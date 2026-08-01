# Work Card Stack Unified Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the adapted Skiper17 pinned card-stack animation on every JavaScript-capable viewport, including mobile and reduced-motion contexts, while retaining the static no-JavaScript list.

**Architecture:** `WorkCardStack` server-renders list markup, then unconditionally enables the scoped `StickyCard002` primitive after hydration. `StickyCard002` continues to own GSAP, ScrollTrigger, interactivity, and cleanup, but derives pin geometry from a stable viewport-sized scene and native document scrolling rather than a page-specific Lenis controller.

**Tech Stack:** Astro 4, React 18, TypeScript, Tailwind CSS 3, GSAP ScrollTrigger, `@gsap/react`, Vitest, Node test runner, Playwright browser verification

## Global Constraints

- Design authority: `docs/superpowers/specs/2026-08-01-work-card-stack-unified-motion-design.md`.
- Every JavaScript-capable viewport receives the Skiper17 stack animation.
- Mobile, touch, and reduced-motion contexts use the same scroll progression and video behavior as desktop.
- Do not branch on viewport width or `prefers-reduced-motion` for the work stack.
- Without JavaScript, preserve the server-rendered vertical list of ordinary links.
- Keep `WorkProjectCard` as the only renderer of link, media, title, and focus treatment.
- Keep native document scrolling authoritative; do not mount Lenis for the work page.
- Scope GSAP and cleanup to this component; never kill unrelated ScrollTriggers.
- Keep `/work/[slug]`, project data, other page motion, and global navigation unchanged.
- Preserve Skiper UI attribution and the single npm lockfile.

---

## File Structure

- Modify `src/components/WorkCardStack.tsx`: unconditional post-hydration enhancement and uniform video playback.
- Modify `src/pages/work/index.astro`: remove the reduced-motion-only reveal override.
- Modify `src/components/ui/skiper-ui/skiper17.tsx`: stable responsive scene geometry and measured scroll distance.
- Delete `src/components/work-card-stack/work-stack-policy.ts`: obsolete responsive/motion branch.
- Delete `src/components/work-card-stack/smooth-scroll.ts`: page-specific Lenis control.
- Modify `tests/work-card-stack.test.mjs`: unconditional enhancement and native-scroll contracts.
- Delete `tests/work-card-stack/work-stack-policy.test.ts`: superseded policy tests.
- Modify `tests/work-card-stack/skiper17-frame-style.test.ts`: responsive frame and scroll-distance tests.

---

### Task 1: Unconditional client enhancement

**Files:**
- Modify: `tests/work-card-stack.test.mjs`
- Delete: `tests/work-card-stack/work-stack-policy.test.ts`
- Modify: `src/components/WorkCardStack.tsx`
- Modify: `src/pages/work/index.astro`
- Delete: `src/components/work-card-stack/work-stack-policy.ts`
- Delete: `src/components/work-card-stack/smooth-scroll.ts`

**Interfaces:**
- Consumes: `StickyCard002({ cards, enabled, renderCard })` and `WorkProjectCard({ card, eager, videoRef })`.
- Produces: `WorkCardStack({ cards }: { cards: WorkCard[] })`, with `enabled === true` after the first client effect on every viewport.

- [ ] **Step 1: Write the failing unified-enhancement contracts**

Delete the Node test named `work stack drives Lenis from the GSAP ticker only while pinned`. Replace `work stack progressively enhances motion and video` with:

```js
test('work stack enhances identically on every client context', async () => {
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )
  const card = await readFile(
    new URL('../src/components/work-card-stack/WorkProjectCard.tsx', import.meta.url),
    'utf8',
  )
  const page = await readFile(
    new URL('../src/pages/work/index.astro', import.meta.url),
    'utf8',
  )

  assert.match(stack, /const \[enhanced, setEnhanced\] = useState\(false\)/)
  assert.match(stack, /setEnhanced\(true\)/)
  assert.match(stack, /enabled=\{enhanced\}/)
  assert.match(stack, /video\.play\(\)\.catch/)
  assert.doesNotMatch(stack, /matchMedia|innerWidth|workStackMode/)
  assert.doesNotMatch(stack, /startSmoothScroll|prefers-reduced-motion/)
  assert.doesNotMatch(stack, /video\.currentTime\s*=\s*0/)
  assert.doesNotMatch(page, /prefers-reduced-motion/)
  assert.match(card, /videoRef/)
})

test('work page does not install a page-specific smooth scroller', async () => {
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )
  const skiper = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper17.tsx', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(stack, /Lenis|startSmoothScroll/)
  assert.doesNotMatch(skiper, /Lenis|ReactLenis|lenis\/react/)
})
```

Delete `tests/work-card-stack/work-stack-policy.test.ts`; its expected list behavior contradicts the approved requirement.

In `work stack stays unpainted until it resolves its layout mode`, replace:

```js
assert.match(stack, /useState<WorkStackMode>\(['"]list['"]\)/)
```

with:

```js
assert.match(stack, /useState\(false\)/)
```

- [ ] **Step 2: Verify the new contract fails**

Run `node --test tests/work-card-stack.test.mjs`.

Expected: FAIL because `WorkCardStack` still imports `workStackMode` and `startSmoothScroll`, reads `matchMedia` and `innerWidth`, and does not define `enhanced`.

- [ ] **Step 3: Implement unconditional hydration enhancement**

Replace `src/components/WorkCardStack.tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react'
import WorkProjectCard from './work-card-stack/WorkProjectCard'
import type { WorkCard } from './work-card-stack/work-card-model'
import { StickyCard002 } from './ui/skiper-ui/skiper17'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  const [enhanced, setEnhanced] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => setEnhanced(true), [])

  useEffect(() => {
    if (!enhanced) return
    const video = videoRef.current
    if (!video) return

    video.play().catch(() => video.pause())
  }, [enhanced])

  if (cards.length === 0) return null

  return (
    <section
      className="work-stack"
      aria-label="Selected work"
      data-work-stack-ready={enhanced ? '' : undefined}
    >
      <StickyCard002
        cards={cards}
        enabled={enhanced}
        renderCard={(card, index) => (
          <WorkProjectCard
            card={card}
            eager={index === 0}
            videoRef={card.media.kind === 'video' ? videoRef : undefined}
          />
        )}
      />
    </section>
  )
}
```

Delete `src/components/work-card-stack/work-stack-policy.ts` and `src/components/work-card-stack/smooth-scroll.ts`.

Remove this entire block from `src/pages/work/index.astro` so reduced-motion
contexts receive the same ready-state reveal as every other context:

```css
@media (prefers-reduced-motion: reduce) {
  html.js .work-stack {
    transition: none;
  }
}
```

- [ ] **Step 4: Verify focused and full tests pass**

Run:

```bash
node --test tests/work-card-stack.test.mjs
npm test
```

Expected: the focused contract passes; the full suite passes with the obsolete policy test absent.

- [ ] **Step 5: Commit unconditional enhancement**

```bash
git add src/components/WorkCardStack.tsx \
  src/pages/work/index.astro \
  src/components/work-card-stack/work-stack-policy.ts \
  src/components/work-card-stack/smooth-scroll.ts \
  tests/work-card-stack.test.mjs \
  tests/work-card-stack/work-stack-policy.test.ts
git commit -m "fix: enable work card stack on every device"
```

---

### Task 2: Stable responsive pin geometry

**Files:**
- Modify: `tests/work-card-stack/skiper17-frame-style.test.ts`
- Modify: `tests/work-card-stack.test.mjs`
- Modify: `src/components/ui/skiper-ui/skiper17.tsx`

**Interfaces:**
- Produces: `getStackFrameStyle(enabled: boolean): { width: string } | undefined`.
- Produces: `getStackScrollDistance(sceneHeight: number, cardCount: number): number`.
- Consumed by: `StickyCard002` ScrollTrigger `end` callback.

- [ ] **Step 1: Write failing geometry tests**

Replace `tests/work-card-stack/skiper17-frame-style.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  getStackFrameStyle,
  getStackScrollDistance,
} from '../../src/components/ui/skiper-ui/skiper17'

describe('Skiper17 responsive stack geometry', () => {
  it('constrains the 4:3 frame with a stable viewport unit', () => {
    expect(getStackFrameStyle(true)).toEqual({
      width: 'min(64rem, 100%, calc((100svh - 8rem) * 4 / 3))',
    })
  })

  it('returns no frame override before client enhancement', () => {
    expect(getStackFrameStyle(false)).toBeUndefined()
  })

  it('uses one measured scene height per card transition', () => {
    expect(getStackScrollDistance(844, 3)).toBe(1688)
    expect(getStackScrollDistance(900, 3)).toBe(1800)
    expect(getStackScrollDistance(900, 1)).toBe(0)
    expect(getStackScrollDistance(-1, 3)).toBe(0)
  })
})
```

In `pinned stack clips its cards and owns the full viewport`, replace `assert.match(skiper, /pt-28/)` with:

```js
assert.match(skiper, /h-svh/)
assert.match(skiper, /px-5/)
assert.match(skiper, /sm:px-10/)
assert.match(skiper, /getStackScrollDistance\([\s\S]*stack\.current\?\.clientHeight/)
```

- [ ] **Step 2: Verify geometry tests fail**

Run:

```bash
npx vitest run tests/work-card-stack/skiper17-frame-style.test.ts
node --test tests/work-card-stack.test.mjs
```

Expected: FAIL because the width uses `100dvh`, the helper does not exist, and the scene uses `h-dvh px-10`.

- [ ] **Step 3: Implement stable geometry**

Replace `getStackFrameStyle` and add:

```ts
export function getStackFrameStyle(enabled: boolean) {
  return enabled
    ? { width: 'min(64rem, 100%, calc((100svh - 8rem) * 4 / 3))' }
    : undefined
}

export function getStackScrollDistance(
  sceneHeight: number,
  cardCount: number,
) {
  return Math.max(0, sceneHeight) * Math.max(0, cardCount - 1)
}
```

Replace ScrollTrigger's `end` with:

```ts
end: () =>
  `+=${getStackScrollDistance(
    stack.current?.clientHeight ?? 0,
    cardElements.length,
  )}`,
```

Replace enabled scene classes with:

```tsx
"relative flex h-svh w-full items-center justify-center overflow-hidden px-5 py-16 sm:px-10 sm:py-20"
```

Keep list-mode classes unchanged for server rendering and no JavaScript.

- [ ] **Step 4: Verify geometry, full suite, and production build**

Run:

```bash
npx vitest run tests/work-card-stack/skiper17-frame-style.test.ts
node --test tests/work-card-stack.test.mjs
npm test
npm run build
```

Expected: all tests and all eight Astro routes build successfully.

- [ ] **Step 5: Commit stable geometry**

```bash
git add src/components/ui/skiper-ui/skiper17.tsx \
  tests/work-card-stack.test.mjs \
  tests/work-card-stack/skiper17-frame-style.test.ts
git commit -m "fix: stabilize work stack across viewport sizes"
```

---

### Task 3: Cross-device production-browser verification

**Files:**
- Verify: `src/pages/work/index.astro`
- Verify: `src/pages/work/[slug].astro`
- Verify: `src/components/WorkCardStack.tsx`
- Verify: `src/components/ui/skiper-ui/skiper17.tsx`

**Interfaces:**
- Consumes: `[data-work-stack-mode="stack"]`, `[data-work-card-active]`, and project anchors.
- Produces: browser evidence only; no repository file.

- [ ] **Step 1: Build the production output**

Run `npm run build`.

Expected: eight pages build, including `/work/` and all three project routes.

- [ ] **Step 2: Verify all required browser contexts**

Use Playwright with the webapp-testing server helper. Test 1440×900 desktop, 768×1024 tablet, 390×844 touch mobile, 1440×900 reduced motion, and 390×844 touch mobile with reduced motion. In every context execute:

```js
await page.goto('http://127.0.0.1:4321/work/', { waitUntil: 'networkidle' })
await page.locator('[data-work-stack-mode="stack"]').waitFor()

const links = page.locator('a[href^="/work/"]')
if ((await links.count()) !== 3) throw new Error('expected three project links')

const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
await page.evaluate((height) => window.scrollTo(0, height * 0.55), scrollHeight)
await page.waitForTimeout(800)
if ((await page.locator('[data-work-card-active]').count()) !== 1) {
  throw new Error('expected exactly one active card')
}

await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await page.waitForTimeout(800)
const amber = page.locator('a[href="/work/amber"]')
if (!(await amber.isVisible())) throw new Error('Amber did not finish visible')

const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)
if (overflow !== 0) throw new Error(`horizontal overflow: ${overflow}px`)
```

Capture initial, middle, and end screenshots for desktop and mobile. Require collected `console` errors and `pageerror` events to be empty. Run via:

```bash
python3 .agents/skills/webapp-testing/scripts/with_server.py \
  --server "npm run preview -- --host 127.0.0.1" \
  --port 4321 \
  -- node /tmp/avp-work-stack-verify.mjs
```

Expected: every context animates through three cards, Amber finishes active, the frame stays pinned, and logs show no runtime errors or overflow.

- [ ] **Step 3: Verify keyboard and link navigation**

At scroll start, Tab to `/work/volunteer-platform`, press Enter, and require `/work/volunteer-platform`. Return to `/work`, scroll to the end, click Amber, and require `/work/amber`. Tap the active middle card in the mobile context and require its normal route.

Expected: inactive wrappers remain inert; active links work with keyboard, pointer, and touch without click interception.

- [ ] **Step 4: Run final verification and inspect the worktree**

Run:

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected: tests and build pass, `git diff --check` is silent, and status contains only intended work-card changes.
