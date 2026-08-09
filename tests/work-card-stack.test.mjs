import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runner = process.env.VITEST ? await import('vitest') : await import('node:test')
const test = process.env.VITEST ? runner.test : runner.default

test('work project card keeps its playback control outside the semantic link', async () => {
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
  assert.match(source, /mobileMp4[\s\S]*fallbackWebm/)
  assert.match(source, /aria-hidden="true"[\s\S]*\{card\.title\}/)
  assert.match(source, /data-work-video-toggle/)
  assert.match(source, /Pause preview/)
  assert.match(source, /Play preview/)
  assert.match(source, /min-h-11/)
  assert.match(source, /min-w-11/)
  assert.ok(source.indexOf('</a>') < source.indexOf('data-work-video-toggle'))
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
  // The pinned section uses a stable viewport height and mobile-first padding,
  // while list mode still clears the fixed nav pill itself.
  assert.doesNotMatch(page, /padding-top/)
  assert.match(skiper, /h-svh/)
  assert.match(skiper, /px-5/)
  assert.match(skiper, /sm:px-10/)
  assert.match(skiper, /getStackScrollDistance\([\s\S]*stack\.current\?\.clientHeight/)
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
  assert.match(stack, /useState\(false\)/)
  assert.match(stack, /data-work-stack-ready/)
  assert.match(page, /html\.js \.work-stack:not\(\[data-work-stack-ready\]\)/)
  assert.match(page, /visibility: hidden/)
})

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
  assert.match(stack, /videoControlsEnabled=\{enhanced\}/)
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

test('work project card links its image and title to the detail page morph', async () => {
  const source = await readFile(
    new URL(
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      import.meta.url,
    ),
    'utf8',
  )

  const imageNameOccurrences =
    source.match(/style=\{\{ viewTransitionName: `image-\$\{card\.id\}` \}\}/g) ?? []
  assert.equal(imageNameOccurrences.length, 2, 'both the <img> and <video> branches must carry the image transition name')
  assert.match(source, /style=\{\{ viewTransitionName: `title-\$\{card\.id\}` \}\}/)
})

test('detail page slows its named transitions to match the card morph', async () => {
  const detail = await readFile(
    new URL('../src/pages/work/[slug].astro', import.meta.url),
    'utf8',
  )

  assert.match(detail, /import \{ fade \} from ['"]astro:transitions['"]/)
  assert.match(detail, /const morph = fade\(\{ duration: 480 \}\)/)
  const morphOccurrences = detail.match(/transition:animate=\{morph\}/g) ?? []
  assert.equal(morphOccurrences.length, 2, 'the title and the video should both use the shared morph config')
  assert.match(detail, /transition:animate=\{i === 0 && !project\.video \? morph : undefined\}/)
  assert.match(detail, /::view-transition-group\(\*\)/)
  assert.match(detail, /animation-duration: 480ms/)
  assert.match(detail, /cubic-bezier\(0\.16, 1, 0\.3, 1\)/)
})

test('work index shares the same transition group timing as the detail page', async () => {
  const page = await readFile(
    new URL('../src/pages/work/index.astro', import.meta.url),
    'utf8',
  )

  assert.match(page, /::view-transition-group\(\*\)/)
  assert.match(page, /animation-duration: 480ms/)
  assert.match(page, /cubic-bezier\(0\.16, 1, 0\.3, 1\)/)
})

test('the video branch names a wrapper, not the media element itself', async () => {
  const cardSource = await readFile(
    new URL(
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      import.meta.url,
    ),
    'utf8',
  )
  const detail = await readFile(
    new URL('../src/pages/work/[slug].astro', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(
    cardSource,
    /<video\b[^>]*style=\{\{ viewTransitionName/,
    'the <video> tag itself must not carry the transition name (Chromium drops video playback across a named view transition)',
  )
  assert.doesNotMatch(
    detail,
    /<video\b[^>]*transition:(name|animate)/,
    'the detail <video> tag itself must not carry transition:name/transition:animate',
  )
})
