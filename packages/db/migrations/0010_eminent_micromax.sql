ALTER TABLE "conversations" DROP CONSTRAINT "conversations_status_check";--> statement-breakpoint
DROP INDEX "conversations_connection_external_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_connection_external_idx" ON "conversations" USING btree ("channel_connection_id","external_id") WHERE "conversations"."status" not in ('resolved', 'closed');--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_status_check" CHECK ("conversations"."status" in ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed'));