CREATE TABLE "agent_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"payload" jsonb NOT NULL,
	"rationale" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"source_conversation_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_suggestions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"model_ref" jsonb,
	"system_prompt" text DEFAULT '' NOT NULL,
	"business_rules" text,
	"tools_allowlist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"availability_window" jsonb,
	"memory_token_cap" integer,
	"tool_execution_limit" integer,
	"signature_line" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid,
	"credential_id" uuid,
	"call_kind" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer,
	"status" text DEFAULT 'ok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "org_llm_credentials" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"api_key_encrypted" text NOT NULL,
	"label" text,
	"model" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"zdr" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_llm_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_suggestions" ADD CONSTRAINT "agent_suggestions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_suggestions" ADD CONSTRAINT "agent_suggestions_source_conversation_id_conversations_id_fk" FOREIGN KEY ("source_conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_suggestions" ADD CONSTRAINT "agent_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_credential_id_org_llm_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."org_llm_credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_llm_credentials" ADD CONSTRAINT "org_llm_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_suggestions_org_status_idx" ON "agent_suggestions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_org_name_idx" ON "agents" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "agents_org_idx" ON "agents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ai_usage_events_org_idx" ON "ai_usage_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "knowledge_entries_org_idx" ON "knowledge_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_llm_credentials_org_idx" ON "org_llm_credentials" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_llm_credentials_org_provider_priority_idx" ON "org_llm_credentials" USING btree ("organization_id","provider","priority");--> statement-breakpoint
CREATE POLICY "agent_suggestions_tenant_isolation" ON "agent_suggestions" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "agents_tenant_isolation" ON "agents" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "ai_usage_events_tenant_isolation" ON "ai_usage_events" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "knowledge_entries_tenant_isolation" ON "knowledge_entries" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "org_llm_credentials_tenant_isolation" ON "org_llm_credentials" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');