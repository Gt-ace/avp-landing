# avp.software

Landing site for `avp.software`, served from the same Hetzner box as
Amber, Jellyfin, and Crux (`crux.avp.software`).

## Stack

Astro, with React islands and Tailwind for styling. Static output, served
by `nginx:alpine` in a container.

## Pages

Home, `/work` (project list + detail pages), `/about`, `/contact`.

## Dev

```sh
npm install
npm run dev
```

## Deploy

Push to `main` → GitHub Actions builds the image, pushes to GHCR, SSHes to
the box, and `docker compose pull && up -d`. The box never builds. The
shared Caddy (`amber-caddy-1`) serves it over HTTPS once DNS resolves.

## Contributors

- [gt-ace](https://github.com/gt-ace)
