import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import svelte from '@astrojs/svelte'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://avp.software',
  output: 'static',
  // Svelte earns its place on /about only: @jis3r/icons is a Svelte package,
  // and Astro code-splits island runtimes per page, so no other route pays for
  // it. Every other island on the site stays React.
  integrations: [react(), svelte(), tailwind()],
})
