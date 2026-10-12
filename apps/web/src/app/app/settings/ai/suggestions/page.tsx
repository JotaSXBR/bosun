import { redirect } from "next/navigation";

// Moved to the Inteligência module (IA spec §5) — keep the deep link alive.
export default function AiSuggestionsRedirect() {
  redirect("/app/ai/reviews");
}
