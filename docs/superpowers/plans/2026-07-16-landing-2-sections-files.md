# Landing Redesign Part 2: Process, Big Type, FAQ, AI Strip, robots.txt, llms.txt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the process, big type, FAQ, and AI summary sections to the landing page scroll, plus `public/robots.txt` (ASCII kanban) and `public/llms.txt`.

**Architecture:** All sections are static markup in `src/pages/index.astro` with scoped styles, animated by the `[data-reveal]` system from Part 1 plus one scroll-linked script for the big type band. The FAQ uses native `<details name="faq">`. The two txt files are plain static assets in `public/`.

**Tech Stack:** Astro 4 static site, vanilla TypeScript in Astro `<script>` blocks, plain CSS.

**Read first:** `docs/superpowers/specs/2026-07-16-landing-scroll-redesign-design.md` (the approved spec, including all final copy) and `src/pages/index.astro`.

**Prerequisite:** Part 1 (`2026-07-16-landing-1-hero-motion.md`) is complete: `[data-reveal]` works and the hero is the ASCII field. Verify with `grep -c 'data-reveal' src/pages/index.astro` (nonzero) before starting.

## Global Constraints

- No new npm dependencies.
- Only touch: `src/pages/index.astro`, `public/robots.txt` (new), `public/llms.txt` (new).
- Keep the light editorial identity: existing oklch tokens, Bodoni Moda display, Geist body. No dark sections.
- Every animation must respect `prefers-reduced-motion: reduce`.
- All copy comes verbatim from the spec. Do not rephrase it.
- Scripts must survive Astro ViewTransitions: re-arm on `astro:page-load`.
- The page must never scroll horizontally; wide content is clipped by its own container.
- No test framework exists. Verification is `npm run build` plus grepping `dist/`; visual checks via `npm run preview`.
- Every git commit uses `--author="Gt-ace <arthur.s7@gmx.de>"`.

---

### Task 1: Process section

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `[data-reveal]` / `--reveal-delay` from Part 1; `.page-label` from `global.css`.
- Produces: `section.process` placed directly after `section.hero` and before `section.selected`. Later tasks insert their sections after `section.selected`.

- [ ] **Step 1: Add the steps data to the frontmatter of `index.astro`**

```ts
const steps = [
  {
    title: 'Map',
    body: 'I start inside the workflow: the spreadsheet someone updates by hand, the approval that lives in an inbox. The tool gets designed around how your team already works.',
  },
  {
    title: 'Design',
    body: 'Internal tools people actually want to open. Status visible at a glance, forms that adapt to the case, and no manual required to use any of it.',
  },
  {
    title: 'Build',
    body: 'Wired into the systems you already pay for: accounting, e-signing, email, webhooks. Work moves itself forward instead of waiting for someone to forward it.',
  },
  {
    title: 'Run',
    body: 'I host it, watch it, and keep automating. Every release after launch removes another manual step.',
  },
]
```

- [ ] **Step 2: Add the section markup between `</section>` of the hero and `<section class="selected">`**

```astro
<section class="process">
  <header class="process-head" data-reveal>
    <span class="page-label">Process</span>
    <h2 class="process-heading">
      Most projects start with an idea. Mine start with your team's most
      annoying Tuesday.
    </h2>
  </header>
  <ol class="process-steps">
    {steps.map((step, i) => (
      <li class="process-step" data-reveal style={`--reveal-delay: ${i * 80}ms`}>
        <span class="process-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <div class="process-text">
          <h3 class="process-title label">{step.title}</h3>
          <p class="process-body">{step.body}</p>
        </div>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 3: Add the styles to the `<style>` block of `index.astro`**

```css
/* ---- Process ---- */
.process {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(2rem, 6vw, 6rem);
  align-items: start;
  padding: clamp(5rem, 12vh, 9rem) clamp(1.5rem, 10vw, 10rem);
  background: var(--color-bg);
}

.process-head {
  position: sticky;
  top: clamp(5rem, 15vh, 9rem);
}

.process-heading {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 600;
  font-optical-sizing: none;
  color: var(--color-ink);
  line-height: 1.15;
  text-wrap: balance;
  margin-top: 1rem;
}

.process-steps {
  list-style: none;
  border-top: 1px solid var(--color-border);
}

.process-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
  padding: clamp(2rem, 5vh, 3.5rem) 0;
  border-bottom: 1px solid var(--color-border);
}

.process-num {
  font-family: var(--font-display);
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 600;
  font-optical-sizing: none;
  line-height: 0.9;
  color: var(--color-ink);
}

.process-title {
  color: var(--color-ink);
  display: block;
  margin-bottom: 0.75rem;
}

.process-body {
  color: var(--color-muted);
  line-height: 1.7;
  max-width: 42ch;
}

@media (max-width: 767px) {
  .process {
    grid-template-columns: 1fr;
  }

  .process-head {
    position: static;
  }
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c 'process-step' dist/index.html`
Expected: 4 or more.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Add process section to landing page"
```

---

### Task 2: Big type moment

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: nothing from other tasks; positioned after `section.selected`.
- Produces: `section.bigtype` between selected work and the FAQ (Task 3 inserts the FAQ after it).

- [ ] **Step 1: Add the markup directly after `</section>` of `section.selected`**

```astro
<section class="bigtype" aria-hidden="true">
  <div class="bigtype-line" data-speed="-0.35"><span>DESIGN BUILD</span></div>
  <div class="bigtype-line" data-speed="0.35"><span>AUTOMATE RUN</span></div>
</section>
```

- [ ] **Step 2: Add the styles to the `<style>` block**

```css
/* ---- Big type ---- */
.bigtype {
  overflow: hidden;
  padding: clamp(4rem, 12vh, 9rem) 0;
  background: var(--color-bg);
}

.bigtype-line {
  display: flex;
  justify-content: center;
}

.bigtype-line span {
  font-family: var(--font-display);
  font-size: clamp(4.5rem, 16vw, 15rem);
  font-weight: 600;
  font-optical-sizing: none;
  line-height: 0.95;
  white-space: nowrap;
  color: var(--color-ink);
  transform: translateX(var(--shift, 0px));
  will-change: transform;
}
```

- [ ] **Step 3: Add the scroll-link script as a new `<script>` block in `index.astro`**

```html
<script>
  function armBigtype() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lines = Array.from(
      document.querySelectorAll<HTMLElement>('.bigtype-line')
    )
    if (!lines.length) return

    let ticking = false
    const update = () => {
      ticking = false
      const vh = innerHeight
      for (const line of lines) {
        const rect = line.getBoundingClientRect()
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh
        const speed = parseFloat(line.dataset.speed || '0')
        const span = line.firstElementChild as HTMLElement
        span.style.setProperty('--shift', `${progress * speed * innerWidth}px`)
      }
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    addEventListener('scroll', onScroll, { passive: true })
    update()
  }

  armBigtype()
  document.addEventListener('astro:page-load', armBigtype)
</script>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c 'bigtype-line' dist/index.html`
Expected: 2 or more.

- [ ] **Step 5: Visual check**

Run: `npm run preview`. Scroll through the band: the top line drifts left, the bottom line drifts right, no horizontal scrollbar appears at any width (test at 375 px too). With reduced motion emulated, both lines sit centered and static.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Add scroll-linked big type band"
```

---

### Task 3: FAQ section

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `[data-reveal]`, `.page-label`.
- Produces: `section.faq` after `section.bigtype`. Task 4 inserts the AI strip after it.

- [ ] **Step 1: Add the FAQ data to the frontmatter**

The last answer contains a link, so answers are rendered with `set:html`.

```ts
const faqs = [
  {
    q: 'What kind of projects do you take on?',
    a: 'Mostly internal tools and workflow automation: expense pipelines, approval flows, dashboards. The software your team uses every day but your customers never see. I also build customer facing products end to end when the fit is right.',
  },
  {
    q: 'Can you connect the tools we already use?',
    a: 'Yes, that is usually the whole point. Past projects have talked to accounting software, e-signature services, email, and plain webhooks. If it has an API, or even just an export button, it can join the workflow.',
  },
  {
    q: 'What does a project cost?',
    a: 'I quote a fixed price for a defined scope after we have mapped what the work involves. If the scope grows, we agree on a new price before I build more. You will never find the surprise on an invoice.',
  },
  {
    q: 'How long until something usable?',
    a: 'Weeks, not quarters. I ship a small working version early, your team uses it, and we improve from there.',
  },
  {
    q: 'How much of our time do you need?',
    a: 'A kickoff where I watch how the work is done today, then a short weekly check-in. The people doing the actual work teach me more than any requirements document.',
  },
  {
    q: 'Who runs it after launch?',
    a: 'I do. Hosting, monitoring, fixes, and further automation. If you want to take it in house later, you get the code and a proper handover.',
  },
  {
    q: 'How do we find out if it is a fit?',
    a: 'Send a message through the <a href="/contact">contact page</a> and describe the workflow that annoys you most. If I can help, I will tell you how. If I cannot, I will say so.',
  },
]
```

- [ ] **Step 2: Add the markup after `</section>` of `section.bigtype`**

```astro
<section class="faq">
  <header class="faq-head" data-reveal>
    <span class="page-label">FAQ</span>
    <h2 class="faq-heading">The questions clients ask first.</h2>
  </header>
  <div class="faq-list">
    {faqs.map((item, i) => (
      <details class="faq-item" name="faq" data-reveal style={`--reveal-delay: ${i * 60}ms`}>
        <summary class="faq-question">
          <span>{item.q}</span>
          <span class="faq-icon" aria-hidden="true">+</span>
        </summary>
        <div class="faq-answer">
          <p set:html={item.a} />
        </div>
      </details>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Add the styles to the `<style>` block**

```css
/* ---- FAQ ---- */
.faq {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(2rem, 6vw, 6rem);
  align-items: start;
  padding: clamp(5rem, 12vh, 9rem) clamp(1.5rem, 10vw, 10rem);
  background: var(--color-bg);
}

.faq-heading {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 600;
  font-optical-sizing: none;
  color: var(--color-ink);
  line-height: 1.15;
  text-wrap: balance;
  margin-top: 1rem;
}

.faq-list {
  border-top: 1px solid var(--color-border);
}

.faq-item {
  border-bottom: 1px solid var(--color-border);
}

.faq-question {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 0;
  cursor: pointer;
  list-style: none;
  font-weight: 500;
  color: var(--color-ink);
  transition: color 200ms;
}

.faq-question::-webkit-details-marker {
  display: none;
}

.faq-question:hover {
  color: var(--color-muted);
}

.faq-icon {
  font-family: var(--font-body);
  font-size: 1.25rem;
  line-height: 1;
  color: var(--color-muted);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.faq-item[open] .faq-icon {
  transform: rotate(45deg);
}

.faq-answer {
  overflow: hidden;
  padding: 0 2.75rem 1.5rem 0;
}

.faq-answer p {
  color: var(--color-muted);
  line-height: 1.7;
  max-width: 55ch;
}

.faq-item[open] .faq-answer {
  animation: faq-open 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes faq-open {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
}

@media (max-width: 767px) {
  .faq {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-item[open] .faq-answer {
    animation: none;
  }

  .faq-icon {
    transition: none;
  }
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c 'faq-item' dist/index.html && grep -c 'href="/contact"' dist/index.html`
Expected: both nonzero (7 FAQ items; at least one contact link).

- [ ] **Step 5: Visual check**

Run: `npm run preview`. Open items with mouse and with keyboard (Tab to a question, Enter). Opening one closes the previously open one (native `name="faq"` grouping). Icon rotates to a cross.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Add FAQ accordion to landing page"
```

---

### Task 4: AI summary strip

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `.label` utility from `global.css`.
- Produces: `section.ai-strip`, the final element before `</BaseLayout>`.

- [ ] **Step 1: Add the providers data to the frontmatter**

```ts
const summaryQuery = encodeURIComponent('Summarize https://avp.software')
const aiProviders = [
  { name: 'Google AI Mode', href: `https://www.google.com/search?udm=50&aep=11&q=${summaryQuery}` },
  { name: 'ChatGPT', href: `https://chatgpt.com/?q=${summaryQuery}` },
  { name: 'Claude', href: `https://claude.ai/new?q=${summaryQuery}` },
  { name: 'Perplexity', href: `https://www.perplexity.ai/search?q=${summaryQuery}` },
]
```

- [ ] **Step 2: Add the markup after `</section>` of `section.faq`, as the last content before `</BaseLayout>`**

```astro
<section class="ai-strip" data-reveal>
  <span class="label">Request an AI summary</span>
  <nav class="ai-links" aria-label="AI summary providers">
    {aiProviders.map((p) => (
      <a class="ai-link label" href={p.href} target="_blank" rel="noopener">
        {p.name} <span aria-hidden="true">&#8599;</span>
      </a>
    ))}
  </nav>
</section>
```

- [ ] **Step 3: Add the styles to the `<style>` block**

```css
/* ---- AI summary strip ---- */
.ai-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
  padding: 2.5rem clamp(1.5rem, 10vw, 10rem) 3rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.ai-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.ai-link {
  color: var(--color-muted);
  transition: color 200ms;
}

.ai-link:hover {
  color: var(--color-ink);
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `grep -c 'udm=50' dist/index.html && grep -c 'Summarize%20https%3A%2F%2Favp.software' dist/index.html`
Expected: first is 1; second is 4.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Add AI summary strip"
```

---

### Task 5: robots.txt and llms.txt

**Files:**
- Create: `public/robots.txt`
- Create: `public/llms.txt`

**Interfaces:**
- Consumes: nothing. Astro copies `public/` verbatim into `dist/`.
- Produces: `https://avp.software/robots.txt` and `https://avp.software/llms.txt`.

- [ ] **Step 1: Create `public/robots.txt` with this exact content**

There is no sitemap integration in this repo, so no Sitemap line (the spec forbids pointing at a 404).

```
#
#   +---------+     +---------+     +---------+
#   | INTAKE  | --> | APPROVE | --> |  DONE   |
#   +---------+     +---------+     +---------+
#   | [ ] [ ] |     |   [x]   |     | [x] [x] |
#   +---------+     +---------+     +---------+
#
#   Another card just moved itself. That is the job.
#
#   Humans:   https://avp.software/contact
#   Machines: https://avp.software/llms.txt
#

User-agent: *
Allow: /
```

- [ ] **Step 2: Create `public/llms.txt` with this exact content**

```
# AVP Software

> A small studio that designs and builds software end to end: interface,
> product, and the infrastructure underneath. Focused on internal tools
> and workflow automation for teams.

Run by one person. Projects are quoted at a fixed price for a defined
scope, then hosted and maintained after launch.

## Services

- Map: study the existing workflow before building anything
- Design: internal tools with visible status and adaptive forms
- Build: integrations with accounting, e-signing, email, and webhooks
- Run: hosting, monitoring, and continued automation after launch

## Selected work

- [START Summit x Hack Volunteer Platform](https://avp.software/work/volunteer-platform):
  web platform managing 600+ volunteers; registration, role and shift
  assignment, team management, event-day check-in
- [Crux](https://avp.software/work/crux): product comparison engine that
  normalises specifications with an LLM and renders side-by-side
  comparisons
- [Amber](https://avp.software/work/amber): self-hostable personal
  canvas; markdown files on disk, no database lock-in, AGPL-3.0

## Contact

- [Contact page](https://avp.software/contact)
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `head -3 dist/robots.txt && head -1 dist/llms.txt`
Expected: the kanban art's first lines, then `# AVP Software`.

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt public/llms.txt
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Add ASCII kanban robots.txt and llms.txt"
```

---

### Task 6: Full page verification

**Files:**
- None expected. Fix regressions in `src/pages/index.astro` only if a check fails.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: exits 0, all pages generated (index, about, contact, work, 3 work slugs, 404).

- [ ] **Step 2: Section order check**

Run: `grep -o 'class="\(hero\|process\|selected\|bigtype\|faq\|ai-strip\)"' dist/index.html`
Expected order: hero, process, selected, bigtype, faq, ai-strip.

- [ ] **Step 3: Manual pass via `npm run preview`**

- Scroll top to bottom at desktop width: hero interaction, process steps reveal one at a time with the sticky headline, work rows stagger in, big type drifts in both directions, FAQ operates, AI strip links open prefilled queries in new tabs.
- Repeat at 375 px width: single column process and FAQ, no horizontal scroll anywhere.
- Emulate `prefers-reduced-motion: reduce`: everything visible, nothing moves.
- Disable JavaScript: all content readable, FAQ opens natively, hero shows type on the plain background.
- Navigate to `/about` and back: hero and reveals re-arm (ViewTransitions).

- [ ] **Step 4: Commit any fixes**

```bash
git add src/pages/index.astro
git commit --author="Gt-ace <arthur.s7@gmx.de>" -m "Fix landing page verification findings"
```

Only commit if fixes were needed.
