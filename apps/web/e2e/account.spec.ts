import { expect, test } from "@playwright/test";

test("minha conta: perfil, preferências, notificações e segurança", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-account-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Conta");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Conta ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // /app/account resolves to the profile tab.
  await page.goto("/app/account");
  await page.waitForURL("**/app/account/profile");
  await expect(page.getByRole("tab", { name: "Perfil" })).toBeVisible();

  // Perfil — name edit + avatar upload (user-scoped /api/avatar).
  await page.getByLabel("Nome").fill("Conta Renomeada");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByLabel("Nome")).toHaveValue("Conta Renomeada");

  // PNG 1×1 — smallest valid upload (route accepts png/jpeg/webp ≤2MB).
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.getByTestId("avatar-input").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.locator("img[src^='/api/avatar/']").first()).toBeVisible({
    timeout: 15_000,
  });

  // Preferências — theme switch to light, persisted via cookie on <html>.
  await page.getByRole("tab", { name: "Preferências" }).click();
  await page.waitForURL("**/app/account/preferences");
  await page.getByLabel("Tema").click();
  await page.getByRole("option", { name: "Claro" }).click();
  await expect
    .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("light");
  await page.reload();
  await expect
    .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("light");

  // sendSeen toggle exists and is on by default.
  await expect(page.getByLabel("Marcar mensagens como vistas")).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // Notificações — three toast gates.
  await page.getByRole("tab", { name: "Notificações" }).click();
  await page.waitForURL("**/app/account/notifications");
  await expect(page.getByLabel("Novos rascunhos da IA")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("Novos toques da IA")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("Novas sugestões de IA")).toHaveAttribute("aria-checked", "true");

  // Segurança — sessions card lists this device; password form present.
  await page.getByRole("tab", { name: "Segurança" }).click();
  await page.waitForURL("**/app/account/security");
  await expect(page.getByText("este dispositivo")).toBeVisible();
  await expect(page.getByLabel("Senha atual")).toBeVisible();
  await expect(page.getByLabel("Nova senha")).toBeVisible();
});
