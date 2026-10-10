import { expect, test } from "@playwright/test";

test("inbox renders the six ticket views for an authenticated org member", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-inbox-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Inbox");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Inbox ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  await page.goto("/app/inbox");
  for (const label of ["Automático", "Fila", "Minhas", "Todas", "Adiados", "Fechadas"]) {
    await expect(page.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(page.getByText("Nenhum ticket aguardando atendimento.")).toBeVisible();
});
