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
  // Sources used to be one flat list ending in `fallbackWebm` (which is the
  // *desktop* webm), so a phone that fell past the mp4 landed on 5.9MB. The
  // list is resolved per tier now, so the card must not reach for that field.
  assert.match(source, /resolveWorkVideoSources\(card\.media, wideViewport\)/)
  assert.doesNotMatch(source, /fallbackWebm/)
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

test('the pinned frame is sized in CSS, so it can turn portrait on a phone', async () => {
  const [skiper, css] = await Promise.all(
    [
      '../src/components/ui/skiper-ui/skiper17.tsx',
      '../src/styles/global.css',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
  )

  // The frame used to carry an inline width from a JS helper, which can only
  // ever describe one viewport. A 4:3 frame on a 390x844 phone resolves to
  // about 350x262, roughly a third of the screen. Sizing lives in CSS now so
  // the ratio itself can change at the breakpoint.
  assert.match(skiper, /work-stack-frame/)
  assert.doesNotMatch(
    skiper,
    /getStackFrameStyle/,
    'the inline width helper is gone; CSS owns frame sizing',
  )
  assert.doesNotMatch(
    skiper,
    /aspect-\[4\/3\]/,
    'a hardcoded landscape ratio in the class list would defeat the media query',
  )

  assert.match(css, /\.work-stack-frame \{/)
  assert.match(css, /aspect-ratio: 4 \/ 5/)
  assert.match(css, /100svh - 7rem\) \* 4 \/ 5/)
  assert.match(css, /@media \(min-width: 640px\)[\s\S]*?aspect-ratio: 4 \/ 3/)
  assert.match(css, /min\(64rem, 100%, calc\(\(100svh - 10rem\) \* 4 \/ 3\)\)/)
})

test('the card fills the pinned frame instead of imposing its own ratio', async () => {
  const [card, stack] = await Promise.all(
    [
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      '../src/components/WorkCardStack.tsx',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
  )

  // With a portrait frame, a card that keeps its own aspect-[4/3] is shorter
  // than the box it sits in, so the stack scales and rotates a letterboxed
  // card. In stack mode the frame owns the ratio and the card just fills it;
  // in list mode there is no frame height to fill, so the ratio stays.
  assert.match(card, /fill\b/)
  assert.match(card, /h-full w-full/)
  assert.match(card, /aspect-\[4\/3\]/, 'list mode still needs the ratio')
  assert.match(stack, /fill=\{enhanced\}/)
})

test('the pin ignores the collapsing mobile toolbar', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper17.tsx', import.meta.url),
    'utf8',
  )

  // Two separate paths recomputed the pin when iOS Safari collapsed its URL
  // bar mid-scroll: ScrollTrigger's own resize handling, and our
  // ResizeObserver firing on the height change. Both are width-gated now.
  assert.match(source, /ScrollTrigger\.config\(\{[\s\S]*?ignoreMobileResize: true/)
  assert.match(
    source,
    /new ResizeObserver\(\(\) => \{[\s\S]*?clientWidth[\s\S]*?refresh\(\)/,
    'the observer must compare widths before refreshing',
  )
})

test('the pinned stack costs less scroll per card on a phone', async () => {
  const source = await readFile(
    new URL('../src/components/ui/skiper-ui/skiper17.tsx', import.meta.url),
    'utf8',
  )

  // The factor's arithmetic is covered in
  // tests/work-card-stack/skiper17-frame-style.test.ts; what matters here is
  // that the trigger actually passes it, off the same 640px breakpoint the
  // frame ratio uses.
  assert.match(source, /NARROW_VIEWPORT_WIDTH = 640/)
  assert.match(source, /NARROW_SCROLL_FACTOR = 0\.7/)
  assert.match(source, /clientWidth[\s\S]*?NARROW_SCROLL_FACTOR/)
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
  assert.match(skiper, /work-stack-frame[^"']*overflow-hidden/)
  // The pinned section uses a stable viewport height and mobile-first padding,
  // while list mode still clears the fixed nav pill itself. svh is the small
  // viewport, which is the one that does not move when the URL bar collapses.
  assert.doesNotMatch(page, /padding-top/)
  assert.match(skiper, /h-svh/)
  assert.match(skiper, /px-4/)
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

test('work cards are never named at render time, only tagged for the morph', async () => {
  const source = await readFile(
    new URL(
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      import.meta.url,
    ),
    'utf8',
  )

  // A render-time name lands in the server HTML, which is what the browser
  // snapshots on the way back to /work -- before this island hydrates and
  // before the stack is pinned. The morph then animates toward list-layout
  // geometry. It also gives every non-clicked card its own transition group,
  // and captured groups escape the stack's overflow-hidden frame.
  assert.doesNotMatch(
    source,
    /viewTransitionName/,
    'the card must not set view-transition-name while rendering',
  )
  assert.match(source, /data-work-card=\{card\.id\}/)
  assert.match(source, /data-morph-image/)
  assert.match(source, /data-morph-title/)
})

test('the clicked card is named during astro:before-preparation, and cleared first', async () => {
  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )

  // before-preparation is awaited before document.startViewTransition, so a
  // name set here is on the element in time for the old-state capture.
  assert.match(stack, /addEventListener\('astro:before-preparation'/)
  assert.match(stack, /removeEventListener\('astro:before-preparation'/)
  assert.match(
    stack,
    /destination\.pathname\.match\(/,
    'the target card is identified from the destination URL, so back/forward behave like a click',
  )
  assert.match(
    stack,
    /removeProperty\('view-transition-name'\)/,
    'a stale name from an aborted navigation must be cleared before naming again',
  )
  assert.match(stack, /setProperty\('view-transition-name', `image-\$\{slug\}`\)/)
  assert.match(stack, /setProperty\('view-transition-name', `title-\$\{slug\}`\)/)
})

test('both sides of the morph derive the same names from the project slug', async () => {
  const [stack, detail, model] = await Promise.all(
    [
      '../src/components/WorkCardStack.tsx',
      '../src/pages/work/[slug].astro',
      '../src/components/work-card-stack/work-card-model.ts',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
  )

  // The chain the morph depends on: the model builds href from project.slug,
  // the stack parses that slug back out of the destination URL and names the
  // card with it, and the detail page names its own elements from the same
  // project.slug. Break any link and the morph silently degrades to a plain
  // cross-fade, so assert the whole chain rather than each file alone.
  assert.match(model, /href: `\/work\/\$\{project\.slug\}`/)

  for (const prefix of ['image', 'title']) {
    assert.match(
      stack,
      new RegExp(`view-transition-name', \`${prefix}-\\$\\{slug\\}\``),
      `the card side must produce ${prefix}-<slug>`,
    )
    assert.match(
      detail,
      new RegExp(`transition:name=\\{[^}]*\`${prefix}-\\$\\{project\\.slug\\}\``),
      `the detail side must produce ${prefix}-<slug> from the same slug`,
    )
  }
})

test('detail page eases its named transitions with the shared morph config', async () => {
  const detail = await readFile(
    new URL('../src/pages/work/[slug].astro', import.meta.url),
    'utf8',
  )

  assert.match(detail, /import \{ fade \} from ['"]astro:transitions['"]/)
  assert.match(detail, /const morph = fade\(\{ duration: 480 \}\)/)
  const morphOccurrences = detail.match(/transition:animate=\{morph\}/g) ?? []
  assert.equal(morphOccurrences.length, 1, 'only the title uses the shared morph config directly; video is excluded (see below)')
  assert.match(detail, /transition:animate=\{i === 0 && !project\.video \? morph : undefined\}/)
})

test('transition timing is defined once, in the layout, and covers the root fade', async () => {
  const [layout, index, detail] = await Promise.all(
    [
      '../src/layouts/BaseLayout.astro',
      '../src/pages/work/index.astro',
      '../src/pages/work/[slug].astro',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
  )

  // Timing the groups alone left the page cross-fade on the UA default 250ms
  // while the named morph ran the full 480ms, so the outgoing page vanished
  // partway through the morph. old/new carry the same clock as the group.
  assert.match(layout, /::view-transition-group\(\*\)/)
  assert.match(layout, /::view-transition-old\(\*\)/)
  assert.match(layout, /::view-transition-new\(\*\)/)
  assert.match(layout, /animation-duration: 480ms/)
  assert.match(layout, /cubic-bezier\(0\.16, 1, 0\.3, 1\)/)

  // Astro only ships its own reduced-motion override on pages that use a
  // transition directive, and /work is not one of them, so the timing has to
  // carry its own guard or it applies to visitors who asked for less motion.
  assert.match(
    layout,
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?animation: none !important;[\s\S]*?\}/,
  )

  for (const [name, page] of [['work index', index], ['detail page', detail]]) {
    assert.doesNotMatch(
      page,
      /::view-transition-(group|old|new)/,
      `${name} must not redefine the shared transition timing`,
    )
  }
})

test('the video is excluded from the morph entirely, on both sides', async () => {
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

  const stack = await readFile(
    new URL('../src/components/WorkCardStack.tsx', import.meta.url),
    'utf8',
  )

  // Chromium drops <video> playback across a view transition when the video
  // (or an ancestor) carries a view-transition-name, even briefly. Naming a
  // wrapper div was tried and still broke playback, so the video keeps no
  // transition name at all and just cuts with the rest of the page.
  //
  // Names are applied at click time now, and the runtime hook the handler
  // looks for is data-morph-image, so keeping that attribute off the <video>
  // is what excludes it. The title still morphs on a video card.
  assert.doesNotMatch(
    cardSource,
    /<video\b[\s\S]*?data-morph-image/,
    'the <video> tag must not carry the image morph hook',
  )
  assert.match(
    stack,
    /querySelector<HTMLElement>\('\[data-morph-image\]'\)/,
    'the click-time handler names only elements carrying the image morph hook',
  )
  assert.doesNotMatch(
    detail,
    /<video\b[^>]*transition:(name|animate)/,
    'the detail <video> tag itself must not carry transition:name/transition:animate',
  )
  assert.doesNotMatch(
    detail,
    /<div transition:name=\{`image-\$\{project\.slug\}`\}/,
    'the detail video must not be wrapped in a named div either',
  )
})

test('no video call site uses the dead `media` attribute to pick a file', async () => {
  const [card, detail] = await Promise.all(
    [
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      '../src/pages/work/[slug].astro',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
  )

  // `media` on <source> inside <video> left the HTML spec in 2014. Chrome and
  // Firefox ignore it and fall through to the first playable `type`, which is
  // how phones ended up downloading the 5.9MB desktop encode. Only Safari
  // still honours it, which is why the bug stayed invisible on iOS.
  for (const [name, source] of [['work card', card], ['detail page', detail]]) {
    assert.doesNotMatch(
      source,
      /<source\b[^>]*\bmedia=/,
      `${name} must not select a video source with the \`media\` attribute`,
    )
    assert.doesNotMatch(
      source,
      /media="\(min-width/,
      `${name} must not carry a leftover min-width source query`,
    )
  }
})

test('both video call sites resolve their tier from the same matchMedia query', async () => {
  const [card, detail] = await Promise.all(
    [
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      '../src/pages/work/[slug].astro',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
  )

  // Two call sites, one breakpoint. If they drift, a viewport width exists
  // where the listing and the detail page disagree about which file to serve.
  assert.match(
    card,
    /export const DESKTOP_VIDEO_QUERY = '\(min-width: 768px\)'/,
    'the card owns the canonical query',
  )
  assert.match(card, /matchMedia\(DESKTOP_VIDEO_QUERY\)/)
  assert.match(
    detail,
    /matchMedia\('\(min-width: 768px\)'\)/,
    'the detail page script must use the same breakpoint',
  )
})

test('the markup default is the mobile encode, and desktop is the JS upgrade', async () => {
  const [card, detail] = await Promise.all(
    [
      '../src/components/work-card-stack/WorkProjectCard.tsx',
      '../src/pages/work/[slug].astro',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
  )

  // Pre-hydration, and for clients with JS off, whatever the markup names is
  // what gets fetched. Naming the mobile encode there makes the failure mode
  // "a desktop visitor sees a 720p preview" instead of "a phone eats 5.9MB".
  assert.match(
    card,
    /export function resolveWorkVideoSources/,
    'tier resolution must be a named, testable function',
  )
  assert.match(card, /useState\(false\)/)
  assert.doesNotMatch(
    detail,
    /<source[^>]*project\.video\.desktop(Webm|Mp4)/,
    'the detail markup must not render a desktop <source>',
  )
  assert.match(detail, /<source src=\{project\.video\.mobileMp4\}/)
  assert.match(
    detail,
    /data-desktop-mp4=\{project\.video\.desktopMp4\}/,
    'the desktop encode reaches the client as data, for the script to opt into',
  )
})

test('the detail video keeps autoplaying inline and muted after the tier swap', async () => {
  const detail = await readFile(
    new URL('../src/pages/work/[slug].astro', import.meta.url),
    'utf8',
  )

  // Swapping <source> children does nothing until the element re-runs its
  // resource selection algorithm, and an explicit load() clears the autoplay
  // the attribute would have given us, so playback has to be re-asked for.
  assert.match(detail, /\bautoplay\b/)
  assert.match(detail, /\bmuted\b/)
  assert.match(detail, /\bplaysinline\b/)
  assert.match(detail, /video\.load\(\)/)
  assert.match(detail, /video\.play\(\)/)
  // A bundled Astro <script> is deferred, so `autoplay` would already be
  // pulling the mobile body before the swap and desktop would pay for both
  // files. `is:inline` runs the moment the parser passes the video.
  assert.match(detail, /<script is:inline\b/)
  // An is:inline body is raw text, so the script has to arrive as a string:
  // written as JSX children the backticks ship literally and it never parses.
  assert.match(detail, /set:html=\{videoTierScript\}/)
  assert.match(detail, /const videoTierScript = `/)
})

test('the tier swap survives an Astro view-transition navigation', async () => {
  const detail = await readFile(
    new URL('../src/pages/work/[slug].astro', import.meta.url),
    'utf8',
  )

  // /work morphs into this page through the view-transition router, which
  // swaps the body rather than loading a document. Without astro:page-load the
  // swapped-in video keeps whatever tier the markup shipped.
  assert.match(detail, /astro:page-load/)
  assert.match(
    detail,
    /dataset\.videoTier/,
    'the swap must be idempotent, since the script may run again per navigation',
  )
})

test('the scroll hint clears the iOS home indicator', async () => {
  const css = await readFile(
    new URL('../src/styles/global.css', import.meta.url),
    'utf8',
  )

  // A fixed element at bottom: 1rem sits under the home indicator on an
  // iPhone, which is exactly where the hint was.
  assert.match(
    css,
    /\.work-scroll-hint \{[\s\S]*?bottom: calc\(clamp\(1rem, 3vh, 2rem\) \+ env\(safe-area-inset-bottom, 0px\)\)/,
  )
})

test('/work names itself, visibly on a phone and to assistive tech everywhere', async () => {
  const [stack, css] = await Promise.all(
    ['../src/components/WorkCardStack.tsx', '../src/styles/global.css'].map(
      (path) => readFile(new URL(path, import.meta.url), 'utf8'),
    ),
  )

  // The page used to render cards and nothing else, so a phone screen carried
  // no clue about what it was looking at, and the document had no h1 at all.
  assert.match(stack, /<h1[\s\S]*?work-page-label/)
  assert.match(stack, /Selected work/)
  // Kept out of flow on purpose: real flow content above an h-svh scene pushes
  // the pin start below the top of the viewport.
  assert.match(css, /\.work-page-label \{[\s\S]*?position: absolute/)
  assert.match(
    css,
    /@media \(min-width: 640px\)[\s\S]*?\.work-page-label \{[\s\S]*?clip-path: inset\(50%\)/,
  )
})
