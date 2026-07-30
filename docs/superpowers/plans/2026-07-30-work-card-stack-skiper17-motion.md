# Work Card Stack Skiper17 Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Progressively enhance the completed static `/work` cards with the adapted Skiper17 GSAP stack on layouts at least 768px wide while preserving static mobile, reduced-motion, and no-JavaScript behavior.

**Architecture:** The registry-provided `StickyCard002` is copied locally and narrowed into a generic motion/layout primitive that receives cards through a render callback. A pure policy function decides when the stack may animate. `WorkCardStack` hydrates on `/work`, controls volunteer-video playback, and delegates only desktop standard-motion positioning to Skiper17; the existing semantic card remains the single source of card markup.

**Tech Stack:** Astro 4, React 18, TypeScript, Tailwind CSS 3, GSAP ScrollTrigger, `@gsap/react`, Skiper UI registry source, Lenis as an upstream declared dependency but not a mounted scroll controller, Vitest, Node test runner

## Global Constraints

- Prerequisite: complete `docs/superpowers/plans/2026-07-30-work-card-stack-foundation.md` first.
- Design authority: `docs/superpowers/specs/2026-07-30-work-skiper17-card-stack-design.md`.
- Keep `src/pages/work/[slug].astro` unchanged.
- Keep the semantic `WorkProjectCard` as the only renderer for card links, media, and title.
- Enable pin/scale/rotation only at widths `>= 768px` and when `prefers-reduced-motion` is false.
- Below `768px`, under reduced motion, and without JavaScript, render the stable vertical list.
- Do not mount `ReactLenis`, create a root Lenis controller, or alter global scrolling.
- Scope GSAP selectors and lifecycle to the component instance.
- Never kill unrelated ScrollTriggers.
- Keep only the project title visibly present.
- Preserve Skiper UI's free-license attribution in the copied source.
- Keep one authoritative npm `package-lock.json`; do not add `pnpm-lock.yaml`.
- Do not alter unrelated untracked files already present in the worktree.

---

## File Structure

- Create `src/components/work-card-stack/work-stack-policy.ts`: pure breakpoint and reduced-motion policy.
- Create `tests/work-card-stack/work-stack-policy.test.ts`: exact policy boundary tests.
- Create `src/components/ui/skiper-ui/skiper17.tsx`: locally adapted generic sticky-stack primitive with scoped GSAP lifecycle.
- Modify `src/components/WorkCardStack.tsx`: hydrate policy, volunteer-video playback, and render through `StickyCard002`.
- Modify `src/components/work-card-stack/WorkProjectCard.tsx`: accept a video ref without duplicating markup.
- Modify `src/pages/work/index.astro`: hydrate the stack with `client:load`.
- Modify `tests/work-card-stack.test.mjs`: source-level lifecycle, fallback, video, and Astro integration contracts.
- Modify `package.json`: add registry dependencies.
- Modify `package-lock.json`: persist resolved dependency graph.

---

### Task 1: Explicit motion eligibility policy

**Files:**
- Create: `src/components/work-card-stack/work-stack-policy.ts`
- Create: `tests/work-card-stack/work-stack-policy.test.ts`

**Interfaces:**
- Produces: `workStackMode(width: number, reducedMotion: boolean): 'stack' | 'list'`.
- Consumed later by: `WorkCardStack`.

- [ ] **Step 1: Write the failing boundary tests**

Create `tests/work-card-stack/work-stack-policy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { workStackMode } from '../../src/components/work-card-stack/work-stack-policy'

describe('work stack motion policy', () => {
  it('uses the stable list below 768px', () => {
    expect(workStackMode(320, false)).toBe('list')
    expect(workStackMode(767, false)).toBe('list')
  })

  it('allows the stack at and above 768px', () => {
    expect(workStackMode(768, false)).toBe('stack')
    expect(workStackMode(1440, false)).toBe('stack')
  })

  it('always uses the stable list for reduced motion', () => {
    expect(workStackMode(768, true)).toBe('list')
    expect(workStackMode(1440, true)).toBe('list')
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run tests/work-card-stack/work-stack-policy.test.ts
```

Expected: FAIL because `work-stack-policy.ts` does not exist.

- [ ] **Step 3: Implement the policy**

Create `src/components/work-card-stack/work-stack-policy.ts`:

```ts
export type WorkStackMode = 'stack' | 'list'

export function workStackMode(
  width: number,
  reducedMotion: boolean,
): WorkStackMode {
  return width >= 768 && !reducedMotion ? 'stack' : 'list'
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npx vitest run tests/work-card-stack/work-stack-policy.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit the policy**

```bash
git add src/components/work-card-stack/work-stack-policy.ts \
  tests/work-card-stack/work-stack-policy.test.ts
git commit -m "test: define work stack motion policy"
```

---

### Task 2: Install and isolate the Skiper17 primitive

**Files:**
- Create: `src/components/ui/skiper-ui/skiper17.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tests/work-card-stack.test.mjs`

**Interfaces:**
- Consumes: `cards: T[]`, `renderCard(card: T, index: number): ReactNode`, and `enabled: boolean`.
- Produces: `StickyCard002<T>`, which positions wrapper elements while leaving card content to the caller.

- [ ] **Step 1: Add the failing registry/lifecycle contract**

Append to `tests/work-card-stack.test.mjs`:

```js
test('adapted Skiper17 scopes its trigger and cleanup', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper17.tsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /from ['"]@gsap\/react['"]/)
  assert.match(source, /ScrollTrigger/)
  assert.match(source, /trigger:\s*stack\.current/)
  assert.match(source, /pin:\s*stack\.current/)
  assert.match(source, /scope:\s*container/)
  assert.match(source, /timeline\.kill\(\)/)
  assert.match(source, /trigger\.kill\(\)/)
  assert.doesNotMatch(source, /querySelector(All)?\(/)
  assert.doesNotMatch(source, /ScrollTrigger\.getAll/)
  assert.doesNotMatch(source, /ReactLenis|lenis\/react/)
  assert.match(source, /Skiper17 StickyCard_002/)
  assert.match(source, /Free to use and modify/)
})
```

- [ ] **Step 2: Run the focused Node contract and verify it fails**

Run:

```bash
node --test tests/work-card-stack.test.mjs
```

Expected: existing work-card tests pass and this test fails with `ENOENT` for
`skiper17.tsx`.

- [ ] **Step 3: Install the official dependencies with the repository package manager**

Run:

```bash
npm install gsap @gsap/react lenis
```

Expected: `package.json` gains all three dependencies and `package-lock.json`
is updated. `framer-motion` remains at its existing version.

Use the existing shadcn registry configuration to fetch the official source:

```bash
npx shadcn@latest add @skiper-ui/skiper17
```

Expected: the registry creates
`src/components/ui/skiper-ui/skiper17.tsx`. If prompted to overwrite an
existing file, stop and inspect it before answering. Confirm that no
`pnpm-lock.yaml` was created:

```bash
test ! -e pnpm-lock.yaml
```

Expected: exit code 0.

- [ ] **Step 4: Replace the generated demo with the isolated primitive**

Replace `src/components/ui/skiper-ui/skiper17.tsx` with:

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";
import { useRef } from "react";

interface IdentifiedCard {
  id: number | string;
}

interface StickyCard002Props<T extends IdentifiedCard> {
  cards: T[];
  enabled: boolean;
  renderCard: (card: T, index: number) => ReactNode;
  className?: string;
  containerClassName?: string;
}

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function StickyCard002<T extends IdentifiedCard>({
  cards,
  enabled,
  renderCard,
  className,
  containerClassName,
}: StickyCard002Props<T>) {
  const container = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!enabled || !stack.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const cardElements = cardRefs.current.filter(
        (card): card is HTMLDivElement => card !== null,
      );
      if (cardElements.length === 0) return;

      gsap.set(cardElements[0], { yPercent: 0, scale: 1, rotation: 0 });
      if (cardElements.length > 1) {
        gsap.set(cardElements.slice(1), {
          yPercent: 110,
          scale: 1,
          rotation: 0,
        });
      }

      const timeline = gsap.timeline();
      for (let index = 0; index < cardElements.length - 1; index += 1) {
        timeline.to(
          cardElements[index],
          {
            scale: 0.72,
            rotation: 4,
            duration: 1,
            ease: "none",
          },
          index,
        );
        timeline.to(
          cardElements[index + 1],
          {
            yPercent: 0,
            duration: 1,
            ease: "none",
          },
          index,
        );
      }

      const trigger = ScrollTrigger.create({
        animation: timeline,
        trigger: stack.current,
        pin: stack.current,
        start: "top top",
        end: () => `+=${window.innerHeight * (cardElements.length - 1)}`,
        scrub: 0.5,
        pinSpacing: true,
        invalidateOnRefresh: true,
      });

      const resizeObserver = new ResizeObserver(() => trigger.refresh());
      resizeObserver.observe(stack.current);

      return () => {
        resizeObserver.disconnect();
        trigger.kill();
        timeline.kill();
        gsap.set(cardElements, { clearProps: "transform" });
      };
    },
    {
      scope: container,
      dependencies: [enabled, cards.length],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={container}
      className={classes(
        "relative w-full",
        className,
      )}
      data-work-stack-mode={enabled ? "stack" : "list"}
    >
      <div
        ref={stack}
        className={
          enabled
            ? "relative flex h-dvh w-full items-center justify-center overflow-hidden px-10 py-20"
            : "mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 md:gap-10 md:px-10 md:pb-24"
        }
      >
        <div
          className={classes(
            enabled
              ? "relative aspect-[4/3] w-full max-w-5xl"
              : "contents",
            containerClassName,
          )}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              className={
                enabled
                  ? "absolute inset-0 h-full w-full will-change-transform"
                  : "w-full"
              }
            >
              {renderCard(card, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { StickyCard002 };

/**
 * Skiper17 StickyCard_002 — React + GSAP + ScrollTrigger
 * Adapted for scoped lifecycle and renderable project media.
 * We respect the original creators. This is an inspired rebuild with our own
 * taste and does not claim any ownership.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 */
```

- [ ] **Step 5: Run the lifecycle contract**

Run:

```bash
node --test tests/work-card-stack.test.mjs
```

Expected: all work-card source contracts pass.

- [ ] **Step 6: Type-check through the production build**

Run:

```bash
npm run build
```

Expected: Astro builds successfully. The new primitive is not yet imported by
the page, so this step primarily verifies dependency resolution.

- [ ] **Step 7: Commit the isolated registry checkpoint**

```bash
git add package.json package-lock.json \
  src/components/ui/skiper-ui/skiper17.tsx tests/work-card-stack.test.mjs
git commit -m "feat: add scoped Skiper17 stack primitive"
```

---

### Task 3: Hydrate the stack and control video playback

**Files:**
- Modify: `src/components/work-card-stack/WorkProjectCard.tsx`
- Modify: `src/components/WorkCardStack.tsx`
- Modify: `src/pages/work/index.astro`
- Modify: `tests/work-card-stack.test.mjs`

**Interfaces:**
- Consumes: `workStackMode`, `StickyCard002`, `WorkProjectCard`, and `WorkCard[]`.
- Produces: a hydrated `/work` stack with standard-motion desktop animation and conservative video autoplay.

- [ ] **Step 1: Add the failing enhancement contract**

Append to `tests/work-card-stack.test.mjs`:

```js
test('work stack progressively enhances motion and video', async () => {
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )
  const card = await readFile(
    new URL(
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      import.meta.url,
    ),
    'utf8',
  )
  const page = await readFile(
    new URL('../src/pages/work/index.astro', import.meta.url),
    'utf8',
  )

  assert.match(stack, /workStackMode/)
  assert.match(stack, /matchMedia\(['"]\(prefers-reduced-motion: reduce\)['"]\)/)
  assert.match(stack, /const \[reducedMotion, setReducedMotion\] = useState\(true\)/)
  assert.match(stack, /<StickyCard002/)
  assert.match(stack, /\.play\(\)\.catch/)
  assert.match(stack, /\.pause\(\)/)
  assert.match(card, /videoRef/)
  assert.match(page, /<WorkCardStack cards=\{cards\} client:load \/>/)
})
```

- [ ] **Step 2: Run the new contract and verify it fails**

Run:

```bash
node --test tests/work-card-stack.test.mjs
```

Expected: earlier tests pass and this test fails because the stack does not yet
use the policy or Skiper17.

- [ ] **Step 3: Add an optional video ref to the semantic card**

Replace the props declaration and component signature in
`src/components/work-card-stack/WorkProjectCard.tsx` with:

```tsx
import type { Ref } from 'react'
import type { WorkCard } from './work-card-model'

interface WorkProjectCardProps {
  card: WorkCard
  eager?: boolean
  videoRef?: Ref<HTMLVideoElement>
}

export default function WorkProjectCard({
  card,
  eager = false,
  videoRef,
}: WorkProjectCardProps) {
```

Add the ref to the existing `<video>` element:

```tsx
<video
  ref={videoRef}
  muted
  loop
  playsInline
  preload="metadata"
  poster={card.media.poster}
  className="h-full w-full object-cover"
  data-work-card-video
>
```

Do not add `autoPlay`; playback remains controlled after preference detection.

- [ ] **Step 4: Replace the static stack wrapper with the progressive enhancement**

Replace `src/components/WorkCardStack.tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react'
import { StickyCard002 } from './ui/skiper-ui/skiper17'
import WorkProjectCard from './work-card-stack/WorkProjectCard'
import type { WorkCard } from './work-card-stack/work-card-model'
import {
  workStackMode,
  type WorkStackMode,
} from './work-card-stack/work-stack-policy'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  const [mode, setMode] = useState<WorkStackMode>('list')
  const [reducedMotion, setReducedMotion] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMode = () => {
      setReducedMotion(motionQuery.matches)
      setMode(workStackMode(window.innerWidth, motionQuery.matches))
    }

    updateMode()
    window.addEventListener('resize', updateMode)
    motionQuery.addEventListener('change', updateMode)

    return () => {
      window.removeEventListener('resize', updateMode)
      motionQuery.removeEventListener('change', updateMode)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (reducedMotion) {
      video.pause()
      video.currentTime = 0
      return
    }

    video.play().catch(() => {
      video.pause()
    })
  }, [reducedMotion])

  if (cards.length === 0) return null

  return (
    <section aria-label="Selected work">
      <StickyCard002
        cards={cards}
        enabled={mode === 'stack'}
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

- [ ] **Step 5: Hydrate only the work stack**

In `src/pages/work/index.astro`, change:

```astro
<WorkCardStack cards={cards} />
```

to:

```astro
<WorkCardStack cards={cards} client:load />
```

This keeps server-rendered link markup while loading the client code early
enough to initialize a top-of-page scroll sequence.

- [ ] **Step 6: Run focused tests and build**

Run:

```bash
node --test tests/work-card-stack.test.mjs
npx vitest run tests/work-card-stack
npm run build
```

Expected: all commands pass. Astro reports all existing project detail routes.

- [ ] **Step 7: Commit the progressive enhancement**

```bash
git add src/components/WorkCardStack.tsx \
  src/components/work-card-stack/WorkProjectCard.tsx \
  src/pages/work/index.astro tests/work-card-stack.test.mjs
git commit -m "feat: animate work cards with Skiper17"
```

---

### Task 4: Browser hardening and final verification

**Files:**
- Modify if evidence requires it: `src/components/ui/skiper-ui/skiper17.tsx`
- Modify if evidence requires it: `src/components/WorkCardStack.tsx`
- Modify if evidence requires it: `src/components/work-card-stack/WorkProjectCard.tsx`
- Modify if evidence requires it: `src/pages/work/index.astro`
- Modify if evidence requires it: `tests/work-card-stack.test.mjs`
- Modify if evidence requires it: `tests/work-card-stack/work-stack-policy.test.ts`

**Interfaces:**
- Consumes: the completed `/work` experience from Tasks 1–3.
- Produces: verified desktop, mobile, reduced-motion, keyboard, video-fallback, and Astro-navigation behavior.

- [ ] **Step 1: Start the local site**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Astro prints a local URL and remains running. Keep this terminal
session available for browser verification.

- [ ] **Step 2: Verify the standard-motion desktop sequence**

Using the `webapp-testing` skill, open `/work` at `1440 × 1000` and confirm:

- START Volunteer Platform is the initial visible card.
- Scrolling advances to Crux and then Amber.
- The outgoing card scales to approximately `0.72` and rotates slightly.
- The next card rises from below without a horizontal page scrollbar.
- The final card releases back into normal document scrolling.
- The title is the only visible textual project metadata.
- The volunteering video plays muted; if playback is blocked, its poster stays
  visible.

Capture one screenshot at the initial card and one during the Crux transition.
Treat any console error, scroll jump, blank card, or stuck pin spacer as a
failure.

- [ ] **Step 3: Verify links, focus, and unchanged details**

In the same desktop session:

- Press Tab until the current project card is focused and confirm the outline
  is visible.
- Press Enter and confirm the correct `/work/[slug]` detail page opens.
- Confirm its description, “Built with,” “Visit project,” credits, and media
  gallery are present.
- Navigate back to `/work`, scroll through the stack, then navigate to `/about`
  and back using the NavPill.
- Confirm no duplicate ScrollTrigger, stale pin spacer, or console error
  appears after the round trip.

- [ ] **Step 4: Verify mobile and reduced-motion fallbacks**

At `390 × 844`, reload `/work` and confirm:

- all three projects appear as a normal vertical list;
- every card is tappable;
- the page scrolls normally and has no horizontal overflow;
- the volunteering card uses the mobile video source when playback succeeds.

Emulate `prefers-reduced-motion: reduce` at `1440 × 1000`, reload, and confirm:

- all three cards appear as a normal vertical list;
- there is no pinning, scaling, or rotation;
- the volunteer video remains paused on its poster;
- all links remain keyboard accessible.

- [ ] **Step 5: Apply only evidence-driven fixes**

If Steps 2–4 expose a failure, first add the smallest regression assertion to
`tests/work-card-stack.test.mjs` or
`tests/work-card-stack/work-stack-policy.test.ts`, run it to verify failure,
then modify only the responsible file. Examples:

- lifecycle or pin failure → `src/components/ui/skiper-ui/skiper17.tsx`;
- media preference/playback failure → `src/components/WorkCardStack.tsx`;
- link, title, poster, or focus failure →
  `src/components/work-card-stack/WorkProjectCard.tsx`;
- hydration or page spacing failure → `src/pages/work/index.astro`.

Re-run the exact browser scenario that exposed the failure. Do not add visual
effects, copy, metadata, or global scroll behavior during hardening.

- [ ] **Step 6: Run final automated verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: the full test suite passes, Astro builds all routes, and
`git diff --check` prints no whitespace errors.

- [ ] **Step 7: Commit any hardening changes**

If Step 5 changed files:

```bash
git add src/components/ui/skiper-ui/skiper17.tsx \
  src/components/WorkCardStack.tsx \
  src/components/work-card-stack/WorkProjectCard.tsx \
  src/pages/work/index.astro tests/work-card-stack.test.mjs \
  tests/work-card-stack/work-stack-policy.test.ts
git commit -m "fix: harden work card stack interactions"
```

If Step 5 required no changes, do not create an empty commit. Record the
successful browser matrix in the session handoff.
