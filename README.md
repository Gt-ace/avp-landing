# avp.software

Landing site for `avp.software`, served from the same Hetzner box as
Amber, Jellyfin, and Crux (`crux.avp.software`).

## Status

Walking skeleton. A one-line placeholder is live and the deploy pipeline
runs end to end. Real site content, framework, and design are deferred to a
later phase — see [CLAUDE.md](./CLAUDE.md).

## Deploy

Push to `main` → GitHub Actions builds the image, pushes to GHCR, SSHes to
the box, and `docker compose pull && up -d`. The box never builds. The
shared Caddy (`amber-caddy-1`) serves it over HTTPS once DNS resolves.
