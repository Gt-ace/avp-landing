import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

test('the pill opens on hover and closes when the pointer leaves', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(source, /onMouseEnter=\{\(\) => pointerIsMouse\.current && setIsOpen\(true\)\}/)
  assert.match(source, /onMouseLeave=\{\(\) => pointerIsMouse\.current && setIsOpen\(false\)\}/)
})

test('an emulated hover from a tap cannot cancel the tap that caused it', async () => {
  const source = await read('../src/components/NavPill.tsx')

  // A touch screen fires mouseenter before click. Ungated, hover opened the
  // pill and the button's click toggled it shut again on the same tap, so the
  // menu never opened on a phone at all.
  assert.match(
    source,
    /onPointerEnter=\{\(e\) => \(pointerIsMouse\.current = e\.pointerType === 'mouse'\)\}/,
    'the real input type has to be recorded before the emulated mouse events land'
  )
  assert.match(
    source,
    /const pointerIsMouse = useRef\(true\)/,
    'defaulting to true keeps hover working on a mouse that never fired a pointerenter'
  )
})

test('a mouse click never opens the pill', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.doesNotMatch(
    source,
    /onClick=\{\(\) => setIsOpen\(true\)\}/,
    'a container click handler fires when a nav link is clicked, which reopened the pill on the way out'
  )
  assert.match(
    source,
    /e\.pointerType !== 'mouse' && !isOpen/,
    'touch still needs a way in: the static nav is hidden whenever JS runs'
  )
})

test('selecting a link collapses the pill', async () => {
  const source = await read('../src/components/NavPill.tsx')

  // The row and the stacked panel render the same NavLink, so the close runs
  // through one `onSelect` prop rather than an inline handler per link.
  assert.match(
    source,
    /href=\{href\}\s*\n\s*onClick=\{onSelect\}/,
    'each nav link closes the pill on click'
  )
  assert.match(
    source,
    /onSelect=\{\(\) => setIsOpen\(false\)\}/,
    'and the only thing passed as onSelect is the close'
  )
  assert.doesNotMatch(
    source,
    /onSelect=\{[^}]*\}\s*\n[\s\S]*?onSelect=\{/,
    'a second call site could pass something that does not close'
  )
})

test('client-side navigation collapses the pill', async () => {
  const source = await read('../src/components/NavPill.tsx')
  const handler = source.slice(
    source.indexOf('const handler = () =>'),
    source.indexOf("document.addEventListener('astro:page-load'")
  )

  assert.match(
    handler,
    /setIsOpen\(false\)/,
    'view transitions can carry this island across a swap with its state intact'
  )
})

test('tapping outside the pill closes it', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(
    source,
    /containerRef\.current\?\.contains\(e\.target as Node\)\) setIsOpen\(false\)/,
    'touch has no hover, so an outside tap is the only way back to closed'
  )
})

test('the optical cap-height match between the A and the V or P survives', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(source, /const A_HEIGHT = 15\b/)
  assert.match(source, /const VP_HEIGHT = 28\b/)
  assert.match(
    source,
    /fills ~92% of its frame height/,
    'the reason these two numbers differ has to stay next to them'
  )
})

test('a disclosure button announces the menu and its state', async () => {
  const source = await read('../src/components/NavPill.tsx')
  const button = source.slice(source.indexOf('<button'), source.indexOf('</button>'))

  assert.notEqual(button, '', 'the control has to be a real button, not a div')
  assert.match(
    button,
    /aria-expanded=\{isOpen\}/,
    'screen readers get the open state from the control, not from the animation'
  )
  assert.match(button, /aria-label=/, 'the button labels itself: its content is letterforms')
  assert.doesNotMatch(
    button,
    /tabIndex=\{-1\}/,
    'a native button is already tab-reachable; do not take that away'
  )
})

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

test('Escape closes the menu and hands focus back to the button', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(source, /e\.key === 'Escape'/)
  assert.match(
    source,
    /buttonRef\.current\?\.focus\(\)/,
    'closing without moving focus strands the keyboard user inside a collapsed pill'
  )
})

test('focus leaving the pill closes it', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(
    source,
    /onBlur=\{\(e\) =>/,
    'the keyboard counterpart of the outside-tap handler'
  )
  assert.match(source, /shouldCloseOnFocusOut\(/)
})

test('every interactive target clears the 44px floor', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(source, /export const TOUCH_TARGET = 44\b/)
  assert.match(
    source,
    /minWidth: TOUCH_TARGET,\s*\n\s*minHeight: TOUCH_TARGET,/,
    'the A and P are home links, so they need the floor in both directions'
  )
  assert.match(
    source,
    /minHeight: stacked \? MOBILE_ROW_HEIGHT : TOUCH_TARGET,\s*\n\s*minWidth: TOUCH_TARGET,/,
    'the nav links need the floor in both directions too, stacked or in a row'
  )
  assert.doesNotMatch(
    source,
    /padding: '0 1rem',\s*\n\s*display: 'block',/,
    'the old link box was an 11px line box inside a 40px pill'
  )
})

test('the links cannot overlap the letterforms on a narrow screen', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.doesNotMatch(
    source,
    /animate=\{\{ width: isOpen \? 480 : 100 \}\}/,
    'a hard 480 clamped to calc(100vw - 32px) collided with the A and P at 320px'
  )
  assert.match(
    source,
    /getPillGeometry\(\{/,
    'one function owns width, height and radius for all three states'
  )
})

test('motion is skipped for visitors who ask for less of it', async () => {
  const source = await read('../src/components/NavPill.tsx')

  assert.match(source, /useReducedMotion/, 'the pill now animates height as well as width')
})

test('the letterform frames still carry the cap-height match', async () => {
  // A_HEIGHT and VP_HEIGHT are set against how much of its own frame each file
  // fills: the A is cropped to its ink, while the V and P sit inside a 2048
  // square and fill about half of it. Changing a frame silently changes the
  // rendered cap height, so the frames are part of the pill's contract.
  const a = await read('../public/logo-mark.svg')
  assert.match(a, /viewBox="467 502 1114 1042"/)

  for (const file of ['../public/v.svg', '../public/p.svg']) {
    const source = await read(file)
    assert.match(source, /width="2048px" height="2048px"/, `${file} left its square frame`)
    assert.match(source, /viewBox="0 0 2048 2048"/, `${file} left its square frame`)
  }
})

test('the ink inside each frame still sits where it was traced', async () => {
  // The frames above only hold if the ink keeps its place inside them: the
  // pill centres frames, not glyphs. These are the traced extents; the
  // tolerance is 4 of the frame's 1024-odd units, which is 0.06px of the 15px
  // the A is drawn at and 0.11px of the V and P's 28.
  const extents = [
    ['../public/logo-mark.svg', 476, 510, 1572, 1536],
    ['../public/v.svg', 511, 511, 1537, 1536],
    ['../public/p.svg', 632, 510, 1416, 1536],
  ]

  for (const [file, x0, y0, x1, y1] of extents) {
    const source = await read(file)
    const coords = [...source.matchAll(/d="([^"]*)"/g)].flatMap(([, d]) =>
      d.match(/-?\d+/g).map(Number)
    )
    const xs = coords.filter((_, i) => i % 2 === 0)
    const ys = coords.filter((_, i) => i % 2 === 1)

    assert.ok(Math.abs(Math.min(...xs) - x0) <= 4, `${file} left edge moved`)
    assert.ok(Math.abs(Math.min(...ys) - y0) <= 4, `${file} top edge moved`)
    assert.ok(Math.abs(Math.max(...xs) - x1) <= 4, `${file} right edge moved`)
    assert.ok(Math.abs(Math.max(...ys) - y1) <= 4, `${file} bottom edge moved`)
  }
})
