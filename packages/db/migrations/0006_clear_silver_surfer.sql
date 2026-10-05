CREATE TABLE "ticket_counters" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"value" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ticket_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX "conversations_connection_external_idx";--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "ticket_counter" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "preceded_by_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "ticket_number" bigint;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "ticket_seq" bigint;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "first_response_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ticket_counters" ADD CONSTRAINT "ticket_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_preceded_by_id_conversations_id_fk" FOREIGN KEY ("preceded_by_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_org_status_idx" ON "conversations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_connection_external_idx" ON "conversations" USING btree ("channel_connection_id","external_id") WHERE "conversations"."status" != 'resolved';--> statement-breakpoint
CREATE POLICY "ticket_counters_tenant_isolation" ON "ticket_counters" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint

-- Backfill ticket sequences on pre-existing rows: per-org ticket_number,
-- per-contact ticket_seq, then the counters continue from the maxima.
WITH ranked_org AS (
  SELECT id, row_number() OVER (PARTITION BY organization_id ORDER BY created_at, id) AS rn
  FROM "conversations"
)
UPDATE "conversations" c SET "ticket_number" = r.rn FROM ranked_org r WHERE c.id = r.id;--> statement-breakpoint
WITH ranked_contact AS (
  SELECT id, row_number() OVER (PARTITION BY contact_id ORDER BY created_at, id) AS rn
  FROM "conversations"
)
UPDATE "conversations" c SET "ticket_seq" = r.rn FROM ranked_contact r WHERE c.id = r.id;--> statement-breakpoint
UPDATE "contacts" ct SET "ticket_counter" = (
  SELECT coalesce(max(ticket_seq), 0) FROM "conversations" WHERE contact_id = ct.id
);--> statement-breakpoint
INSERT INTO "ticket_counters" ("organization_id", "value")
SELECT organization_id, max(ticket_number) FROM "conversations" GROUP BY organization_id;--> statement-breakpoint
UPDATE "conversations" SET "resolved_at" = "updated_at" WHERE "status" = 'resolved';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "ticket_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "ticket_seq" SET NOT NULL;--> statement-breakpoint

-- FORCE makes the tenant policy apply even to the table owner, matching the
-- posture established in 0002_rls_grants.sql. Table grants to crm_app are
-- already covered by ALTER DEFAULT PRIVILEGES from 0002.
ALTER TABLE "ticket_counters" FORCE ROW LEVEL SECURITY;