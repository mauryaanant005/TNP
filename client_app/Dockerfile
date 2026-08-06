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

RUN npm run build

# ---------- Stage 2: Production runner ----------
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html
COPY client_app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
