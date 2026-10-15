import { describe, expect, it } from "vitest";

import { createGoogleOAuthClient, GoogleOAuthError } from "./google-oauth";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("google oauth client", () => {
  it("builds a consent URL asking for offline access to contacts", () => {
    const url = new URL(
      createGoogleOAuthClient().buildAuthUrl({
        clientId: "cid",
        redirectUri: "https://app.test/api/integrations/google/callback",
        state: "nonce",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("state")).toBe("nonce");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("scope")).toContain("auth/contacts");
  });

  it("exchanges a code for tokens and reads the account e-mail", async () => {
    const calls: string[] = [];
    const client = createGoogleOAuthClient((input) => {
      const url = input instanceof Request ? input.url : input.toString();
      calls.push(url);
      return Promise.resolve(
        url.includes("userinfo")
          ? json({ email: "owner@acme.test" })
          : json({ access_token: "at", refresh_token: "rt", expires_in: 3600 }),
      );
    });
    const result = await client.exchangeCode({
      clientId: "cid",
      clientSecret: "secret",
      redirectUri: "https://app.test/cb",
      code: "code",
    });
    expect(result.accountEmail).toBe("owner@acme.test");
    expect(result.tokens.accessToken).toBe("at");
    expect(result.tokens.refreshToken).toBe("rt");
    expect(new Date(result.tokens.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(calls).toHaveLength(2);
  });

  it("maps Google's error field to GoogleOAuthError", async () => {
    const client = createGoogleOAuthClient(() =>
      Promise.resolve(json({ error: "invalid_grant" }, 400)),
    );
    await expect(
      client.refreshAccessToken({ clientId: "c", clientSecret: "s", refreshToken: "r" }),
    ).rejects.toMatchObject({ name: "GoogleOAuthError", code: "invalid_grant" });
  });

  it("rejects an exchange without a refresh token", async () => {
    const client = createGoogleOAuthClient(() =>
      Promise.resolve(json({ access_token: "at", expires_in: 3600 })),
    );
    const error = await client
      .exchangeCode({ clientId: "c", clientSecret: "s", redirectUri: "https://x/cb", code: "c" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GoogleOAuthError);
    expect((error as GoogleOAuthError).code).toBe("missing_refresh_token");
  });
});
