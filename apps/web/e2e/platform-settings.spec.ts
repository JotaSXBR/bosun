import { expect, test } from "@playwright/test";

/* eslint-disable playwright/no-conditional-in-test -- the wizard gate and the
   seeded admin's missing org are environment-dependent branches. */

// Requires the dev seed (superadmin@crm.local / Password123!). The seeded
// platform admin has no org, so the flow is: sign-in → onboarding → org →
// gated to /app/setup while e-mail is unconfigured.
test("platform admin: setup gate, then Plataforma section visible", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);

  await page.goto("/sign-in");
  await page.getByLabel("E-mail").fill("superadmin@crm.local");
  await page.getByLabel("Senha").fill("Password123!");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL(/\/(app|onboarding)/, { timeout: 30_000 });

  if (page.url().includes("/onboarding")) {
    await page.getByLabel("Nome da organização").fill(`E2E Platform ${suffix}`);
    await page.getByRole("button", { name: "Criar organização" }).click();
  }

  // Any /app page hits the gate — settings is the destination anyway.
  await page.goto("/app/settings");
  await page.waitForLoadState("domcontentloaded");

  if (page.url().includes("/app/setup")) {
    // First-run wizard: console is an explicit choice — marks e-mail done.
    await page.getByLabel("Provider").selectOption("console");
    await page.getByRole("button", { name: "Salvar e continuar" }).click();
    await page.goto("/app/settings");
  }

  await expect(page.getByRole("heading", { name: "Plataforma" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "E-mail", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cobrança (Asaas)" })).toBeVisible();
});
