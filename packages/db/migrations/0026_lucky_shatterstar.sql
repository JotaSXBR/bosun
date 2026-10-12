ALTER TABLE "conversations" ADD COLUMN "last_message_preview" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "last_message_direction" text;--> statement-breakpoint
-- Backfill: latest NON-PRIVATE message per conversation — same ordering
-- and preview coercion the old inbox subplan used. Private/system notes
-- are skipped on purpose: they never bumped last_message_at either.
UPDATE "conversations" c
SET "last_message_preview" = m."preview",
    "last_message_direction" = m."direction"
FROM (
  SELECT DISTINCT ON ("conversation_id")
         "conversation_id",
         coalesce("content" ->> 'text', "content" ->> 'caption', '[' || ("content" ->> 'type') || ']') AS "preview",
         "direction"
  FROM "messages"
  WHERE "private" IS NOT TRUE
  ORDER BY "conversation_id", "sent_at" DESC NULLS LAST, "created_at" DESC
) m
WHERE c."id" = m."conversation_id";
