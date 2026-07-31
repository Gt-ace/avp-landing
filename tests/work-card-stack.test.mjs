import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runner = process.env.VITEST ? await import('vitest') : await import('node:test')
const test = process.env.VITEST ? runner.test : runner.default

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
  assert.match(source, /card\.media\.kind === ['"]image['"] /)
  assert.match(source, /<video/)
  assert.match(source, /poster=\{card\.media\.poster\}/)
  assert.match(source, /aria-hidden="true"[\s\S]*\{card\.title\}/)
  assert.doesNotMatch(source, /card\.(client|year|description|tech|credits)/)
  assert.doesNotMatch(source, /\bautoplay\b/i)
})

test('work index hydrates only the work card stack', async () => {
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
  assert.match(page, /<WorkCardStack cards=\{cards\} client:load \/>/)
  assert.doesNotMatch(page, /project-row/)
  assert.doesNotMatch(page, /project\.description/)
  assert.match(stack, /<StickyCard002/)
  assert.match(stack, /<WorkProjectCard/)
  assert.doesNotMatch(stack, /client:/)
  assert.match(detail, /class="detail-layout"/)
  assert.match(detail, /Visit project/)
})

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

test('adapted Skiper17 reuses the stack frame sizing helper for the enabled frame', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper17.tsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /export function getStackFrameStyle/)
  assert.match(source, /style=\{getStackFrameStyle\(enabled\)\}/)
})

test('adapted Skiper17 limits stack focusability to the active desktop card', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper17.tsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /export const WORK_CARD_ACTIVE_ATTRIBUTE/)
  assert.match(source, /export function getActiveCardIndexFromProgress/)
  assert.match(source, /export function setActiveCardInteractivity/)
  assert.match(source, /export function resetCardInteractivity/)
  assert.match(source, /\.inert = !isActive/)
  assert.match(source, /WORK_CARD_ACTIVE_ATTRIBUTE/)
  assert.match(source, /onUpdate:\s*\(self\)\s*=>/)
  assert.match(source, /getActiveCardIndexFromProgress\(self\.progress,\s*cardElements\.length\)/)
  assert.match(source, /resetCardInteractivity\(cardElements\)/)
})

test('pinned stack clips its cards and owns the full viewport', async () => {
  const skiper = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper17.tsx', import.meta.url),
    'utf8',
  )
  const page = await readFile(
    new URL('../src/pages/work/index.astro', import.meta.url),
    'utf8',
  )

  // Without overflow clipping on the frame, the queued cards sitting at
  // yPercent 110 spill down the page instead of waiting behind the active one.
  assert.match(skiper, /aspect-\[4\/3\][^"']*overflow-hidden/)
  // The pinned section is h-dvh and its frame is sized off 100dvh, so any page
  // padding above it pushes the card out of view and jerks it up when pinning.
  assert.doesNotMatch(page, /padding-top/)
  // List mode therefore has to clear the fixed nav pill itself.
  assert.match(skiper, /pt-28/)
})

test('work stack drives Lenis from the GSAP ticker only while pinned', async () => {
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )
  const smooth = await readFile(
    new URL('../src/components/work-card-stack/smooth-scroll.ts', import.meta.url),
    'utf8',
  )

  assert.match(stack, /startSmoothScroll/)
  assert.match(stack, /mode !== ['"]stack['"]/)
  assert.match(smooth, /autoRaf: false/)
  assert.match(smooth, /lenis\.on\(['"]scroll['"]/)
  assert.match(smooth, /ScrollTrigger\.update\(\)/)
  assert.match(smooth, /gsap\.ticker\.add/)
  assert.match(smooth, /lagSmoothing\(0\)/)
  assert.match(smooth, /gsap\.ticker\.remove/)
  assert.match(smooth, /lenis\.destroy\(\)/)
})

test('work stack stays unpainted until it resolves its layout mode', async () => {
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )
  const page = await readFile(
    new URL('../src/pages/work/index.astro', import.meta.url),
    'utf8',
  )

  // Hydrating with a different mode than the server rendered leaves React's
  // server attributes in place, which pins GSAP onto the list layout.
  assert.match(stack, /useState<WorkStackMode>\(['"]list['"]\)/)
  assert.match(stack, /data-work-stack-ready/)
  assert.match(page, /html\.js \.work-stack:not\(\[data-work-stack-ready\]\)/)
  assert.match(page, /visibility: hidden/)
})

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
