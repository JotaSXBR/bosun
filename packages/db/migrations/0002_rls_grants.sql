-- Tenant isolation hardening + privileges for the crm_app role.
--
-- RLS posture: tenant-owned tables (audit_logs and future domain tables)
-- enable and FORCE RLS; Better Auth tables (users, sessions, accounts,
-- verifications, organizations, organization_members, organization_invitations)
-- intentionally have NO RLS — auth lookups run before a tenant context exists
-- and are authorized by Better Auth itself.
--
-- FORCE makes the policy apply even to the table owner, so only BYPASSRLS
-- roles (the `crm` owner used for migrations) or `platform_scope` transactions
-- can cross tenant boundaries.

ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_app;
--> statement-breakpoint

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_app;
--> statement-breakpoint

-- Future tables created by the owner (migrations) are covered automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO crm_app;
--> statement-breakpoint

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO crm_app;
