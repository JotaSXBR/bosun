#!/bin/sh
set -e

# Apply pending DB migrations before accepting traffic. Idempotent; runs on
# every deploy. Skip with SKIP_DB_MIGRATE=true (e.g. debugging a shell).
if [ "${SKIP_DB_MIGRATE:-}" != "true" ]; then
  echo "entrypoint: applying database migrations"
  node /migrate/migrate.mjs
fi

# DATABASE_ADMIN_URL is migration-only: the app must never see the owner
# role (it bypasses RLS). Drop it before exec so it cannot leak into the
# runtime process env.
unset DATABASE_ADMIN_URL

cd /app/apps/web
exec node server.js
