CREATE TABLE "onboarding_checklist" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"steps" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_checklist" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "onboarding_checklist" ADD CONSTRAINT "onboarding_checklist_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_checklist_org_idx" ON "onboarding_checklist" USING btree ("organization_id");--> statement-breakpoint
CREATE POLICY "onboarding_checklist_tenant_isolation" ON "onboarding_checklist" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint

-- FORCE makes the tenant policy apply even to the table owner, matching the
-- posture established in 0002_rls_grants.sql. Table grants to crm_app are
-- already covered by ALTER DEFAULT PRIVILEGES from 0002.
ALTER TABLE "onboarding_checklist" FORCE ROW LEVEL SECURITY;