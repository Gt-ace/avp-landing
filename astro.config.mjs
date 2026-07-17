import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://avp.software',
  output: 'static',
  integrations: [react(), tailwind()],
})
