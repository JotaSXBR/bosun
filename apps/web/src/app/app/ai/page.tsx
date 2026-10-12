import { redirect } from "next/navigation";

// The module's working surface is the review queue (IA spec §3).
export default function AiModulePage() {
  redirect("/app/ai/reviews");
}
