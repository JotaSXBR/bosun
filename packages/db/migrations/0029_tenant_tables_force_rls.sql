-- Same hardening posture as 0014/0002: FORCE makes the tenant policies apply
-- even to the table owner, so only BYPASSRLS migration roles or
-- withPlatformScope transactions can cross tenant boundaries. Covers every
-- tenant-owned table that had ENABLE without FORCE (migrations 0015-0023).
ALTER TABLE "agent_suggestions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_usage_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversation_labels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deal_labels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deals" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "funnel_stages" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "funnels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_entries" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "labels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memory_entries" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_edits" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_reactions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "org_llm_credentials" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_chat_sessions" FORCE ROW LEVEL SECURITY;
