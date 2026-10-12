import { redirect } from "next/navigation";

// Moved to Configurações › Atendimento › Equipes (docs/product/ia-navegacao.md §5).
export default function TeamsRedirect() {
  redirect("/app/settings/service/teams");
}
