import { redirect } from "next/navigation";

// Technical AI settings live under Agentes / Credenciais (IA spec §5).
export default function AiSettingsPage() {
  redirect("/app/settings/ai/agents");
}
