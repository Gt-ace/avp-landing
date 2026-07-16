# Landing Redesign Part 1: Motion Foundation and ASCII Hero

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the video hero with an interactive ASCII glyph field and add the shared scroll-reveal system the rest of the landing page will use.

**Architecture:** A new `HeroAscii.astro` component draws a canvas glyph field (logo-mark motif, pointer ripple) inside the existing hero section. A tiny IntersectionObserver script in `index.astro` plus a `[data-reveal]` utility in `global.css` powers all entrance animations. No React, no new dependencies.

**Tech Stack:** Astro 4 static site, vanilla TypeScript in Astro `<script>` blocks, plain CSS.

**Read first:** `docs/superpowers/specs/2026-07-16-landing-scroll-redesign-design.md` (the approved spec) and `src/pages/index.astro`.

## Global Constraints

- No new npm dependencies.
- Only touch: `src/pages/index.astro`, `src/components/HeroAscii.astro` (new), `src/styles/global.css` (additions only), `public/hero1.webm` (delete).
- Keep the light editorial identity: existing oklch tokens, Bodoni Moda display, Geist body. No dark sections.
- Every animation must respect `prefers-reduced-motion: reduce`.
- Content must be visible without JavaScript: hide-for-reveal styles are gated on the `html.js` class (already set in `BaseLayout.astro`).
- Scripts must survive Astro ViewTransitions: re-arm on `astro:page-load`.
- There is no test framework in this repo. Verification is `npm run build` plus grepping `dist/` output; visual checks run via `npm run preview`.
- Every git commit uses `--author="Gt-ace <arthur.s7@gmx.de>"`.

---

### Task 1: Scroll-reveal utility

**Files:**
- Modify: `src/styles/global.css` (append at end)
- Modify: `src/pages/index.astro` (add script; add `data-reveal` to the selected work section)

**Interfaces:**
- Produces: any element with a `data-reveal` attribute fades and rises in when scrolled into view; optional inline `--reveal-delay` custom property staggers it. Part 2's sections rely on exactly this attribute and property.

- [ ] **Step 1: Append the reveal utility to `src/styles/global.css`**

```css

/* ---- Scroll reveal (elements opt in via data-reveal) ---- */
html.js [data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}

html.js [data-reveal].in-view {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  html.js [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Add the observer script to `src/pages/index.astro`**

Add this as a new `<script>` block after the existing crossfade `<script>` (the crossfade block is removed in Task 3; this one stays):

```html
<script>
  function armReveals() {
    const els = document.querySelectorAll('[data-reveal]:not(.in-view)')
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('in-view')
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.15 }
    )
    els.forEach((el) => io.observe(el))
  }

  armReveals()
  document.addEventListener('astro:page-load', armReveals)
</script>
```

- [ ] **Step 3: Apply reveals to the selected work section in `index.astro`**

- On `<header class="selected-head">`: add `data-reveal`.
- On each `<li class="selected-item">` (inside the `.map`): change the map callback to receive the index and add the attributes:

```astro
{selected.map((project, i) => (
  <li class="selected-item" data-reveal style={`--reveal-delay: ${i * 90}ms`}>
```

- On `<a href="/work" class="selected-all label">`: add `data-reveal`.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c 'data-reveal' dist/index.html`
Expected: at least 5.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/pages/index.astro
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Add scroll-reveal system, apply to selected work"
```

---

### Task 2: HeroAscii component

**Files:**
- Create: `src/components/HeroAscii.astro`

**Interfaces:**
- Consumes: `public/logo-mark.svg` (existing asset) as the density motif.
- Produces: `<HeroAscii />`, an absolutely positioned decorative canvas that fills its `position: relative` parent. Task 3 mounts it inside `section.hero`.

- [ ] **Step 1: Create `src/components/HeroAscii.astro` with this exact content**

```astro
---
// Decorative interactive ASCII field. Fills its positioned parent with a
// grid of mono glyphs whose density faintly renders the AVP logo mark.
// Glyphs darken and ripple near the pointer; touch devices get an
// autonomous wave. Static single frame under prefers-reduced-motion.
---
<canvas class="hero-ascii" aria-hidden="true"></canvas>

<style>
  .hero-ascii {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>

<script>
  const GLYPHS = ' .·:;=+*#%@'
  const INK = 'oklch(10% 0.005 260)'
  const RADIUS = 150

  type Cell = { x: number; y: number; base: number; phase: number }

  function setup(canvas: HTMLCanvasElement) {
    if (canvas.dataset.ready) return
    canvas.dataset.ready = 'true'

    const ctx = canvas.getContext('2d')
    const host = canvas.parentElement
    if (!ctx || !host) return

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = matchMedia('(pointer: fine)').matches

    let cells: Cell[] = []
    let width = 0
    let height = 0
    let cell = 16
    let raf = 0
    let running = false
    let visible = false
    let t = 0

    // The drawn pointer eases toward the real one for an organic trail.
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 }

    const logo = new Image()
    logo.onload = () => { rebuild(); if (!running) draw() }
    logo.onerror = () => { rebuild(); if (!running) draw() }
    logo.src = '/logo-mark.svg'

    function rebuild() {
      const rect = host.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const dpr = Math.min(devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      cell = width < 768 ? 22 : 16
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${Math.round(cell * 0.85)}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const cols = Math.ceil(width / cell)
      const rows = Math.ceil(height / cell)

      // Rasterise the logo into a grid-sized alpha map.
      let sample = (_cx: number, _cy: number) => 0
      if (logo.complete && logo.naturalWidth > 0) {
        const off = document.createElement('canvas')
        off.width = cols
        off.height = rows
        const octx = off.getContext('2d')
        if (octx) {
          const size = Math.min(cols, rows) * 0.6
          const ratio = logo.naturalWidth / logo.naturalHeight
          const w = ratio >= 1 ? size : size * ratio
          const h = ratio >= 1 ? size / ratio : size
          octx.drawImage(logo, (cols - w) / 2, (rows - h) / 2, w, h)
          const data = octx.getImageData(0, 0, cols, rows).data
          sample = (cx, cy) => data[(cy * cols + cx) * 4 + 3] / 255
        }
      }

      cells = []
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          cells.push({
            x: cx * cell + cell / 2,
            y: cy * cell + cell / 2,
            base: sample(cx, cy),
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = INK
      pointer.x += (pointer.tx - pointer.x) * 0.12
      pointer.y += (pointer.ty - pointer.y) * 0.12

      for (const c of cells) {
        const d = Math.hypot(c.x - pointer.x, c.y - pointer.y)
        const near = Math.max(0, 1 - d / RADIUS)
        const ripple = near > 0 ? near * (0.6 + 0.4 * Math.sin(d / 14 - t * 5)) : 0
        const shimmer = reduced ? 0.04 : 0.04 * (1 + Math.sin(t * 0.8 + c.phase))
        const level = Math.min(1, c.base * 0.55 + shimmer + ripple)
        if (level < 0.05) continue
        const g = GLYPHS[Math.min(GLYPHS.length - 1, Math.round(level * (GLYPHS.length - 1)))]
        ctx.globalAlpha = 0.08 + level * 0.55
        ctx.fillText(g, c.x, c.y)
      }
      ctx.globalAlpha = 1
    }

    function loop(now: number) {
      t = now / 1000
      if (!finePointer) {
        pointer.tx = width * (0.5 + 0.4 * Math.sin(t * 0.5))
        pointer.ty = height * (0.5 + 0.3 * Math.cos(t * 0.37))
      }
      draw()
      if (running) raf = requestAnimationFrame(loop)
    }

    function start() {
      if (running || reduced) return
      running = true
      raf = requestAnimationFrame(loop)
    }

    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }

    host.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect()
      pointer.tx = e.clientX - rect.left
      pointer.ty = e.clientY - rect.top
    })
    host.addEventListener('pointerleave', () => {
      pointer.tx = -9999
      pointer.ty = -9999
    })

    new ResizeObserver(() => {
      rebuild()
      if (!running) draw()
    }).observe(host)

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    }).observe(canvas)

    rebuild()
    draw()
  }

  function init() {
    document
      .querySelectorAll<HTMLCanvasElement>('canvas.hero-ascii')
      .forEach((c) => {
        try {
          setup(c)
        } catch {
          // Decorative only: a failure must never break the page.
        }
      })
  }

  init()
  document.addEventListener('astro:page-load', init)
</script>
```

- [ ] **Step 2: Build to verify the component compiles**

Run: `npm run build`
Expected: exits 0 (the component is not mounted yet; this catches syntax and TS errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroAscii.astro
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Add HeroAscii interactive glyph field component"
```

---

### Task 3: Mount the new hero, remove the video

**Files:**
- Modify: `src/pages/index.astro`
- Delete: `public/hero1.webm`

**Interfaces:**
- Consumes: `<HeroAscii />` from Task 2.
- Produces: `section.hero` on a light background with ink-colored type; Part 2 appends its sections after `section.selected`.

- [ ] **Step 1: Rework the hero markup in `src/pages/index.astro`**

Add the import in the frontmatter:

```astro
import HeroAscii from '../components/HeroAscii.astro'
```

Replace the two `<video>` elements and `<div class="hero-overlay">` inside `<section class="hero">` with a single line, keeping `.hero-content` and `.hero-scroll` untouched:

```astro
<section class="hero">
  <HeroAscii />

  <div class="hero-content">
    <h1 class="hero-title">AVP Software</h1>
    <p class="hero-tagline">
      A small studio that designs and builds software end to end: interface,
      product, and the infrastructure underneath.
    </p>
  </div>

  <a class="hero-scroll" href="#work" aria-label="Scroll to selected work">
    <span class="label">Selected work</span>
    <span class="hero-scroll-arrow" aria-hidden="true">&#8595;</span>
  </a>
</section>
```

Delete the entire crossfade `<script>` block (the one starting with `const CROSSFADE = 1`). Keep the reveal script from Task 1.

- [ ] **Step 2: Rework the hero styles in `index.astro`**

Delete the `.hero-video`, `.hero-video.is-active`, and `.hero-overlay` rules. Update these rules to their new values (light background, ink type):

```css
.hero {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--color-bg);
}

.hero-title {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 600;
  font-optical-sizing: none;
  color: var(--color-ink);
  text-wrap: balance;
  line-height: 1;
  margin: 0;
  animation: hero-in 0.9s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-tagline {
  font-family: var(--font-body);
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  font-weight: 500;
  color: var(--color-muted);
  line-height: 1.5;
  margin-top: 1.5rem;
  max-width: 32rem;
  animation: hero-in 0.9s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-scroll {
  position: absolute;
  bottom: 3vh;
  right: 10vw;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-muted);
  animation: hero-in 0.9s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  transition: color 200ms;
}

.hero-scroll:hover {
  color: var(--color-ink);
}
```

`.hero-content`, `.hero-scroll .label`, `.hero-scroll-arrow`, and the keyframes stay as they are. The `.hero-content` block sits above the canvas already (both are positioned; the canvas comes first in source order), so no z-index changes are needed.

- [ ] **Step 3: Delete the hero video**

```bash
git rm public/hero1.webm
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c 'hero-ascii' dist/index.html && grep -c 'hero1.webm' dist/index.html; ls dist/hero1.webm`
Expected: first grep at least 1; second grep prints 0 (grep exits 1, fine); `ls` reports "No such file or directory".

- [ ] **Step 5: Visual check**

Run: `npm run preview` and open the printed URL.
Check: glyph field visible with a faint logo motif, ripple follows the mouse, headline and tagline readable in ink on the light background, scroll cue present. Emulate `prefers-reduced-motion: reduce` in devtools and reload: field renders one static frame. If the motif is too faint or too strong, tune the `c.base * 0.55` factor and the `0.6` logo size factor in `HeroAscii.astro`, rebuild, recheck.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro public/hero1.webm
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Replace video hero with interactive ASCII field"
```
