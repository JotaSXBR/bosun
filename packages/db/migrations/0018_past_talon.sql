CREATE TABLE "memory_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"scope" text DEFAULT 'org' NOT NULL,
	"team_id" uuid,
	"contact_id" uuid,
	"content" text NOT NULL,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"sources" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'canon' NOT NULL,
	"superseded_by" uuid,
	"stale_after" timestamp with time zone NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memory_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_suggestions" ADD COLUMN "proposed_by" uuid;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "brain_access" text DEFAULT 'off' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "brain_types" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_superseded_by_memory_entries_id_fk" FOREIGN KEY ("superseded_by") REFERENCES "public"."memory_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memory_entries_org_status_idx" ON "memory_entries" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "memory_entries_org_scope_idx" ON "memory_entries" USING btree ("organization_id","scope");--> statement-breakpoint
CREATE INDEX "memory_entries_contact_idx" ON "memory_entries" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "memory_entries_team_idx" ON "memory_entries" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "agent_suggestions" ADD CONSTRAINT "agent_suggestions_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "memory_entries_tenant_isolation" ON "memory_entries" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');