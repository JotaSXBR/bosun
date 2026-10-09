import { expect, test } from "@playwright/test";

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { status: string; db: string };
  expect(body.status).toBe("ok");
  expect(body.db).toBe("ok");
});

test("document responses carry a nonce-based Content-Security-Policy", async ({ request }) => {
  const response = await request.get("/sign-in");
  const csp = response.headers()["content-security-policy"];
  expect(csp).toContain("script-src 'self' 'nonce-");
});

test("sign up → create organization → app shows org and audit entry", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-${suffix}@crm.local`;
  const orgName = `E2E Org ${suffix}`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E User");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(orgName);
  await page.getByRole("button", { name: "Criar organização" }).click();

  await page.waitForURL("**/app");
  await expect(page.getByTestId("org-name")).toHaveText(orgName);
  await expect(page.getByTestId("audit-list")).toContainText("organization.created");
});
