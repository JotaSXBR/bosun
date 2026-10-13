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

  // Empty state → "Criar funil" links to the funnels settings page, where
  // funnel/stage editing lives now (IA spec §5).
  await page.goto("/app/deals");
  await expect(page.getByTestId("empty-funnel")).toBeVisible();
  await page.getByRole("link", { name: "Criar funil" }).click();
  await page.waitForURL("**/app/settings/sales/funnels");

  await page.getByRole("button", { name: "Criar funil" }).click();
  const funnelDialog = page.getByRole("dialog");
  await funnelDialog.getByLabel("Nome").fill("Funil E2E");
  await funnelDialog.getByLabel("Modelo").click();
  await page.getByRole("option", { name: /Imobiliária/ }).click();
  await funnelDialog.getByRole("button", { name: "Criar funil" }).click();
  await page.waitForURL(/funnel=/);

  // Board renders with the template's six stages.
  await page.goto("/app/deals");
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

  // Add a stage, then delete it — management lives on the settings page
  // (the board's "Editar funil" shortcut lands there with ?funnel=<id>).
  await page.getByRole("link", { name: "Editar funil" }).click();
  await page.waitForURL(/\/app\/settings\/sales\/funnels\?funnel=/);
  await page.getByRole("button", { name: "Etapa", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Nome").fill("Pré-venda");
  await page.getByRole("dialog").getByRole("button", { name: "Adicionar etapa" }).click();
  await expect(page.getByText("Pré-venda")).toBeVisible();

  await page.getByRole("button", { name: "Ações da etapa Pré-venda" }).click();
  await page.getByRole("menuitem", { name: "Excluir etapa" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir etapa" }).click();
  // The dialog stays mounted while the action's router.refresh() commits —
  // wait for it to close before asserting the row is gone. Exact text:
  // the dialog's own description mentions the stage name.
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText("Pré-venda", { exact: true })).toBeHidden();

  // Delete the funnel → deals is back to the empty state. Wait for the
  // dialog to close (result.ok) before navigating — in prod the goto would
  // otherwise race the in-flight action POST and render a stale funnel.
  await page.getByRole("button", { name: "Excluir funil" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir funil" }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });
  await page.goto("/app/deals");
  await expect(page.getByTestId("empty-funnel")).toBeVisible();
});
