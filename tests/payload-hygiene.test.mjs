import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')
const bytes = async (relative) => (await stat(new URL(relative, import.meta.url))).size

/*
 * The letterforms were auto-traced from a bitmap, so each one carried a few
 * hundred grey slivers of antialiasing and outlines that followed pixel jitter.
 * The pill draws them at 15px and 28px tall, where none of that survives
 * rasterisation. These budgets are the traced sizes cut by an order of
 * magnitude; the geometry that reads at those sizes fits inside them.
 */
const LETTERFORM_BUDGETS = [
  ['../public/logo-mark.svg', 12_000],
  ['../public/v.svg', 9_000],
  ['../public/p.svg', 6_000],
]

for (const [file, budget] of LETTERFORM_BUDGETS) {
  test(`${file.split('/').pop()} costs a fraction of the traced original`, async () => {
    const size = await bytes(file)

    assert.ok(
      size <= budget,
      `${file} is ${size} bytes, over the ${budget} byte budget`
    )
  })
}

test('the nav pill loads under 30K of letterforms on every page', async () => {
  const total = (
    await Promise.all(LETTERFORM_BUDGETS.map(([file]) => bytes(file)))
  ).reduce((a, b) => a + b, 0)

  // 284K before. The pill is on every page, so this is a per-page cost.
  assert.ok(total < 30_000, `the three letterforms weigh ${total} bytes together`)
})

test('no letterform still carries the tracer artefacts that made it huge', async () => {
  for (const [file] of LETTERFORM_BUDGETS) {
    const source = await read(file)

    assert.doesNotMatch(
      source,
      /<!DOCTYPE/i,
      `${file} still has the tracer's DTD preamble`
    )
    assert.ok(
      (source.match(/<path/g) ?? []).length < 25,
      `${file} still has the tracer's per-sliver paths`
    )
  }
})

test('the marquee lets the browser decide when to fetch its logos', async () => {
  const source = await read('../src/components/LogoMarquee.astro')

  assert.doesNotMatch(
    source,
    /loading="eager"/,
    'the marquee sits below the fold on both pages that mount it'
  )
  assert.match(source, /loading="lazy"/)
})

test('the marquee holds still for a visitor who asked for less motion', async () => {
  const source = await read('../src/components/LogoMarquee.astro')
  const guarded = source.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n  \}/
  )

  assert.ok(guarded, 'the marquee has no reduced-motion block at all')
  assert.match(
    guarded[1],
    /\.logo-track \{[^}]*animation: none/,
    'the infinite scroll is the one animation that has to stop'
  )
})

test('the marquee fade is a fixed inset, not a share of a phone width', async () => {
  const source = await read('../src/components/LogoMarquee.astro')
  const masks = source.match(/mask-image: linear-gradient\(.*\);/g) ?? []

  assert.equal(masks.length, 2, 'the prefixed and standard mask travel together')
  for (const mask of masks) {
    assert.doesNotMatch(
      mask,
      /black \d+%/,
      'a percentage fade eats a fifth of a 390px screen; a px inset does not'
    )
    assert.match(mask, /black 24px, black calc\(100% - 24px\)/)
  }
})

test('the hero dot fade moves with the copy it frames', async () => {
  const source = await read('../src/pages/index.astro')
  const masks = [...source.matchAll(/--hero-dot-mask:\s*([^;]+);/g)].map(
    (match) => match[1]
  )

  assert.equal(masks.length, 2, 'one fade geometry per copy arrangement')
  assert.match(masks[0], /at 35% 50%/, 'the wide fade sits over the left column')
  assert.match(
    masks[1],
    /at 50% 50%/,
    'narrow copy runs gutter to gutter, so a 35% offset frames nothing'
  )
  assert.match(
    source,
    /mask-image: radial-gradient\(\s*var\(--hero-dot-mask\)/,
    'one gradient reading the variable, not a second copy of the gradient'
  )
})

test('the hero holds its height as the mobile toolbar collapses', async () => {
  const source = await read('../src/pages/index.astro')
  const hero = source.match(/\n  \.hero \{([\s\S]*?)\n  \}/)

  assert.ok(hero, 'index.astro has no .hero rule')
  assert.match(
    hero[1],
    /min-height: 100svh/,
    'svh is the toolbar-visible height, which is also the height at first paint'
  )
  assert.doesNotMatch(
    source,
    /100dvh/,
    'dvh re-lays out the hero mid-scroll: the centred copy and the scroll cue move with the toolbar'
  )
})

test('the font request carries only the axes the site renders', async () => {
  const source = await read('../src/layouts/BaseLayout.astro')
  const href = source.match(/fonts\.googleapis\.com\/css2\?[^"]*/)[0]

  assert.doesNotMatch(href, /ital/, 'nothing on the site is ever italic')
  assert.match(
    href,
    /family=Bodoni\+Moda:opsz,wght@11,600/,
    'Bodoni renders at one weight, and 11 is the opsz default that ' +
      'font-optical-sizing: none falls back to'
  )
})

test('every display-font rule pins optical sizing, which the pinned request assumes', async () => {
  // The request above ships a static instance at opsz 11. That is only
  // invisible while nothing asks the browser to pick an optical size by font
  // size, which `font-optical-sizing: none` is what prevents.
  const files = [
    '../src/styles/global.css',
    '../src/pages/index.astro',
    '../src/pages/about.astro',
    '../src/pages/contact.astro',
    '../src/pages/work/index.astro',
    '../src/pages/work/[slug].astro',
    '../src/layouts/BaseLayout.astro',
  ]

  for (const file of files) {
    const source = await read(file)
    for (const [, selector, body] of source.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (!body.includes('var(--font-display)')) continue
      assert.match(
        body,
        /font-optical-sizing: none/,
        `${file}: ${selector.trim()} uses the display font without pinning opsz`
      )
    }
  }
})

test('the dead smooth-scroll dependency is gone', async () => {
  const pkg = JSON.parse(await read('../package.json'))

  assert.ok(!('lenis' in (pkg.dependencies ?? {})), 'lenis is imported nowhere in src/')
  assert.ok(!('lenis' in (pkg.devDependencies ?? {})))
})

test('the process step stacks its number above the text on a phone', async () => {
  const source = await read('../src/pages/index.astro')
  const narrow = source.match(/@media \(max-width: 30rem\) \{([\s\S]*?)\n  \}/)

  assert.ok(narrow, 'index.astro has no narrow-screen block')
  assert.match(
    narrow[1],
    /\.process-step \{[^}]*grid-template-columns: 1fr/,
    'a 5.5rem number in its own column leaves ~270px for body text at 390px'
  )
})

test('the focus list names its category once instead of per row', async () => {
  const source = await read('../src/pages/about.astro')
  const markup = source.split('<style>')[0]

  assert.equal(
    (markup.match(/>Focus</g) ?? []).length,
    1,
    'three "Focus" labels spent 88px of a phone width on the same word'
  )
  assert.equal(
    (markup.match(/<li>/g) ?? []).length,
    3,
    'the three focus areas stay, only the repeated label goes'
  )
})
