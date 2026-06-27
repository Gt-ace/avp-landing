# CLAUDE.md — avp.software landing

Shared brain for every Claude Code session on this project. Read before
writing code. The infra pattern here is **locked** by `setup.md` (the prompt
that stood this repo up) and is the first re-user of the Crux deploy
pattern. Do not re-litigate it without reading that prompt first.

## What this repo is

The static landing site for `avp.software`. Right now it serves a single
placeholder string ("avp.software") and nothing else. The site content,
framework choice, and design language are **deferred to a later design
phase** — do not start on them in this repo until the user explicitly says
so. A separate design-phase prompt will land the real work.

## Stack (infra — locked, mirrors Crux)

- Static site, served by `nginx:alpine` in a container
- Container name `avp-landing`, internal port 80, no published host ports
- Joins the existing `amber_default` Docker network as `external: true`
- Image: `ghcr.io/gt-ace/avp-landing`, tagged by git SHA + `latest`,
  pushed public (the image carries no secrets by design)
- Caddy route for `avp.software` is added to the shared
  `/home/amber/Amber/Caddyfile` (in-container `/etc/caddy/Caddyfile`)

## Locked architectural decisions

1. **The box never builds.** GitHub Actions builds the image; the box only
   pulls and runs. The shared box is 4GB / 40GB and serves live traffic;
   building on it is not safe. Same rule as Crux.

2. **Reuse the existing shared Caddy; do not start another proxy.** The
   container joins `amber_default` and `amber-caddy-1` routes
   `avp.software` to it. Adding a future project = one more route block
   + that project joining the network. Never disturb the Amber, Jellyfin,
   or Crux routes.

3. **The Dockerfile is two-stage on purpose.** Stage 1 is `builder` and
   owns the static site output. Stage 2 is `runner` and serves it with
   nginx. The design phase will replace the builder's contents (npm
   install + build into `dist/`, or equivalent for whatever framework is
   chosen) without touching the serving stage.

4. **The image is public.** No secrets in the image, no secrets in the
   build context, no env_file on the box. CI holds only the SSH key (to
   reach the box) and the GHCR token (auto via `GITHUB_TOKEN`).

5. **Tags by git SHA + `latest`.** Rollback = point compose at a previous
   SHA and restart. The deploy workflow prunes images older than ~1 week
   so the shared 40GB disk does not fill up.

6. **Caddyfile edit discipline.** Make a timestamped backup first, then
   add **one** block, validate, then `caddy reload` (not restart). If
   reload fails, restore the backup and reload again. The shared Caddy
   serves other live services; do not bounce it.

7. **DNS is owned by the user.** We never touch the DNS provider. We
   verify the A record resolves before asking Caddy to issue a cert.
   Without DNS pointing at the box, the Let's Encrypt challenge fails and
   HTTPS will not be provisioned.

## Repo layout

```
.
├── .dockerignore
├── .github/workflows/deploy.yml   # build, push to GHCR, prune, deploy
├── .gitignore
├── CLAUDE.md                      # this file
├── Dockerfile                     # 2-stage: builder -> nginx:alpine
├── README.md
├── docker-compose.yml             # run definition; lives on the box at
│                                  #   ~/apps/avp-landing/docker-compose.yml
└── index.html                     # placeholder; design phase will replace
```

## Deployment & CI/CD (locked, mirrors Crux)

Lives on the Hetzner CX23 box (4GB RAM, 40GB disk), which also runs
Jellyfin, Amber, and Crux (`crux.avp.software`). The small, shared box
drives the core rule below.

**Box facts (locked):**

- A single shared Caddy already owns 80/443: container `amber-caddy-1`,
  image `caddy:2`, part of the Amber stack. We do NOT run a second proxy.
- Shared Docker network: `amber_default` (external; our container joins it).
- Amber's Caddyfile: host `/home/amber/Amber/Caddyfile`, in-container
  `/etc/caddy/Caddyfile`. We add one route block here and reload Caddy.
- Our container: name `avp-landing`, internal port 80, no public ports.
- Reload after editing:
  `docker exec amber-caddy-1 caddy reload --config /etc/caddy/Caddyfile`
  (validate first with `caddy validate`; back up the Caddyfile before
  editing).

**The flow:** push to `main` → Actions builds the image → pushes to GHCR
→ SSHes to the box → `cd ~/apps/avp-landing && docker compose pull && up
-d` → Caddy already serving it over HTTPS once DNS resolves.

### CI secrets (set on the GitHub repo, not in code)

| Secret | Purpose |
|--------|---------|
| `SSH_HOST` | Box IP, e.g. `178.105.56.249` |
| `SSH_USER` | SSH user on the box, e.g. `amber` |
| `SSH_KEY` | Private key for that user, base64 of the file is fine but raw PEM is the default |
| `GITHUB_TOKEN` | Auto-provided by Actions; needs `packages: write` permission (granted via the workflow's `permissions:` block) |

## First-time box setup (one-time, on the box)

The `deploy.yml` workflow assumes the run definition lives at
`~/apps/avp-landing/docker-compose.yml`. On a fresh box that directory
must exist before the first deploy runs (otherwise the first SSH step
fails on `cd ~/apps/avp-landing`). The shipped `docker-compose.yml` in
this repo IS that file — copy it onto the box before the first push:

```sh
# from a local checkout
scp docker-compose.yml amber@178.105.56.249:~/apps/avp-landing/docker-compose.yml
# on the box
ssh amber@178.105.56.249
mkdir -p ~/apps/avp-landing
# (scp above lands the file in the right place)
```

After that, every push to `main` redeploys.

## DNS

The apex `avp.software` needs an A record pointing at `178.105.56.249`.
`crux.avp.software` already resolves to that IP, so the zone exists.
Until the apex resolves, Caddy will not be able to issue a Let's Encrypt
cert. Add the record, wait for TTL, then ask Claude to reload Caddy.

## What is NOT in this repo yet (deferred to the design phase)

- Real content (hero, about, projects, contact, copy)
- Design language, typography, color, motion
- Framework choice (Astro / Next static export / Eleventy / plain HTML)
- The build stage of the Dockerfile (a framework will populate it)
- Sections, project grid, contact form, video hero, etc.
- Favicon, OG image, social cards
