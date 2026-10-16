import { expect, test } from "@playwright/test";

test("site chat: visitor pre-form → message → agent reply reaches the widget", async ({
  page,
  context,
}) => {
  const suffix = crypto.randomUUID().slice(0, 8);

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Widget");
  await page.getByLabel("E-mail").fill(`e2e-widget-${suffix}@crm.local`);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Widget ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // Create a site_chat connection — no credentials needed. The channel field
  // is a DS Select (Radix combobox), not a native <select>.
  await page.goto("/app/integrations");
  await page.getByLabel("Canal").click();
  await page.getByRole("option", { name: /Chat do site/ }).click();
  await page.getByLabel("Nome").fill("Widget E2E");
  await page.getByRole("button", { name: "Criar conexão" }).click();

  // The widget panel shows the embed snippet — extract the public token.
  const panel = page.getByTestId("widget-panel");
  await expect(panel).toBeVisible();
  const snippet = await panel.locator("code").first().textContent();
  const token = /data-token="([^"]+)"/.exec(snippet ?? "")?.[1];
  expect(token).toBeTruthy();

  // Visitor side: demo page with the embeddable widget.
  const widget = await context.newPage();
  await widget.goto(`/widget-demo?token=${token}`);
  await widget.locator(".bw-bubble").click();
  await widget.locator(".bw-form input[name=name]").fill("E2E Visitor");
  await widget.locator(".bw-form input[name=email]").fill(`visitor-${suffix}@example.com`);
  await widget.locator(".bw-form input[name=phone]").fill("11987654321");
  await widget.locator(".bw-form button[type=submit]").click();

  const msgs = widget.locator(".bw-msgs");
  await widget.locator(".bw-compose input[name=text]").fill("Olá, preciso de ajuda");
  await widget.locator(".bw-compose button[type=submit]").click();
  await expect(msgs).toContainText("Olá, preciso de ajuda", { timeout: 15_000 });

  // Agent side: the conversation lands in the queue; reply assigns + sends.
  await page.goto("/app/inbox");
  await page.getByRole("link", { name: /E2E Visitor/ }).click();
  await page.getByPlaceholder("Responder ao cliente…").fill("Claro, já estou ajudando");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByTestId("message-thread")).toContainText("Claro, já estou ajudando");

  // The widget's SSE ping triggers a refresh — agent reply shows up live.
  await expect(msgs).toContainText("Claro, já estou ajudando", { timeout: 15_000 });

  // Ficha: the extended contact profile edits inline and persists.
  const ficha = page.getByTestId("contact-ficha");
  await ficha.getByTitle("Empresa").click();
  await ficha.getByRole("textbox", { name: "Empresa" }).fill("Acme E2E");
  // The ficha shows no success toast: wait for the server action before reloading.
  const saved = page.waitForResponse((r) => r.request().method() === "POST");
  await ficha.getByRole("textbox", { name: "Empresa" }).press("Enter");
  await saved;
  await page.reload();
  await expect(page.getByTestId("contact-ficha").getByTitle("Empresa")).toHaveText("Acme E2E");

  // A non-http(s) site is refused and nothing is saved.
  await ficha.getByTitle("Sites").click();
  await ficha.getByRole("textbox", { name: "Sites" }).fill("javascript:alert(1)");
  await ficha.getByRole("textbox", { name: "Sites" }).blur();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("contact-ficha").getByTitle("Sites")).toHaveText(
    "Um site por linha (https://…)",
  );
});
