import { expect, test } from "@playwright/test";

test("AI settings: credentials/agents CRUD + reviews/knowledge/memory module", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-ai-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E AI");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E AI ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // Memory archiving confirms via window.confirm — accept it globally.
  page.on("dialog", (dialog) => dialog.accept());

  // Technical settings live under Agentes / Credenciais (IA spec §5).
  await page.goto("/app/settings");
  await page.getByRole("link", { name: /Agentes e credenciais/ }).click();
  await page.waitForURL("**/app/settings/ai/agents");
  await expect(page.getByRole("tab", { name: "Agentes" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Credenciais" })).toBeVisible();

  // Create a BYOK credential — the key is write-only and never re-rendered.
  await page.getByRole("tab", { name: "Credenciais" }).click();
  await expect(page.getByTestId("credentials-empty")).toBeVisible();
  await page.locator("#cred-provider").click();
  await page.getByRole("option", { name: "OpenAI" }).click();
  await page.getByLabel("API key").fill("sk-e2e-fake-key");
  await page.getByLabel("Modelo").first().fill("gpt-5-mini");
  await page.getByLabel("Rótulo").fill("E2E key");
  await page.getByRole("button", { name: "Adicionar credencial" }).click();
  await expect(page.getByTestId("credential-list")).toContainText("E2E key");
  await expect(page.getByTestId("credential-list")).toContainText("gpt-5-mini");

  // Create an agent via the form dialog.
  await page.getByRole("tab", { name: "Agentes" }).click();
  await page.getByRole("button", { name: "Novo agente" }).click();
  const agentDialog = page.getByRole("dialog");
  await agentDialog.getByLabel("Nome").fill("Agente E2E");
  await agentDialog.getByLabel("Especialidade").fill("Suporte");
  await agentDialog.getByLabel("Prompt do sistema").fill("Responda em PT-BR.");
  await agentDialog.getByRole("button", { name: "Criar agente" }).click();
  await expect(page.getByTestId("agent-list")).toContainText("Agente E2E");

  // The working surface is the module: Revisões holds "Analisar agora".
  await page.goto("/app/ai/reviews");
  await page.getByRole("button", { name: "Analisar agora" }).click();
  await expect(page.getByText(/Análise iniciada/)).toBeVisible();

  // Create a knowledge entry.
  await page.goto("/app/ai/knowledge");
  await expect(page.getByTestId("knowledge-empty")).toBeVisible();
  await page.getByRole("button", { name: "Nova entrada" }).click();
  const kbDialog = page.getByRole("dialog");
  await kbDialog.getByLabel("Título").fill("FAQ E2E");
  await kbDialog.getByLabel("Conteúdo").fill("Horário de atendimento: 9h-18h.");
  await kbDialog.getByRole("button", { name: "Adicionar entrada" }).click();
  await expect(page.getByTestId("knowledge-list")).toContainText("FAQ E2E");

  // Second brain — human proposal stages in the review queue; the e2e user
  // is the org owner, so self-approval is allowed (sovereign).
  await page.goto("/app/ai/memory");
  await expect(page.getByTestId("brain-empty")).toBeVisible();
  await page.getByRole("button", { name: "Propor memória" }).click();
  const brainDialog = page.getByRole("dialog");
  await brainDialog.getByLabel("Conteúdo").fill("Clientes perguntam prazo antes do preço.");
  await brainDialog.getByLabel("Justificativa").fill("Padrão visto em várias conversas E2E.");
  await brainDialog.getByTestId("brain-propose-submit").click();
  await expect(page.getByText(/aguarda revisão/)).toBeVisible();

  // The staged proposal appears in the review queue as "memória".
  await page.goto("/app/ai/reviews");
  const suggestionList = page.getByTestId("suggestion-list");
  await expect(suggestionList).toContainText("memória");
  await expect(suggestionList).toContainText("Clientes perguntam prazo");
  await suggestionList.getByRole("button", { name: "Aprovar" }).first().click();
  await expect(page.getByText(/aprovada e aplicada/)).toBeVisible();

  // Approval promoted it to canon — the memory section lists it.
  await page.goto("/app/ai/memory");
  await expect(page.getByTestId("brain-list")).toContainText(
    "Clientes perguntam prazo antes do preço.",
  );
  await expect(page.getByTestId("brain-list")).toContainText("organização");

  // Archiving removes it from the canon.
  await page.getByTestId("brain-list").getByRole("button", { name: "Arquivar" }).click();
  await expect(page.getByTestId("brain-empty")).toBeVisible();

  // Delete the credential back to the empty state.
  await page.goto("/app/settings/ai/credentials");
  await page.getByTestId("credential-list").getByRole("button", { name: "Remover" }).click();
  await expect(page.getByTestId("credentials-empty")).toBeVisible();
});
