import { expect, test } from "@playwright/test";

/* eslint-disable playwright/no-conditional-in-test, playwright/no-skipped-test -- the seeded agent's org
   may or may not exist yet (fresh CI databases run without the demo seed). */

test("hoje shows operational blocks and the bell empty state", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-home-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Home");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Home ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // Início "Hoje" — operational surface (nav spec §3): org name kept for
  // the onboarding contract, no account-identity or raw audit cards.
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await expect(page.getByTestId("org-name")).toHaveText(`E2E Home ${suffix}`);
  await expect(page.getByText("Atividade recente")).toBeHidden();

  // Esperando por você: a fresh org has no conversations → empty line.
  await expect(page.getByText("Esperando por você")).toBeVisible();
  await expect(page.getByText("Tudo em dia por aqui.")).toBeVisible();

  // Inteligência (owner has ai:manage) renders its two rows even at zero.
  await expect(page.getByRole("link", { name: "Revisões pendentes" })).toHaveAttribute(
    "href",
    "/app/ai/reviews",
  );
  await expect(page.getByRole("link", { name: "Memórias desatualizadas" })).toHaveAttribute(
    "href",
    "/app/ai/memory",
  );

  // Precisa de atenção only appears with a problem connection — none here.
  await expect(page.getByText("Precisa de atenção")).toBeHidden();

  // Checklist still surfaces the next step while the space is incomplete —
  // the CTA and the row both link to channels, so assert on the first.
  await expect(page.getByText("Primeiros passos")).toBeVisible();
  await expect(page.getByRole("link", { name: "Conectar um canal" }).first()).toHaveAttribute(
    "href",
    "/app/settings/channels",
  );

  // Bell: no alerts yet → empty state, actionable destinations stay wired.
  await page.getByRole("button", { name: "Alertas" }).click();
  await expect(page.getByText("Nenhum alerta por enquanto.")).toBeVisible();
});

test("agent sees no AI or channel cards and the bell stays empty", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("E-mail").fill("agent@crm.local");
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(app|onboarding)/, { timeout: 30_000 });
  if (page.url().includes("/onboarding")) {
    test.skip(true, "demo seed not present — agent@crm.local has no org");
  }

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await expect(page.getByText("Esperando por você")).toBeVisible();

  // ai:manage and integrations:manage are owner/manager territory (§7.7).
  await expect(page.getByRole("link", { name: "Revisões pendentes" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Memórias desatualizadas" })).toBeHidden();
  await expect(page.getByText("Precisa de atenção")).toBeHidden();

  await page.getByRole("button", { name: "Alertas" }).click();
  await expect(page.getByText("Nenhum alerta por enquanto.")).toBeVisible();
});
