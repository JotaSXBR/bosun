-- Match the tenant-table hardening posture (0002_rls_grants.sql): FORCE makes
-- the platform-scope policy apply even to the table owner, so only BYPASSRLS
-- migration roles or `withPlatformScope` transactions reach these rows.
ALTER TABLE "platform_settings" FORCE ROW LEVEL SECURITY;
