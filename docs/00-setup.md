# Task 00: Project scaffold

Bootstrap the Astro project in `/home/gtace/avp-landing`. The existing `Dockerfile`, `.github/`, `docker-compose.yml`, `CLAUDE.md`, and `README.md` must not be touched.

---

## 1. package.json (create in project root)

```json
{
  "name": "avp-landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "@astrojs/react": "^3.6.0",
    "@astrojs/tailwind": "^5.1.0",
    "framer-motion": "^11.11.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.14"
  }
}
```

## 2. astro.config.mjs (create in project root)

```js
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'static',
  integrations: [react(), tailwind()],
})
```

## 3. tailwind.config.cjs (create in project root)

```js
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bodoni Moda', 'Georgia', 'serif'],
        body: ['PP Neue Montreal', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

## 4. tsconfig.json (create in project root)

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

## 5. .gitignore (update — add these lines if not present)

```
node_modules
dist
.astro
*.log
```

## 6. .dockerignore (update — add `.astro` if not present)

The existing `.dockerignore` already excludes `node_modules` and `dist`. Add `.astro` to it.

## 7. Dockerfile — update builder stage only

Replace only the `builder` stage. The `runner` stage (nginx:alpine) is unchanged. The final Dockerfile must look exactly like this:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 8. Directory structure to create

Create these empty directories and placeholder files so subsequent tasks can fill them:

```
src/
  components/     (empty)
  data/           (empty)
  layouts/        (empty)
  pages/
    work/         (empty)
  styles/         (empty)
public/
  fonts/          (empty — font files added manually)
  images/         (empty)
```

## 9. Asset setup commands

Run these shell commands from the project root:

```bash
mkdir -p public/images public/fonts src/components src/data src/layouts src/pages/work src/styles

# Copy project preview images
cp /home/gtace/Personal-Portfolio-Website/attached_assets/projects/volunteer-platform.avif public/images/
cp /home/gtace/Personal-Portfolio-Website/attached_assets/projects/crux.avif public/images/
cp /home/gtace/Personal-Portfolio-Website/attached_assets/projects/amber.avif public/images/

# Move hero video to public
mv hero2.webm public/hero2.webm
```

## 10. Run install

```bash
npm install
```

## Verification

- `npm run dev` starts without errors (will show blank page — pages come in later tasks)
- `public/images/` contains the three `.avif` files
- `public/hero2.webm` exists
- `node_modules/` contains `astro`, `framer-motion`, `react`
