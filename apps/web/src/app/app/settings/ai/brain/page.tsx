import { redirect } from "next/navigation";

// Moved to the Inteligência module (IA spec §5) — keep the deep link alive.
export default function AiBrainRedirect() {
  redirect("/app/ai/memory");
}
