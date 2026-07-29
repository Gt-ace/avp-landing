# AI Provider Logo Links Design

## Goal

Replace the landing page's bottom AI summary provider text links with four
grayscale provider logos: ChatGPT, Claude, Gemini, and Grok. Each logo remains
an external link that opens the provider with a prefilled prompt to summarize
`https://thesoftware.company`.

## Scope

- Convert the four provider SVG assets to a grayscale visual treatment at the
  asset level so they remain monochrome wherever reused.
- Replace the existing Google AI Mode, ChatGPT, Claude, and Perplexity entries
  with ChatGPT, Claude, Gemini, and Grok.
- Keep the existing `Request an AI summary` label and external-link behavior.
- Use the shared prompt `Summarize https://thesoftware.company`, encoded by
  `encodeURIComponent` before inserting it into each provider URL.
- Preserve accessible provider names through image `alt` text and link
  semantics.
- Keep the strip responsive across mobile and desktop widths, with visible
  hover and keyboard focus states.

## Provider links

The page will generate one encoded prompt and use these destinations:

| Provider | URL pattern | Logo |
| --- | --- | --- |
| ChatGPT | `https://chatgpt.com/?q=${summaryQuery}` | `/logos/chatgpt.svg` |
| Claude | `https://claude.ai/new?q=${summaryQuery}` | `/logos/claude.svg` |
| Gemini | `https://gemini.google.com/app?prompt=${summaryQuery}` | `/logos/gemini.svg` |
| Grok | `https://grok.com/?q=${summaryQuery}` | `/logos/grok.svg` |

The links open in a new tab with `rel="noopener"`. The visible control is the
logo image, and its `alt` value is the provider name so assistive technology
receives the same label that the old text link provided.

## Visual treatment

The existing editorial monochrome system remains authoritative. The SVG path
geometry and view boxes stay unchanged. Claude's orange fill and Gemini's blue-
purple gradient stops become neutral gray values; ChatGPT and Grok remain
monochrome. The provider row uses a consistent optical logo size, wraps on
narrow screens, and increases contrast on hover/focus without adding color.

Focus indicators use the site's existing ink/coral visual language and do not
rely on color alone: the focused link receives a visible outline, while the
logo remains identifiable by shape and its accessible name.

## Implementation boundaries

- Modify `src/pages/index.astro` for provider data, semantic image links, and
  AI strip styling.
- Modify only the four requested files in `public/logos/` for asset-level
  grayscale changes.
- Do not change the hero, process, FAQ, or project data.
- Do not add a dependency or a client-side interaction for the provider row.

## Verification

- Run `node --test tests/bigtype-motion.test.mjs`.
- Run `npx vitest run --exclude='**/bigtype-motion.test.mjs'`.
- Run `npm run build`.
- Inspect the generated page for four logo images, correct `alt` labels,
  encoded prompt URLs, and no remaining Perplexity or Google AI Mode provider
  entry.
- Check the row at mobile and desktop widths, including keyboard focus.
