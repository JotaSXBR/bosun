import { redirect } from "next/navigation";

// Observer config lives inside the system agent detail (IA spec §5).
export default function AiObserverRedirect() {
  redirect("/app/settings/ai/agents/observer");
}
