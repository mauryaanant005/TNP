# Frontend-only image (React/Vite build served by Nginx).
# Build context is the repo root (see docker-compose.yml), so paths below
# are prefixed with client_app/.

# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY client_app/package.json client_app/package-lock.json ./
RUN npm ci

COPY client_app/ .

# Vite inlines VITE_* env vars at build time, so the API's origin must be
# baked in as a build arg rather than read at container runtime.
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Node sizes its heap from the *host's* total RAM, not from what the container
# is actually allowed to use, and `tsc -b && vite build` over ~3500 modules is
# the single hungriest step in a deploy. Left uncapped it will happily grow
# until the kernel OOM-kills something - and on a small host the victim is
# usually dockerd or MySQL, not this build, which is why a failing deploy takes
# the whole server with it.
#
# 1536 MB is comfortably above what this bundle needs and low enough to leave
# room for the backend image building alongside it.
ENV NODE_OPTIONS=--max-old-space-size=1536

RUN npm run build

# ---------- Stage 2: Production runner ----------
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html
COPY client_app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
