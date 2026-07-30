# Work Card Stack Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/work` project rows with a complete static linked-card presentation that uses the approved project media and remains useful without JavaScript.

**Architecture:** A pure adapter maps `src/data/projects.ts` into a discriminated image-or-video card model. A focused React card primitive renders one semantic project link, and `WorkCardStack` renders the three-card list server-side. The Astro page owns data selection and page spacing; no GSAP, hydration, or dependency changes occur in this first session.

**Tech Stack:** Astro 4, React 18, TypeScript, Tailwind CSS 3, Vitest, Node test runner

## Global Constraints

- Replace only the project rows on `/work`; do not modify `src/pages/work/[slug].astro`.
- Keep project order identical to `src/data/projects.ts`.
- Show only the project title on each card.
- Make the entire card a conventional link to `/work/[slug]`.
- Use the volunteer platform's existing video sources and poster.
- Use the first `images` entry for Crux and Amber.
- Keep AVP's Bodoni display face, monochrome identity, and restrained corners.
- Do not add GSAP, Lenis, `@gsap/react`, a modal, filters, pagination, or global scrolling changes in this plan.
- Do not alter unrelated untracked files already present in the worktree.
- Design authority: `docs/superpowers/specs/2026-07-30-work-skiper17-card-stack-design.md`.

---

## File Structure

- Create `src/components/work-card-stack/work-card-model.ts`: the serializable card media types and pure `toWorkCards` adapter.
- Create `src/components/work-card-stack/WorkProjectCard.tsx`: one accessible linked image/video card.
- Create `src/components/WorkCardStack.tsx`: the server-rendered three-card list and empty-state boundary.
- Modify `src/pages/work/index.astro`: map project data and replace the row markup with `WorkCardStack`.
- Create `tests/work-card-stack/work-card-model.test.ts`: media-selection and route contract tests.
- Create `tests/work-card-stack.test.mjs`: source-level integration checks for semantics, visible content, and unchanged detail-page source.
- Modify `package.json`: include all `.mjs` integration contracts in the existing Node-test stage.

---

### Task 1: Project-to-card data contract

**Files:**
- Create: `src/components/work-card-stack/work-card-model.ts`
- Create: `tests/work-card-stack/work-card-model.test.ts`

**Interfaces:**
- Consumes: `Project` and `projects` from `src/data/projects.ts`.
- Produces: `WorkCard`, `WorkCardMedia`, and `toWorkCards(source: readonly Project[]): WorkCard[]`.

- [ ] **Step 1: Write the failing adapter tests**

Create `tests/work-card-stack/work-card-model.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { projects } from '../../src/data/projects'
import { toWorkCards } from '../../src/components/work-card-stack/work-card-model'

describe('work card adapter', () => {
  it('preserves project order, titles, and internal detail routes', () => {
    const cards = toWorkCards(projects)

    expect(cards.map(({ id, title, href }) => ({ id, title, href }))).toEqual([
      {
        id: 'volunteer-platform',
        title: 'START Summit x Hack Volunteer Platform',
        href: '/work/volunteer-platform',
      },
      { id: 'crux', title: 'Crux', href: '/work/crux' },
      { id: 'amber', title: 'Amber', href: '/work/amber' },
    ])
  })

  it('uses responsive video for volunteering and first images elsewhere', () => {
    const [volunteer, crux, amber] = toWorkCards(projects)

    expect(volunteer.media).toEqual({
      kind: 'video',
      desktopWebm: '/volunteer-platform-desktop.webm',
      desktopMp4: '/volunteer-platform-desktop.mp4',
      mobileWebm: undefined,
      mobileMp4: '/volunteer-platform-mobile.mp4',
      poster: '/images/volunteer-platform.avif',
    })
    expect(crux.media).toEqual({
      kind: 'image',
      src: '/images/crux.avif',
      alt: 'Crux interface preview',
    })
    expect(amber.media).toEqual({
      kind: 'image',
      src: '/images/amber.avif',
      alt: 'Amber interface preview',
    })
  })

  it('rejects an image project without a usable first image', () => {
    const broken = [{ ...projects[1], images: [] }]

    expect(() => toWorkCards(broken)).toThrow(
      'Project "crux" needs a first image for the work card',
    )
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run tests/work-card-stack/work-card-model.test.ts
```

Expected: FAIL because `work-card-model.ts` does not exist.

- [ ] **Step 3: Implement the minimal typed adapter**

Create `src/components/work-card-stack/work-card-model.ts`:

```ts
import type { Project } from '../../data/projects'

export interface WorkImageMedia {
  kind: 'image'
  src: string
  alt: string
}

export interface WorkVideoMedia {
  kind: 'video'
  desktopWebm?: string
  desktopMp4: string
  mobileWebm?: string
  mobileMp4: string
  poster: string
}

export type WorkCardMedia = WorkImageMedia | WorkVideoMedia

export interface WorkCard {
  id: string
  title: string
  href: string
  media: WorkCardMedia
}

export function toWorkCards(source: readonly Project[]): WorkCard[] {
  return source.map((project) => {
    const media: WorkCardMedia = project.video
      ? {
          kind: 'video',
          desktopWebm: project.video.desktopWebm,
          desktopMp4: project.video.desktopMp4,
          mobileWebm: project.video.mobileWebm,
          mobileMp4: project.video.mobileMp4,
          poster: project.video.poster,
        }
      : {
          kind: 'image',
          src:
            project.images[0] ??
            (() => {
              throw new Error(
                `Project "${project.slug}" needs a first image for the work card`,
              )
            })(),
          alt: `${project.title} interface preview`,
        }

    return {
      id: project.slug,
      title: project.title,
      href: `/work/${project.slug}`,
      media,
    }
  })
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npx vitest run tests/work-card-stack/work-card-model.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit the data contract**

```bash
git add src/components/work-card-stack/work-card-model.ts \
  tests/work-card-stack/work-card-model.test.ts
git commit -m "feat: add work card media model"
```

Expected: one commit containing only the adapter and its tests.

---

### Task 2: Semantic linked-card primitive

**Files:**
- Create: `src/components/work-card-stack/WorkProjectCard.tsx`
- Create: `tests/work-card-stack.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `WorkCard`.
- Produces: `WorkProjectCard({ card, eager? }): JSX.Element`, a full-card internal link containing one image or video and one visible title.

- [ ] **Step 1: Add the failing semantic source contract**

Create `tests/work-card-stack.test.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('work project card is one semantic link with only a visible title', async () => {
  const source = await readFile(
    new URL(
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(source, /<a/)
  assert.match(source, /href=\{card\.href\}/)
  assert.match(source, /aria-label=\{card\.title\}/)
  assert.match(source, /card\.media\.kind === ['"]image['"]/)
  assert.match(source, /<video/)
  assert.match(source, /poster=\{card\.media\.poster\}/)
  assert.match(source, /aria-hidden="true"[\s\S]*\{card\.title\}/)
  assert.doesNotMatch(source, /card\.(client|year|description|tech|credits)/)
  assert.doesNotMatch(source, /\bautoplay\b/i)
})
```

Change the `test` script in `package.json` to:

```json
"test": "node --test tests/*.test.mjs && vitest run --exclude='**/.worktrees/**' --exclude='**/*.test.mjs'"
```

- [ ] **Step 2: Run the Node contracts and verify the new one fails**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: existing big-type tests pass, then the new test fails with `ENOENT`
for `WorkProjectCard.tsx`.

- [ ] **Step 3: Implement the semantic card**

Create `src/components/work-card-stack/WorkProjectCard.tsx`:

```tsx
import type { WorkCard } from './work-card-model'

interface WorkProjectCardProps {
  card: WorkCard
  eager?: boolean
}

export default function WorkProjectCard({
  card,
  eager = false,
}: WorkProjectCardProps) {
  return (
    <a
      href={card.href}
      aria-label={card.title}
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
    >
      {card.media.kind === 'image' ? (
        <img
          src={card.media.src}
          alt={card.media.alt}
          loading={eager ? 'eager' : 'lazy'}
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          muted
          loop
          playsInline
          preload="metadata"
          poster={card.media.poster}
          className="h-full w-full object-cover"
          data-work-card-video
        >
          {card.media.desktopWebm && (
            <source
              src={card.media.desktopWebm}
              type="video/webm"
              media="(min-width: 768px)"
            />
          )}
          <source
            src={card.media.desktopMp4}
            type="video/mp4"
            media="(min-width: 768px)"
          />
          {card.media.mobileWebm && (
            <source src={card.media.mobileWebm} type="video/webm" />
          )}
          <source src={card.media.mobileMp4} type="video/mp4" />
        </video>
      )}

      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-200 group-hover:opacity-90"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 max-w-[85%] p-5 font-display text-[clamp(1.5rem,3vw,2.75rem)] font-semibold leading-[1.05] text-white sm:p-7"
        aria-hidden="true"
      >
        {card.title}
      </span>
    </a>
  )
}
```

- [ ] **Step 4: Run the Node contracts and verify they pass**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: all Node tests pass.

- [ ] **Step 5: Commit the semantic card**

```bash
git add package.json \
  src/components/work-card-stack/WorkProjectCard.tsx \
  tests/work-card-stack.test.mjs
git commit -m "feat: add linked work project card"
```

Expected: one commit containing the card, integration contract, and test-script
update. `package-lock.json` is unchanged because no dependency was added.

---

### Task 3: Replace the `/work` rows with the static card list

**Files:**
- Create: `src/components/WorkCardStack.tsx`
- Modify: `src/pages/work/index.astro`
- Modify: `tests/work-card-stack.test.mjs`

**Interfaces:**
- Consumes: `WorkCard[]`, `WorkProjectCard`, `projects`, and `toWorkCards`.
- Produces: `WorkCardStack({ cards }): JSX.Element` and a server-rendered `/work` page containing exactly three project links.

- [ ] **Step 1: Add the failing page-integration contract**

Append to `tests/work-card-stack.test.mjs`:

```js
test('work index maps project data into the static card stack', async () => {
  const page = await readFile(
    new URL('../src/pages/work/index.astro', import.meta.url),
    'utf8',
  )
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )
  const detail = await readFile(
    new URL('../src/pages/work/[slug].astro', import.meta.url),
    'utf8',
  )

  assert.match(page, /toWorkCards\(projects\)/)
  assert.match(page, /<WorkCardStack cards=\{cards\} \/>/)
  assert.doesNotMatch(page, /project-row/)
  assert.doesNotMatch(page, /project\.description/)
  assert.match(stack, /cards\.map/)
  assert.match(stack, /<WorkProjectCard/)
  assert.doesNotMatch(stack, /client:/)
  assert.match(detail, /class="detail-layout"/)
  assert.match(detail, /Visit project/)
})
```

- [ ] **Step 2: Run the new contract and verify it fails**

Run:

```bash
node --test tests/work-card-stack.test.mjs
```

Expected: the semantic-card test passes and the page-integration test fails
because `WorkCardStack.tsx` does not exist.

- [ ] **Step 3: Implement the server-rendered list**

Create `src/components/WorkCardStack.tsx`:

```tsx
import WorkProjectCard from './work-card-stack/WorkProjectCard'
import type { WorkCard } from './work-card-stack/work-card-model'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  if (cards.length === 0) return null

  return (
    <section
      className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 md:gap-10 md:px-10 md:pb-24"
      aria-label="Selected work"
    >
      {cards.map((card, index) => (
        <WorkProjectCard key={card.id} card={card} eager={index === 0} />
      ))}
    </section>
  )
}
```

- [ ] **Step 4: Replace the row implementation on `/work`**

Replace `src/pages/work/index.astro` with:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import WorkCardStack from '../../components/WorkCardStack'
import { toWorkCards } from '../../components/work-card-stack/work-card-model'
import { projects } from '../../data/projects'

const cards = toWorkCards(projects)
---

<BaseLayout title="Work | AVP Software">
  <main class="work-page">
    <WorkCardStack cards={cards} />
  </main>
</BaseLayout>

<style>
  .work-page {
    padding-top: clamp(6rem, 12vh, 9rem);
  }
</style>
```

Do not add a `client:*` directive in this plan. Astro must server-render the
React component without shipping hydration JavaScript.

- [ ] **Step 5: Run the focused contracts**

Run:

```bash
node --test tests/work-card-stack.test.mjs
npx vitest run tests/work-card-stack/work-card-model.test.ts
```

Expected: both commands pass.

- [ ] **Step 6: Run the full regression suite**

Run:

```bash
npm test
```

Expected: all Node and Vitest tests pass.

- [ ] **Step 7: Build and inspect the generated routes**

Run:

```bash
npm run build
```

Expected: Astro completes successfully and reports generated `/work`,
`/work/volunteer-platform`, `/work/crux`, and `/work/amber` routes.

Run:

```bash
rg -o 'href="/work/(volunteer-platform|crux|amber)"' dist/work/index.html
```

Expected: one match for each of the three project routes.

- [ ] **Step 8: Commit the static `/work` replacement**

```bash
git add src/components/WorkCardStack.tsx src/pages/work/index.astro \
  tests/work-card-stack.test.mjs
git commit -m "feat: replace work rows with project cards"
```

Expected: the branch ends with a buildable, no-JavaScript-compatible `/work`
page. Stop here and hand off to the Skiper17 motion plan in a fresh session.
