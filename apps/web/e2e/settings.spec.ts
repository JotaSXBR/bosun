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
  // The reopen window moved to Atendimento › Regras de ticket (Slice 3 hub).
  await page.goto("/app/settings/service/rules");
  await expect(page.getByLabel("Janela de reabertura (horas)")).toHaveValue("48");
  // Product settings are platform_admin-only — a plain org owner never sees them.
  await expect(page.getByRole("heading", { name: "Plataforma" })).toBeHidden();

  await page.goto("/app/settings/teams");
  await page.getByLabel("Nome").fill("Vendas");
  await page.getByRole("button", { name: "Criar equipe" }).click();
  await expect(page.getByTestId("team-list")).toContainText("Vendas");

  // Horário de atendimento — weekly editor persists business_hours.
  await page.goto("/app/settings/service/hours");
  await expect(page.getByTestId("hours-form")).toBeVisible();
  await page.getByRole("switch", { name: "Segunda" }).click();
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  // Wait for the action to commit (success toast) before reloading — a bare
  // reload can race the in-flight POST and render stale business hours.
  await expect(page.getByText("Horário de atendimento atualizado.")).toBeVisible({
    timeout: 15_000,
  });
  await page.reload();
  await expect(page.getByRole("switch", { name: "Segunda" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("switch", { name: "Terça" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});
