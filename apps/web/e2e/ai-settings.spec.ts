import { expect, test } from "@playwright/test";

test("AI settings: credentials, agents and knowledge CRUD over the observer surface", async ({
  page,
}) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-ai-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E AI");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E AI ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // Navigate from the settings index card.
  await page.goto("/app/settings");
  await page.getByRole("link", { name: "Gerenciar IA" }).click();
  await page.waitForURL("**/app/settings/ai");
  await expect(page.getByRole("heading", { name: "Inteligência artificial" })).toBeVisible();
  await expect(page.getByTestId("credentials-empty")).toBeVisible();
  await expect(page.getByTestId("knowledge-empty")).toBeVisible();

  // Manual analysis enqueues even without credentials (observer skips silently).
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Analisar agora" }).click();
  await expect(page.getByText(/Análise iniciada/)).toBeVisible();

  // Create a BYOK credential — the key is write-only and never re-rendered.
  await page.locator("#cred-provider").click();
  await page.getByRole("option", { name: "OpenAI" }).click();
  await page.getByLabel("API key").fill("sk-e2e-fake-key");
  await page.getByLabel("Modelo").first().fill("gpt-5-mini");
  await page.getByLabel("Rótulo").fill("E2E key");
  await page.getByRole("button", { name: "Adicionar credencial" }).click();
  await expect(page.getByTestId("credential-list")).toContainText("E2E key");
  await expect(page.getByTestId("credential-list")).toContainText("gpt-5-mini");

  // Create an agent via the form dialog.
  await page.getByRole("button", { name: "Novo agente" }).click();
  const agentDialog = page.getByRole("dialog");
  await agentDialog.getByLabel("Nome").fill("Agente E2E");
  await agentDialog.getByLabel("Especialidade").fill("Suporte");
  await agentDialog.getByLabel("Prompt do sistema").fill("Responda em PT-BR.");
  await agentDialog.getByRole("button", { name: "Criar agente" }).click();
  await expect(page.getByTestId("agent-list")).toContainText("Agente E2E");

  // Create a knowledge entry.
  await page.getByRole("button", { name: "Nova entrada" }).click();
  const kbDialog = page.getByRole("dialog");
  await kbDialog.getByLabel("Título").fill("FAQ E2E");
  await kbDialog.getByLabel("Conteúdo").fill("Horário de atendimento: 9h-18h.");
  await kbDialog.getByRole("button", { name: "Adicionar entrada" }).click();
  await expect(page.getByTestId("knowledge-list")).toContainText("FAQ E2E");

  // Second brain — human proposal stages in the suggestion inbox; the
  // e2e user is the org owner, so self-approval is allowed (sovereign).
  await expect(page.getByTestId("brain-empty")).toBeVisible();
  await page.getByRole("button", { name: "Propor memória" }).click();
  const brainDialog = page.getByRole("dialog");
  await brainDialog.getByLabel("Conteúdo").fill("Clientes perguntam prazo antes do preço.");
  await brainDialog.getByLabel("Justificativa").fill("Padrão visto em várias conversas E2E.");
  await brainDialog.getByTestId("brain-propose-submit").click();
  await expect(page.getByText(/aguarda revisão/)).toBeVisible();

  // The staged proposal appears in the suggestions inbox as "memória".
  const suggestionList = page.getByTestId("suggestion-list");
  await expect(suggestionList).toContainText("memória");
  await expect(suggestionList).toContainText("Clientes perguntam prazo");
  await suggestionList.getByRole("button", { name: "Aprovar" }).first().click();
  await expect(page.getByText(/aprovada e aplicada/)).toBeVisible();

  // Approval promoted it to canon — the brain section lists it.
  await expect(page.getByTestId("brain-list")).toContainText(
    "Clientes perguntam prazo antes do preço.",
  );
  await expect(page.getByTestId("brain-list")).toContainText("organização");

  // Archiving removes it from the canon.
  await page.getByTestId("brain-list").getByRole("button", { name: "Arquivar" }).click();
  await expect(page.getByTestId("brain-empty")).toBeVisible();

  // Delete the credential back to the empty state.
  await page.getByTestId("credential-list").getByRole("button", { name: "Remover" }).click();
  await expect(page.getByTestId("credentials-empty")).toBeVisible();
});
