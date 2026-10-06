"use client";

import type { MessageReactionView } from "@crm/core/messaging";
import { cn } from "@crm/ui/lib/utils";

import { useAction } from "@/lib/use-action";
import { reactToMessageAction } from "@/server/actions/chat";

/** Aggregated reaction chips below a bubble — click toggles own emoji. */
export function ReactionChips({
  conversationId,
  messageId,
  reactions,
  currentUserId,
  interactive,
}: {
  conversationId: string;
  messageId: string;
  reactions: MessageReactionView[];
  currentUserId: string;
  interactive: boolean;
}) {
  const { run } = useAction();
  if (reactions.length === 0) return null;
  const grouped = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const bucket = grouped.get(r.emoji) ?? { count: 0, mine: false };
    bucket.count += 1;
    bucket.mine ||= r.actorUserId === currentUserId || r.fromMe;
    grouped.set(r.emoji, bucket);
  }
  return (
    <div className="mt-1 flex flex-wrap gap-1" data-testid="reaction-chips">
      {[...grouped.entries()].map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          type="button"
          disabled={!interactive}
          onClick={() =>
            run(() => reactToMessageAction({ conversationId, messageId, emoji: mine ? "" : emoji }))
          }
          className={cn(
            "bg-muted flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
            mine && "border-primary bg-primary/10",
            interactive && "hover:border-primary/60",
          )}
        >
          {emoji}
          {count > 1 && <span>{count}</span>}
        </button>
      ))}
    </div>
  );
}
