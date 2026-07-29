# AI Provider Logo Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page's bottom AI provider text links with four grayscale provider logos that open prefilled summary prompts for ChatGPT, Claude, Gemini, and Grok.

**Architecture:** Keep one static provider array in `src/pages/index.astro` with the accessible name, logo path, and provider deep link. Render semantic external links containing fixed-size SVG images. Convert the requested SVG color data at the asset level so no runtime filter or client-side behavior is required.

**Tech Stack:** Astro 4 static page, scoped CSS, static SVG assets, Node test suite, Vitest, and Astro build.

## Global Constraints

- Use the exact prompt `Summarize https://thesoftware.company` and encode it with `encodeURIComponent`.
- Use ChatGPT `https://chatgpt.com/?q=`, Claude `https://claude.ai/new?q=`, Gemini `https://gemini.google.com/app?prompt=`, and Grok `https://grok.com/?q=`.
- Keep the existing `Request an AI summary` label and external links with `target="_blank"` and `rel="noopener"`.
- Preserve provider names as image `alt` text for accessible link names.
- Modify only `src/pages/index.astro` and the four requested SVGs, plus this plan/spec documentation.
- Do not add dependencies, client-side state, or unrelated landing-page changes.

---

### Task 1: Convert provider logo assets to grayscale

**Files:**
- Modify: `public/logos/chatgpt.svg`
- Modify: `public/logos/claude.svg`
- Modify: `public/logos/gemini.svg`
- Modify: `public/logos/grok.svg`

**Interfaces:** Produces four 128×128 SVG assets with grayscale visible fills and unchanged path geometry/view boxes.

- [ ] **Step 1: Inspect current colors**

  Run `rg -o "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}\\b" public/logos/chatgpt.svg public/logos/claude.svg public/logos/gemini.svg public/logos/grok.svg | sort -u`.
  Expected: Claude and Gemini contain colored values; ChatGPT and Grok are already black/white.

- [ ] **Step 2: Replace colored values**

  In `public/logos/claude.svg`, replace `#D97757` with `#707070`.

  In `public/logos/gemini.svg`, replace the colored gradient stops with these neutral stops while preserving both gradient definitions and their geometry:

  ```svg
  <stop stop-color="#4A4A4A"/>
  <stop offset="0.14" stop-color="#5B5B5B"/>
  <stop offset="0.27" stop-color="#6B6B6B"/>
  <stop offset="0.52" stop-color="#7C7C7C"/>
  <stop offset="0.78" stop-color="#8D8D8D"/>
  <stop offset="0.89" stop-color="#9A9A9A"/>
  <stop offset="1" stop-color="#A6A6A6"/>
  ```

  Keep ChatGPT and Grok geometrically unchanged because their visible fills are already grayscale. Do not add CSS filters or alter view boxes.

- [ ] **Step 3: Verify asset colors and dimensions**

  Run `rg -n "width=\"128\" height=\"128\" viewBox=\"0 0 128 128\"" public/logos/chatgpt.svg public/logos/claude.svg public/logos/gemini.svg public/logos/grok.svg` and rerun the color command from Step 1.
  Expected: all four files retain 128×128 dimensions/view boxes and only black, white, or gray color values remain.

- [ ] **Step 4: Commit the asset-only change**

  Run `git add public/logos/chatgpt.svg public/logos/claude.svg public/logos/gemini.svg public/logos/grok.svg && git commit -m "feat: make AI provider logos grayscale"`.

---

### Task 2: Render the four logos in the landing-page summary strip

**Files:**
- Modify: `src/pages/index.astro` provider data near lines 54–63
- Modify: `src/pages/index.astro` AI links near lines 143–151
- Modify: `src/pages/index.astro` AI strip styles near lines 340–365

**Interfaces:** Consumes the four SVG paths from Task 1 and produces a static `aiProviders` array with `{ name, logo, href }` entries.

- [ ] **Step 1: Replace the provider data**

  Replace the current block with:

  ```astro
  const summaryQuery = encodeURIComponent("Summarize https://thesoftware.company")
  const aiProviders = [
    { name: "ChatGPT", logo: "/logos/chatgpt.svg", href: `https://chatgpt.com/?q=${summaryQuery}` },
    { name: "Claude", logo: "/logos/claude.svg", href: `https://claude.ai/new?q=${summaryQuery}` },
    { name: "Gemini", logo: "/logos/gemini.svg", href: `https://gemini.google.com/app?prompt=${summaryQuery}` },
    { name: "Grok", logo: "/logos/grok.svg", href: `https://grok.com/?q=${summaryQuery}` },
  ]
  ```

- [ ] **Step 2: Replace text labels with accessible image links**

  Replace the current `.ai-links` map with:

  ```astro
  <nav class="ai-links" aria-label="AI summary providers">
    {aiProviders.map((p) => (
      <a class="ai-link" href={p.href} target="_blank" rel="noopener">
        <img src={p.logo} alt={p.name} width="128" height="128" loading="lazy" />
      </a>
    ))}
  </nav>
  ```

  The image `alt` value supplies the accessible name of each link; no provider name is duplicated visually.

- [ ] **Step 3: Style the logo row and states**

  Replace the existing `.ai-links` and `.ai-link` rules with:

  ```css
  .ai-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem clamp(1.25rem, 3vw, 2.5rem);
  }

  .ai-link {
    display: inline-flex;
    width: clamp(3.25rem, 5vw, 4.5rem);
    aspect-ratio: 1;
    align-items: center;
    justify-content: center;
    opacity: 0.64;
    transition: opacity 200ms ease-out, transform 200ms ease-out;
  }

  .ai-link img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .ai-link:hover,
  .ai-link:focus-visible {
    opacity: 1;
    transform: translateY(-0.125rem);
  }

  .ai-link:focus-visible {
    outline: 2px solid var(--color-coral);
    outline-offset: 0.3rem;
  }
  ```

  Keep the existing `.ai-strip` layout and border. In the reduced-motion block add `.ai-link { transition: none; }`.

- [ ] **Step 4: Run a source regression check**

  Run `rg -n "Google AI Mode|Perplexity|chatgpt\\.com|claude\\.ai|gemini\\.google\\.com|grok\\.com|alt=\\{p\\.name\\}" src/pages/index.astro`.
  Expected: only ChatGPT, Claude, Gemini, and Grok remain; no Google AI Mode or Perplexity entry remains.

- [ ] **Step 5: Commit the landing-page change**

  Run `git add src/pages/index.astro && git commit -m "feat: link landing page AI logos to summaries"`.

---

### Task 3: Verify the complete landing page change

**Files:** Test generated Astro output and existing repository test suites.

**Interfaces:** Consumes the committed asset and page changes and produces verified static output ready to integrate into `main`.

- [ ] **Step 1: Run the direct motion test**

  Run `node --test tests/bigtype-motion.test.mjs`.
  Expected: 1 test passes and 0 failures.

- [ ] **Step 2: Run Vitest without the Node test file**

  Run `npx vitest run --exclude='**/bigtype-motion.test.mjs'`.
  Expected: 3 test files pass and 20 tests pass.

- [ ] **Step 3: Build the static site**

  Run `npm run build`.
  Expected: Astro exits with code 0 and writes the site to `dist/`.

- [ ] **Step 4: Inspect generated HTML**

  Run `rg -n "Request an AI summary|chatgpt\\.com|claude\\.ai|gemini\\.google\\.com|grok\\.com|logos/(chatgpt|claude|gemini|grok)\\.svg" dist/index.html`.
  Expected: four logo links and four encoded provider URLs are present; no Perplexity or Google AI Mode entry remains.

- [ ] **Step 5: Check the final diff**

  Run `git diff --check main...HEAD`, then `git status --short --branch`, then `git log --oneline --decorate -4`.
  Expected: no whitespace errors, only the intended spec/plan, four SVGs, and `src/pages/index.astro` are changed, and the feature commits are present on `feat/ai-provider-logos`.

---

### Task 4: Integrate the verified feature into production

**Files:** Git refs only; no additional source files.

**Interfaces:** Consumes the verified `feat/ai-provider-logos` branch and produces `main` containing the feature commits for the existing deploy workflow.

- [ ] **Step 1: Confirm `main` has not advanced unexpectedly**

  Run `git fetch origin main`, then `git log --oneline --decorate -2 main origin/main`.
  If `origin/main` contains commits not present in the feature branch, rebase or merge those changes before integration and rerun Task 3.

- [ ] **Step 2: Fast-forward `main`**

  Run `git branch --force main feat/ai-provider-logos`, then `git log --oneline --decorate -3 main`.
  Expected: `main` points at the latest feature commit with the design, asset, and page commits in its history.

- [ ] **Step 3: Push `main`**

  Run `git push origin main`.
  Expected: the existing `.github/workflows/deploy.yml` is triggered by the updated `main` branch.

- [ ] **Step 4: Record the production handoff**

  Run `git status --short --branch`, then `git log --oneline --decorate -3`.
  Expected: local `main` is clean and aligned with `origin/main`; report the pushed commit SHA and that deployment is handled by the existing GitHub Actions workflow.
