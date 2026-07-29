import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const page = await readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8")

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

test("landing page exposes four prefilled AI provider logo links", () => {
  assert.match(page, /encodeURIComponent\("Summarize https:\/\/avp\.software"\)/)

  for (const [name, logo, host] of [
    ["ChatGPT", "/logos/chatgpt.svg", "https://chatgpt.com/?q="],
    ["Claude", "/logos/claude.svg", "https://claude.ai/new?q="],
    ["Gemini", "/logos/gemini.svg", "https://gemini.google.com/app?prompt="],
    ["Grok", "/logos/grok.svg", "https://grok.com/?q="],
  ]) {
    assert.match(page, new RegExp(`name: "${escapeRegex(name)}"`))
    assert.match(page, new RegExp(`logo: "${escapeRegex(logo)}"`))
    assert.match(page, new RegExp(escapeRegex(host)))
  }

  assert.match(
    page,
    /<img src=\{p\.logo\} alt=\{p\.name\} width="128" height="128"/,
  )
})
