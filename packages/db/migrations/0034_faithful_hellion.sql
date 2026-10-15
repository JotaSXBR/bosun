CREATE TABLE "external_connections" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bundle_encrypted" text NOT NULL,
	"account_email" text,
	"last_checked_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "external_connections" ADD CONSTRAINT "external_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "external_connections_org_provider_idx" ON "external_connections" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE POLICY "external_connections_tenant_isolation" ON "external_connections" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
ALTER TABLE "external_connections" FORCE ROW LEVEL SECURITY;
