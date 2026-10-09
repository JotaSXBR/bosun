import { expect, test } from "@playwright/test";

test("settings pages render and an owner can manage teams", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-settings-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Settings");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Settings ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  await page.goto("/app/settings");
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expect(page.getByLabel("Janela de reabertura (horas)")).toHaveValue("48");
  // Product settings are platform_admin-only — a plain org owner never sees them.
  await expect(page.getByRole("heading", { name: "Plataforma" })).not.toBeVisible();

  await page.goto("/app/settings/teams");
  await page.getByLabel("Nome").fill("Vendas");
  await page.getByRole("button", { name: "Criar equipe" }).click();
  await expect(page.getByTestId("team-list")).toContainText("Vendas");
});
