import { expect, test } from "@playwright/test";

test("conversation stream opens an EventSource for an authenticated org member", async ({
  page,
}) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-sse-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E User");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E SSE ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // EventSource → /api/conversations/stream is same-origin, so the document
  // CSP (connect-src 'self') allows it. Resolving on onopen proves auth +
  // stream establishment end to end.
  const opened = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const source = new EventSource("/api/conversations/stream");
        source.onopen = () => {
          source.close();
          resolve(true);
        };
        source.onerror = () => {
          source.close();
          resolve(false);
        };
      }),
  );
  expect(opened).toBe(true);
});

test("conversation stream rejects unauthenticated requests", async ({ request }) => {
  const response = await request.get("/api/conversations/stream");
  expect(response.status()).toBe(401);
});
