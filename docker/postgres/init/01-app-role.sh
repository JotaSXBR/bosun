#!/bin/sh
# Creates the least-privileged application role `crm_app`.
# The app connects as crm_app so row-level security applies; the owner role
# (POSTGRES_USER) bypasses RLS and is used only for migrations/grants.
set -e

APP_PASSWORD="${CRM_APP_PASSWORD:-crm_app}"

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v app_password="$APP_PASSWORD" <<-SQL
  CREATE ROLE crm_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOBYPASSRLS;
  GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO crm_app;
  GRANT USAGE ON SCHEMA public TO crm_app;
SQL
