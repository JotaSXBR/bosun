import { redirect } from "next/navigation";

// /app/settings/ai became a tabbed hub — keep the old deep link alive.
export default function AiSettingsPage() {
  redirect("/app/settings/ai/suggestions");
}
