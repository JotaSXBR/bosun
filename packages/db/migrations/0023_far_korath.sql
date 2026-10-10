ALTER TABLE "conversations" DROP CONSTRAINT "conversations_status_check";--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "snoozed_until" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "conversations_org_snoozed_idx" ON "conversations" USING btree ("organization_id","snoozed_until");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_status_check" CHECK ("conversations"."status" in ('pending', 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'));