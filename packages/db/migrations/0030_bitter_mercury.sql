CREATE TABLE "conversation_reads" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_reads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "ai_transcribe_audio" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_reads" ADD CONSTRAINT "conversation_reads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_reads" ADD CONSTRAINT "conversation_reads_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_reads" ADD CONSTRAINT "conversation_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_reads_conv_user_idx" ON "conversation_reads" USING btree ("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "conversation_reads_org_idx" ON "conversation_reads" USING btree ("organization_id");--> statement-breakpoint
CREATE POLICY "conversation_reads_tenant_isolation" ON "conversation_reads" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint

-- FORCE makes the tenant policy apply even to the table owner, matching the
-- posture established in 0002_rls_grants.sql. Table grants to crm_app are
-- already covered by ALTER DEFAULT PRIVILEGES from 0002.
ALTER TABLE "conversation_reads" FORCE ROW LEVEL SECURITY;