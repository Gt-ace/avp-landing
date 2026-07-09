# Task 01: Design system + BaseLayout

Depends on: Task 00 complete, `npm install` done.

Create `src/styles/global.css` and `src/layouts/BaseLayout.astro`. These are the foundation every page inherits.

---

## src/styles/global.css

```css
/* ---- Font faces ---- */
@font-face {
  font-family: 'PP Neue Montreal';
  src: url('/fonts/PPNueMontreal-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'PP Neue Montreal';
  src: url('/fonts/PPNueMontreal-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

/* ---- Design tokens ---- */
:root {
  --color-bg:      oklch(98% 0.003 260);
  --color-surface: oklch(100% 0 0);
  --color-ink:     oklch(10% 0.005 260);
  --color-muted:   oklch(50% 0.005 260);
  --color-border:  oklch(85% 0.003 260);
  --color-overlay: oklch(0% 0 0 / 20%);

  --font-display: 'Bodoni Moda', Georgia, serif;
  --font-body:    'PP Neue Montreal', system-ui, sans-serif;

  --text-hero:  clamp(3.5rem, 8vw, 8rem);
  --text-title: clamp(1.75rem, 4vw, 3rem);
  --text-body:  1rem;
  --text-small: 0.75rem;
  --text-label: 0.6875rem;
}

/* ---- Reset ---- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  background-color: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img, video {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

/* ---- Shared label utility ---- */
.label {
  font-family: var(--font-body);
  font-size: var(--text-label);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-muted);
}

/* ---- Shared page layout (About, Contact) ---- */
.page-container {
  max-width: 640px;
  margin: 0 auto;
  padding: clamp(8rem, 15vh, 12rem) 1.5rem clamp(5rem, 10vw, 9rem);
}

.page-label {
  font-family: var(--font-body);
  font-size: var(--text-label);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-muted);
  display: block;
  margin-bottom: 1.25rem;
}

.page-heading {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 400;
  color: var(--color-ink);
  line-height: 1.05;
  text-wrap: balance;
  margin: 0 0 2rem;
}

.page-body p {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-ink);
  line-height: 1.7;
  max-width: 55ch;
  margin-bottom: 1.25rem;
}
```

---

## src/layouts/BaseLayout.astro

```astro
---
import NavPill from '../components/NavPill'
import '../styles/global.css'
import { ViewTransitions } from 'astro:transitions'

export interface Props {
  title?: string
}
const { title = 'AVP Software' } = Astro.props
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="AVP Software: creative software studio" />
    <title>{title}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&display=swap"
      rel="stylesheet"
    />

    <ViewTransitions />
  </head>
  <body>
    <NavPill client:load />
    <slot />
  </body>
</html>
```

---

## Verification

- `global.css` present at `src/styles/global.css`
- `BaseLayout.astro` present at `src/layouts/BaseLayout.astro`
- All CSS custom properties defined on `:root`
- Font-face blocks declared (PP Neue Montreal woff2 will 404 until font files are added manually: expected)
