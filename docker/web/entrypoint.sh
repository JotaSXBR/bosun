#!/bin/sh
set -e

# Apply pending DB migrations before accepting traffic. Idempotent; runs on
# every deploy. Skip with SKIP_DB_MIGRATE=true (e.g. debugging a shell).
if [ "${SKIP_DB_MIGRATE:-}" != "true" ]; then
  echo "entrypoint: applying database migrations"
  node /migrate/migrate.mjs
fi

cd /app/apps/web
exec node server.js
