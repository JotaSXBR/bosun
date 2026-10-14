CREATE TABLE "contact_labels" (
	"organization_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_labels_contact_id_label_id_pk" PRIMARY KEY("contact_id","label_id")
);
--> statement-breakpoint
ALTER TABLE "contact_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "macros" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "macros" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_labels" ADD CONSTRAINT "contact_labels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_labels" ADD CONSTRAINT "contact_labels_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_labels" ADD CONSTRAINT "contact_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "macros" ADD CONSTRAINT "macros_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "macros" ADD CONSTRAINT "macros_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_labels_org_idx" ON "contact_labels" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contact_labels_label_idx" ON "contact_labels" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "macros_org_name_idx" ON "macros" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "macros_org_idx" ON "macros" USING btree ("organization_id");--> statement-breakpoint
CREATE POLICY "contact_labels_tenant_isolation" ON "contact_labels" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "macros_tenant_isolation" ON "macros" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint

-- FORCE makes the tenant policy apply even to the table owner, matching the
-- posture established in 0002_rls_grants.sql. Table grants to crm_app are
-- already covered by ALTER DEFAULT PRIVILEGES from 0002.
ALTER TABLE "contact_labels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "macros" FORCE ROW LEVEL SECURITY;
