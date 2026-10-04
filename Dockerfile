# syntax=docker/dockerfile:1
# Bosun web image — fully built in CI; the server only pulls and runs it.
# Next standalone output in a pnpm monorepo (outputFileTracingRoot = repo
# root) produces:
#   <standalone>/node_modules            traced runtime deps
#   <standalone>/apps/web/server.js      the server entrypoint

FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo

# Prime the pnpm store from the lockfile alone so this layer is only busted
# when dependencies change, not on every source edit.
# package.json included so corepack activates the pinned pnpm version
# (packageManager field) before fetching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline

# Build-time env: @crm/config validates env during `next build`. These are
# throwaway values confined to this stage — runtime env comes from Coolify.
# BETTER_AUTH_SECRET goes inline so it never lands in layer metadata
# (SecretsUsedInArgOrEnv build warning).
ENV NODE_ENV=production \
    APP_URL=http://localhost:3000 \
    DATABASE_URL=postgres://build:build@localhost/build \
    DATABASE_ADMIN_URL=postgres://build:build@localhost/build \
    EMAIL_PROVIDER=console
RUN BETTER_AUTH_SECRET=build-time-secret-build-time-secret- \
    pnpm --filter @crm/web build

# --- DB migrator: isolated two-package install (drizzle-kit is dev-only and
# the standalone trace intentionally excludes the migrator module). ---
FROM node:24-alpine AS migrator
WORKDIR /migrate
COPY docker/web/migrator/package.json docker/web/migrator/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Update the bundled npm — its shipped deps lag behind fixes and trip the
# Trivy image gate (brace-expansion/tar/undici CVEs). npm is unused at
# runtime but a green scan must stay meaningful.
RUN npm install -g npm@latest && npm cache clean --force

RUN addgroup -S bosun && adduser -S bosun -G bosun

COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

COPY --from=build /repo/packages/db/migrations /migrate/migrations
COPY --from=migrator /migrate /migrate
COPY docker/web/migrate.mjs /migrate/migrate.mjs
COPY docker/web/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh && chown -R bosun:bosun /app /migrate
USER bosun

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

# entrypoint runs pending migrations, then execs the Next server.
ENTRYPOINT ["./entrypoint.sh"]
