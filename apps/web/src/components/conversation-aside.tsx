import { NotFoundError } from "@crm/core";
import { hasPermission } from "@crm/permissions";
import { getTranslations } from "next-intl/server";

import { ConversationLeadPanel } from "@/components/conversation-lead-panel";
import {
  getConversation,
  getConversationDeal,
  getConversationLabels,
  listFunnelsWithStages,
  listOrgLabels,
} from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

/**
 * Right column of the inbox workbench — today the lead/deal panel; the full
 * contact ficha (E2, docs/product/inbox.md) drops into this same slot.
 * Self-contained: fetches its own data for the selected `?c=` id.
 */
export async function ConversationAside({ conversationId }: { conversationId: string }) {
  const t = await getTranslations("inbox");
  const ctx = await requireTenantContext();
  let conversation;
  try {
    conversation = await getConversation(ctx, conversationId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return <p className="text-ink-muted text-sm">{t("notFound")}</p>;
    }
    throw error;
  }
  const [deal, funnels, labels, conversationLabels] = await Promise.all([
    getConversationDeal(ctx, conversationId),
    listFunnelsWithStages(ctx),
    listOrgLabels(ctx),
    getConversationLabels(ctx, conversationId),
  ]);
  return (
    <ConversationLeadPanel
      conversationId={conversation.id}
      contactName={conversation.contactDisplayName ?? conversation.contactChannelUserId}
      deal={deal}
      funnels={funnels}
      allLabels={labels}
      conversationLabels={conversationLabels}
      canWrite={ctx.role !== "viewer"}
      canManage={hasPermission(ctx.role, { leads: ["manage"] })}
    />
  );
}
