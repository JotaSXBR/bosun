import { expect, test } from "@playwright/test";

test("owner convida por link, convidado aceita e entra na organização", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000); // dois sign-ups completos + aceite
  const suffix = crypto.randomUUID().slice(0, 8);
  const ownerEmail = `e2e-owner-${suffix}@crm.local`;
  const inviteeEmail = `e2e-invitee-${suffix}@crm.local`;

  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill("E2E Owner");
  await page.getByLabel("E-mail").fill(ownerEmail);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nome da organização").fill(`E2E Org ${suffix}`);
  await page.getByRole("button", { name: "Criar organização" }).click();
  await page.waitForURL("**/app");

  await page.goto("/app/settings/organization/members");
  await expect(page.getByTestId("members-section")).toBeVisible();
  // The creator appears as owner of the new org, marked as "você".
  await expect(page.getByTestId("member-row")).toHaveCount(1);
  await expect(page.getByTestId("member-row")).toContainText("(você)");

  // Invite by link — e-mail optional in the product; the copyable URL is the contract.
  await page.getByRole("button", { name: "Convidar" }).click();
  await page.getByLabel("E-mail").fill(inviteeEmail);
  await page.getByRole("button", { name: "Criar convite" }).click();
  const inviteUrl = await page.getByTestId("invite-url").inputValue();
  expect(inviteUrl).toContain("/accept-invitation/");
  await expect(page.getByTestId("invitation-row")).toContainText(inviteeEmail);

  // Invitee — same browser context minus the session cookies: landing
  // redirects to sign-in with ?next back to the invite.
  await context.clearCookies();
  await page.goto(inviteUrl);
  await page.waitForURL("**/sign-in?**");

  // New user — go to sign-up (keeps ?next), create the account with the
  // invited e-mail.
  await page.getByRole("link", { name: "Cadastre-se" }).click();
  await page.waitForURL("**/sign-up?**");
  await page.getByLabel("Nome").fill("E2E Convidado");
  await page.getByLabel("E-mail").fill(inviteeEmail);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  // Sign-up honors ?next → back on the invite, accept lands in /app.
  await page.waitForURL("**/accept-invitation/**");
  await page.getByTestId("accept-invitation").click();
  await page.waitForURL("**/app");
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();

  // Owner sees the accepted member.
  await context.clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("E-mail").fill(ownerEmail);
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/app");
  await page.goto("/app/settings/organization/members");
  await expect(page.getByTestId("member-row")).toHaveCount(2);
  await expect(page.getByTestId("invitation-row")).toHaveCount(0);
});
