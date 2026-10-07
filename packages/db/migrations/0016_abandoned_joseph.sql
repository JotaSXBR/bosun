CREATE TABLE "site_chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"channel_connection_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_chat_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channel_connections" DROP CONSTRAINT "channel_connections_kind_check";--> statement-breakpoint
ALTER TABLE "site_chat_sessions" ADD CONSTRAINT "site_chat_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_chat_sessions" ADD CONSTRAINT "site_chat_sessions_channel_connection_id_channel_connections_id_fk" FOREIGN KEY ("channel_connection_id") REFERENCES "public"."channel_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_chat_sessions" ADD CONSTRAINT "site_chat_sessions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "site_chat_sessions_token_idx" ON "site_chat_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "site_chat_sessions_org_idx" ON "site_chat_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "site_chat_sessions_contact_idx" ON "site_chat_sessions" USING btree ("contact_id");--> statement-breakpoint
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_kind_check" CHECK ("channel_connections"."kind" in ('waha', 'meta_cloud', 'site_chat'));--> statement-breakpoint
CREATE POLICY "site_chat_sessions_tenant_isolation" ON "site_chat_sessions" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');