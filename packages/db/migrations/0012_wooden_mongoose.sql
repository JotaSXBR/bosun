CREATE TABLE "message_edits" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"previous_content" jsonb NOT NULL,
	"edited_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_edits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"reactor_key" text NOT NULL,
	"emoji" text NOT NULL,
	"actor_user_id" uuid,
	"actor_channel_user_id" text,
	"from_me" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_reactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_edits" ADD CONSTRAINT "message_edits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_edits" ADD CONSTRAINT "message_edits_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_edits" ADD CONSTRAINT "message_edits_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_edits_message_idx" ON "message_edits" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_reactions_message_reactor_idx" ON "message_reactions" USING btree ("message_id","reactor_key");--> statement-breakpoint
CREATE INDEX "message_reactions_message_idx" ON "message_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE POLICY "message_edits_tenant_isolation" ON "message_edits" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "message_reactions_tenant_isolation" ON "message_reactions" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');