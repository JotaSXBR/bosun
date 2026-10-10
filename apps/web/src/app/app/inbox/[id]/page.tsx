import { redirect } from "next/navigation";

// Deep link preserved — the inbox workbench is the canonical surface;
// `/app/inbox?c=<id>` selects the conversation in place.
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/inbox?c=${id}`);
}
