import { expect, test } from "@playwright/test";

test("site chat: visitor pre-form → message → agent reply reaches the widget", async ({
  page,
  context,
}) => {
  const suffix = crypto.randomUUID().slice(0, 8);

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Widget");
  await page.getByLabel("E-mail").fill(`e2e-widget-${suffix}@crm.local`);
  await page.getByLabel("Senha").fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Widget ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // Create a site_chat connection — no credentials needed. The controlled
  // select reverts if the option fires before hydration — re-select until the
  // value sticks.
  await page.goto("/app/integrations");
  const canal = page.getByLabel("Canal");
  await expect
    .poll(async () => {
      await canal.selectOption("site_chat");
      return canal.inputValue();
    })
    .toBe("site_chat");
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
  await expect(msgs).toContainText("Olá, preciso de ajuda");

  // Agent side: the conversation lands in the queue; reply assigns + sends.
  await page.goto("/app/inbox");
  await page.getByRole("link", { name: /E2E Visitor/ }).click();
  await page.getByPlaceholder("Responder ao cliente…").fill("Claro, já estou ajudando");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByTestId("message-thread")).toContainText("Claro, já estou ajudando");

  // The widget's SSE ping triggers a refresh — agent reply shows up live.
  await expect(msgs).toContainText("Claro, já estou ajudando", { timeout: 15_000 });
});
