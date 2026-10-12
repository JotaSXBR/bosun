import { expect, test } from "@playwright/test";

test("inteligência module replaces the old settings/ai sections", async ({ page }) => {
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

  // Legacy deep links redirect to the module / technical split (spec §5).
  await page.goto("/app/settings/ai/suggestions");
  await page.waitForURL("**/app/ai/reviews");
  await page.goto("/app/settings/ai/brain");
  await page.waitForURL("**/app/ai/memory");
  await page.goto("/app/settings/ai/knowledge");
  await page.waitForURL("**/app/ai/knowledge");
  await page.goto("/app/settings/ai");
  await page.waitForURL("**/app/settings/ai/agents");
  await page.goto("/app/settings/ai/observer");
  await page.waitForURL("**/app/settings/ai/agents/observer");

  // Module chrome: summary strip + the three tabs.
  await page.goto("/app/ai");
  await page.waitForURL("**/app/ai/reviews");
  for (const label of ["Revisões", "Conhecimento", "Memória"]) {
    await expect(page.getByRole("tab", { name: label })).toBeVisible();
  }
  await expect(page.getByText("Nenhuma chave de IA cadastrada.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cadastrar chave" })).toHaveAttribute(
    "href",
    "/app/settings/ai/credentials",
  );
});
