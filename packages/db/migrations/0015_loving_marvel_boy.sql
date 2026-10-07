CREATE TABLE "conversation_labels" (
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_labels_conversation_id_label_id_pk" PRIMARY KEY("conversation_id","label_id")
);
--> statement-breakpoint
ALTER TABLE "conversation_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deal_labels" (
	"organization_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deal_labels_deal_id_label_id_pk" PRIMARY KEY("deal_id","label_id")
);
--> statement-breakpoint
ALTER TABLE "deal_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"funnel_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"conversation_id" uuid,
	"title" text NOT NULL,
	"value_cents" bigint DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"custom_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "funnel_stages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"funnel_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"color" text DEFAULT 'gray' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "funnel_stages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "funnels" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"template_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "funnels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'gray' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversation_labels" ADD CONSTRAINT "conversation_labels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_labels" ADD CONSTRAINT "conversation_labels_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_labels" ADD CONSTRAINT "conversation_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_labels" ADD CONSTRAINT "deal_labels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_labels" ADD CONSTRAINT "deal_labels_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_labels" ADD CONSTRAINT "deal_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_funnel_id_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_funnel_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."funnel_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_stages" ADD CONSTRAINT "funnel_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_stages" ADD CONSTRAINT "funnel_stages_funnel_id_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_labels_org_idx" ON "conversation_labels" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversation_labels_label_idx" ON "conversation_labels" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "deal_labels_org_idx" ON "deal_labels" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "deal_labels_label_idx" ON "deal_labels" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deals_conversation_unique" ON "deals" USING btree ("organization_id","conversation_id") WHERE "deals"."conversation_id" is not null;--> statement-breakpoint
CREATE INDEX "deals_org_stage_position_idx" ON "deals" USING btree ("organization_id","funnel_id","stage_id","position");--> statement-breakpoint
CREATE INDEX "deals_org_contact_idx" ON "deals" USING btree ("organization_id","contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "funnel_stages_funnel_position_idx" ON "funnel_stages" USING btree ("funnel_id","position");--> statement-breakpoint
CREATE INDEX "funnel_stages_funnel_idx" ON "funnel_stages" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "funnel_stages_org_idx" ON "funnel_stages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "funnels_org_idx" ON "funnels" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "labels_org_name_idx" ON "labels" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "labels_org_idx" ON "labels" USING btree ("organization_id");--> statement-breakpoint
CREATE POLICY "conversation_labels_tenant_isolation" ON "conversation_labels" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "deal_labels_tenant_isolation" ON "deal_labels" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "deals_tenant_isolation" ON "deals" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "funnel_stages_tenant_isolation" ON "funnel_stages" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "funnels_tenant_isolation" ON "funnels" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');--> statement-breakpoint
CREATE POLICY "labels_tenant_isolation" ON "labels" AS PERMISSIVE FOR ALL TO "crm_app" USING (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on') WITH CHECK (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on');