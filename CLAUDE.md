# CLAUDE.md: avp.software landing

Shared brain for every Claude Code session on this repo. The infra
pattern is **locked** by `setup.md` (the prompt that stood this repo up)
and mirrors the Crux deploy pattern. Do not re-litigate it.

## What this repo is

The live landing site for `avp.software` (DNS resolves, HTTPS is up).
The design phase is complete: an Astro static site with React islands
and Tailwind. Pages: home, `/work` (project list plus `[slug]` detail
pages), `/about`, `/contact`.

## Stack and layout

- Astro 4 (`output: 'static'`), `@astrojs/react`, `@astrojs/tailwind`,
  Framer Motion
- `src/pages/`: `index`, `about`, `contact`, `work/index`,
  `work/[slug]` (all `.astro`)
- `src/layouts/BaseLayout.astro`: shared shell every page inherits
- `src/components/NavPill.tsx`: React island (`client:load`), the only
  interactive nav; `src/components/LogoMarquee.astro`
- `src/data/projects.ts`: drives the `/work` list and detail pages
- `src/styles/global.css`: design tokens; assets in `public/`
- `docs/00-setup.md` through `docs/03-pages.md`: the original
  design-phase task specs (scaffold, design system, NavPill, pages);
  `docs/inspo/`: reference screenshots

## Dev

`npm install`, then `npm run dev`. `npm run build` outputs to `dist/`,
`npm run preview` serves the build.

## Infra (locked, mirrors Crux)

Runs on the shared Hetzner CX23 box (4GB RAM, 40GB disk) alongside
Jellyfin, Amber, and Crux (`crux.avp.software`).

1. **The box never builds.** GitHub Actions builds the image; the box
   only pulls and runs. Building on the small shared box serving live
   traffic is not safe.
2. **One shared proxy.** Our container `avp-landing` (nginx:alpine,
   internal port 80, no published host ports) joins the external
   `amber_default` network. The existing `amber-caddy-1` (caddy:2, part
   of the Amber stack) owns 80/443 and routes `avp.software` to it.
   Never run a second proxy; never disturb the Amber, Jellyfin, or Crux
   routes.
3. **Two-stage Dockerfile.** `builder` (node:20-alpine, `npm ci && npm
   run build`) then `runner` (nginx:alpine serving `dist/`).
4. **The image is public.** `ghcr.io/gt-ace/avp-landing`, tagged by git
   SHA plus `latest`. No secrets in the image, build context, or on the
   box via env_file. CI holds only the SSH key and the auto-provided
   `GITHUB_TOKEN`.
5. **Rollback** = point the box's compose file at a previous SHA tag
   and restart. The deploy workflow prunes images older than ~1 week so
   the shared disk does not fill.
6. **Caddyfile edit discipline.** Amber's Caddyfile: host
   `/home/amber/Amber/Caddyfile`, in-container
   `/etc/caddy/Caddyfile`. Make a timestamped backup, edit one block,
   `caddy validate`, then
   `docker exec amber-caddy-1 caddy reload --config /etc/caddy/Caddyfile`
   (reload, never restart). If reload fails, restore the backup and
   reload again.
7. **DNS is owned by the user.** Never touch the DNS provider; verify a
   record resolves before asking Caddy to issue a cert for it.

## Deploy

Push to `main` and `.github/workflows/deploy.yml` builds the image,
pushes it to GHCR, SSHes to the box, and runs
`cd ~/apps/avp-landing && docker compose pull && docker compose up -d`,
then prunes old images. Third-party actions are pinned to full commit
SHAs on purpose; keep them pinned when updating.

The run definition on the box is `~/apps/avp-landing/docker-compose.yml`
(already installed; this repo's `docker-compose.yml` is that file). If
it ever goes missing, `scp` it back before the next deploy.

CI secrets on the GitHub repo: `SSH_HOST` (box IP `178.105.56.249`),
`SSH_USER` (`amber`), `SSH_KEY` (private key, raw PEM).
