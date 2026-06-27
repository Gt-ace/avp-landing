# Static placeholder served by nginx:alpine on internal port 80.
#
# Two-stage shape: a `builder` stage owns the static site, a `runner` stage
# serves it. The design phase will replace the builder's contents (npm build
# into a dist/ directory, for example) without touching the serving stage.
# The runner is intentionally minimal: no secrets, no config beyond the
# default nginx root, no build tooling on the final image.

# 1. Builder: holds the static site. Today it is the placeholder; later it
# will be the framework build output. Everything the runner needs ends up at
# /site/ here.
FROM node:22-alpine AS builder
WORKDIR /src
# In the design phase this becomes a framework install + build:
#   COPY package.json package-lock.json* ./
#   RUN npm ci
#   COPY . .
#   RUN npm run build && cp -r dist/* /site/
# For now the placeholder is a single committed file.
RUN mkdir -p /site
COPY index.html /site/index.html

# 2. Runner: nginx:alpine serves /site on port 80. Internal only — the
# shared Caddy on the box reaches it over the amber_default network by
# container name. No host ports are published.
FROM nginx:1.27-alpine AS runner
COPY --from=builder /site /usr/share/nginx/html
EXPOSE 80
