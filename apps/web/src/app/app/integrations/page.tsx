import { redirect } from "next/navigation";

// Moved to Configurações › Canais (docs/product/ia-navegacao.md §5).
export default function IntegrationsRedirect() {
  redirect("/app/settings/channels");
}
