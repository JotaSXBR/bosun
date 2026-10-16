import { expect, test } from "@playwright/test";

test("contacts: manual creation, search and the outbound dialog without WAHA", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `e2e-contacts-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Contacts");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Contacts ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  // Contacts module is reachable from the top navigation.
  await page.getByRole("link", { name: "Contatos" }).click();
  await page.waitForURL("**/app/contacts");
  await expect(page.getByText("Nenhum contato ainda")).toBeVisible();

  // Manual creation — strict international phone.
  await page.getByRole("button", { name: "Novo contato" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome").fill("Maria E2E");
  await dialog.getByLabel("Telefone (WhatsApp)").fill("+55 11 98888-7777");
  await dialog.getByLabel("E-mail (opcional)").fill(`maria-${suffix}@example.com`);
  await dialog.getByRole("button", { name: "Criar contato" }).click();

  const list = page.getByTestId("contact-list");
  await expect(list).toContainText("Maria E2E");
  await expect(list).toContainText("5511988887777@c.us");
  await expect(list).toContainText(`maria-${suffix}@example.com`);

  // Edit the extended profile from the list; reopening shows what was saved.
  await page.getByRole("button", { name: "Editar", exact: true }).first().click();
  const edit = page.getByRole("dialog");
  await edit.getByLabel("Empresa").fill("Acme E2E");
  await edit.getByLabel("Cargo").fill("Diretora");
  await edit.getByLabel("Aniversário").fill("1990-02-28");
  await edit.getByLabel("Sites").fill("https://acme.test\nhttps://acme.test/sobre");
  // Wait for the server action, then reload: reopening must show what was persisted.
  const saved = page.waitForResponse((r) => r.request().method() === "POST");
  await edit.getByRole("button", { name: "Salvar" }).click();
  await saved;
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.reload();
  await page.getByRole("button", { name: "Editar", exact: true }).first().click();
  await expect(edit.getByLabel("Empresa")).toHaveValue("Acme E2E");
  await expect(edit.getByLabel("Cargo")).toHaveValue("Diretora");
  await expect(edit.getByLabel("Aniversário")).toHaveValue("1990-02-28");
  await expect(edit.getByLabel("Sites")).toHaveValue("https://acme.test\nhttps://acme.test/sobre");

  // A non-http(s) site is refused: toast error and the dialog stays open.
  await edit.getByLabel("Sites").fill("javascript:alert(1)");
  await edit.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(edit).toBeVisible();
  await page.keyboard.press("Escape");

  // Search by name filters the list.
  await page.getByPlaceholder("Buscar por nome ou número…").fill("Maria");
  await page.getByPlaceholder("Buscar por nome ou número…").press("Enter");
  await expect(list).toContainText("Maria E2E");
  await page.getByPlaceholder("Buscar por nome ou número…").fill("zzz-nada");
  await page.getByPlaceholder("Buscar por nome ou número…").press("Enter");
  await expect(page.getByText("Nenhum contato para")).toBeVisible();

  // Outbound-first: the dialog opens but no WAHA connection exists in e2e.
  await page.goto("/app/contacts");
  await page.getByRole("button", { name: "Nova conversa" }).first().click();
  const convDialog = page.getByRole("dialog");
  await expect(convDialog.getByText("Nenhuma conexão WhatsApp conectada")).toBeVisible();
  await page.keyboard.press("Escape");

  // Deal form: the contact picker offers inline contact creation. Funnel
  // creation lives on the settings page — the deals empty state links there.
  await page.goto("/app/deals");
  await page.getByRole("link", { name: "Criar funil" }).click();
  await page.waitForURL("**/app/settings/sales/funnels");
  await page.getByRole("button", { name: "Criar funil" }).click();
  const funnelDialog = page.getByRole("dialog");
  await funnelDialog.getByLabel("Nome").fill("Funil E2E");
  await funnelDialog.getByLabel("Modelo").click();
  await page.getByRole("option", { name: /Imobiliária/ }).click();
  await funnelDialog.getByRole("button", { name: "Criar funil" }).click();
  await page.waitForURL(/funnel=/);
  await page.goto("/app/deals");
  await expect(page.getByTestId("kanban-board")).toBeVisible();

  await page.getByRole("button", { name: "Deal", exact: true }).first().click();
  const dealDialog = page.getByRole("dialog");
  await dealDialog.getByLabel("Título").fill("Deal E2E");
  await dealDialog.getByPlaceholder("Buscar contato…").fill("Carlos Novo");
  await dealDialog.getByRole("button", { name: "Novo contato" }).click();
  const contactDialog = page.getByRole("dialog").last();
  await contactDialog.getByLabel("Telefone (WhatsApp)").fill("+55 21 97777-6666");
  await contactDialog.getByRole("button", { name: "Criar contato" }).click();
  await dealDialog.getByRole("button", { name: "Criar deal" }).click();
  await expect(page.getByTestId("kanban-board")).toContainText("Deal E2E");
});
