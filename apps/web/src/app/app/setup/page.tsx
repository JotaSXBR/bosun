import { redirect } from "next/navigation";

import { productConfigured } from "@/server/services";
import { requireSession } from "@/server/tenant";

import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

/**
 * First-run wizard: reachable only by platform_admin while the e-mail group
 * isn't configured. Members land back on /app; once e-mail resolves
 * (DB → env), the admin does too.
 */
export default async function SetupPage() {
  const session = await requireSession();
  if (session.user.role !== "platform_admin") redirect("/app");
  if (await productConfigured("email")) redirect("/app");

  return (
    <main className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Configuração inicial</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          O Bosun precisa de um provider de e-mail para verificação de conta e reset de senha.
          Escolha e salve para liberar o acesso.
        </p>
      </div>
      <SetupForm />
    </main>
  );
}
