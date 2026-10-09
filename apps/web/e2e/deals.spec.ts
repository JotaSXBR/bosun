import { expect, test } from "@playwright/test";

test("funnel lifecycle: create from template, manage stages, delete", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Deals");
  await page.getByLabel("E-mail").fill(`e2e-deals-${suffix}@crm.local`);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Deals ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // Empty state → create funnel from the "Imobiliária" template.
  await page.goto("/app/deals");
  await expect(page.getByTestId("empty-funnel")).toBeVisible();
  await page.getByRole("button", { name: "Criar funil" }).click();
  await page.getByLabel("Nome").fill("Funil E2E");
  await page.getByLabel("Modelo").click();
  await page.getByRole("option", { name: /Imobiliária/ }).click();
  await page.getByRole("button", { name: "Criar funil" }).click();

  // Board renders with the template's six stages.
  await expect(page.getByTestId("kanban-board")).toBeVisible();
  for (const stage of [
    "Novo lead",
    "Qualificação",
    "Visita agendada",
    "Proposta",
    "Negociação",
    "Fechado",
  ]) {
    await expect(page.getByTestId("kanban-board")).toContainText(stage);
  }

  // Add a stage, then delete it via the column menu.
  await page.getByRole("button", { name: "Etapa", exact: true }).click();
  await page.getByLabel("Nome").fill("Pré-venda");
  await page.getByRole("button", { name: "Adicionar etapa" }).click();
  await expect(page.getByTestId("kanban-board")).toContainText("Pré-venda");

  await page.getByRole("button", { name: "Ações da etapa Pré-venda" }).click();
  await page.getByRole("menuitem", { name: "Excluir etapa" }).click();
  await page.getByRole("button", { name: "Excluir etapa" }).click();
  await expect(page.getByTestId("kanban-board")).not.toContainText("Pré-venda");

  // Delete the funnel → back to the empty state.
  await page.getByRole("button", { name: "Excluir funil" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir funil" }).click();
  await expect(page.getByTestId("empty-funnel")).toBeVisible();
});
