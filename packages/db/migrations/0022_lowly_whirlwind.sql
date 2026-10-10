DROP INDEX "agent_suggestions_pending_draft_idx";--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "ai_observer_mode" text DEFAULT 'on_close' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "observer_interval_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "observer_idle_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "observer_auto_draft" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "observer_last_scan_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_suggestions_pending_thread_card_idx" ON "agent_suggestions" USING btree ("source_conversation_id") WHERE "agent_suggestions"."target_type" in ('draft', 'nudge') and "agent_suggestions"."status" = 'pending';