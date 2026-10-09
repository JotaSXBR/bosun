import { expect, test } from "@playwright/test";

/* eslint-disable playwright/no-conditional-in-test -- the seeded admin may or
   may not own an org yet (retries / re-seeded databases). */

// Requires the dev seed (superadmin@crm.local / Password123!). The seeded
// platform admin owns no org on a fresh seed: sign-in lands on /app but the
// layout bounces every /app page to /onboarding until one exists — so the
// test drives /onboarding explicitly instead of trusting the landing URL.
test("platform admin: setup gate, then Plataforma section visible", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);

  await page.goto("/sign-in");
  await page.getByLabel("E-mail").fill("superadmin@crm.local");
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(app|onboarding)/, { timeout: 30_000 });

  await page.goto("/onboarding");
  if (page.url().includes("/onboarding")) {
    await page.getByLabel("Nome da organização").fill(`E2E Platform ${suffix}`);
    await page.getByRole("button", { name: "Criar organização" }).click();
    // The server action must finish before any /app navigation — without
    // this wait the layout sees a user with no org and bounces back.
    await page.waitForURL(/\/app/, { timeout: 30_000 });
  }

  // Any /app page hits the setup gate — settings is the destination anyway.
  await page.goto("/app/settings");
  await page.waitForLoadState("domcontentloaded");

  if (page.url().includes("/app/setup")) {
    // First-run wizard: console is an explicit choice — marks e-mail done.
    await page.getByLabel("Provider").selectOption("console");
    await page.getByRole("button", { name: "Salvar e continuar" }).click();
    // On success the form does router.push("/app"); a failed save stays on
    // /app/setup — waiting proves the action completed before we navigate.
    await page.waitForURL(/\/app$/, { timeout: 30_000 });
    await page.goto("/app/settings");
  }

  await expect(page.getByRole("heading", { name: "Plataforma" })).toBeVisible();
  // Group titles render inside the DS Card title slot (.bx-card-title), not
  // semantic headings.
  await expect(page.locator(".bx-card-title", { hasText: "E-mail" }).first()).toBeVisible();
  await expect(page.locator(".bx-card-title", { hasText: "Cobrança" })).toBeVisible();
});
