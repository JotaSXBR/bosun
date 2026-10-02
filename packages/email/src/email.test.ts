import { describe, expect, it } from "vitest";

import { createEmailProvider } from "./factory";
import { ConsoleEmailProvider } from "./providers/console";
import type { FetchLike } from "./providers/resend";
import { ResendEmailProvider } from "./providers/resend";
import { SmtpEmailProvider } from "./providers/smtp";
import { FakeEmailProvider } from "./testing";

const baseEnv = {
  nodeEnv: "test" as const,
  email: {
    provider: "console" as const,
    from: "CRM <no-reply@crm.local>",
    resendApiKey: undefined,
    smtp: {
      host: undefined,
      port: undefined,
      user: undefined,
      password: undefined,
      secure: false,
    },
  },
};

describe("createEmailProvider", () => {
  it("selects console by default", () => {
    expect(createEmailProvider(baseEnv)).toBeInstanceOf(ConsoleEmailProvider);
  });

  it("selects resend with key + from", () => {
    const provider = createEmailProvider(
      {
        ...baseEnv,
        email: { ...baseEnv.email, provider: "resend", resendApiKey: "rk" },
      },
      {
        fetch: () =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(""),
          }),
      },
    );
    expect(provider).toBeInstanceOf(ResendEmailProvider);
  });

  it("throws a clear error when resend lacks config", () => {
    expect(() =>
      createEmailProvider({
        ...baseEnv,
        email: { ...baseEnv.email, provider: "resend" },
      }),
    ).toThrow(/RESEND_API_KEY/);
  });

  it("throws when smtp lacks host/port", () => {
    expect(() =>
      createEmailProvider({
        ...baseEnv,
        email: { ...baseEnv.email, provider: "smtp" },
      }),
    ).toThrow(/SMTP_HOST/);
  });

  it("selects smtp with host/port", () => {
    const provider = createEmailProvider({
      ...baseEnv,
      email: {
        ...baseEnv.email,
        provider: "smtp",
        smtp: {
          host: "localhost",
          port: 1025,
          user: undefined,
          password: undefined,
          secure: false,
        },
      },
    });
    expect(provider).toBeInstanceOf(SmtpEmailProvider);
  });
});

describe("ResendEmailProvider", () => {
  it("POSTs to api.resend.com with Bearer auth", async () => {
    const calls: {
      url: string;
      init?: { method?: string; headers?: Record<string, string>; body?: string };
    }[] = [];
    const fetchImpl: FetchLike = (url, init) => {
      calls.push({ url, init });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: "re_1" }),
        text: () => Promise.resolve(""),
      });
    };
    const provider = new ResendEmailProvider(
      { apiKey: "rk", from: "CRM <no-reply@crm.local>" },
      { fetch: fetchImpl },
    );
    const result = await provider.send({
      to: "u@x.com",
      subject: "Oi",
      text: "corpo",
      html: "<b>corpo</b>",
      replyTo: "r@x.com",
    });
    expect(result.id).toBe("re_1");
    const call = calls[0];
    expect(call?.url).toBe("https://api.resend.com/emails");
    expect(call?.init?.headers?.Authorization).toBe("Bearer rk");
    expect(JSON.parse(call?.init?.body ?? "{}")).toMatchObject({
      from: "CRM <no-reply@crm.local>",
      to: ["u@x.com"],
      subject: "Oi",
      text: "corpo",
      html: "<b>corpo</b>",
      reply_to: "r@x.com",
    });
  });

  it("throws on non-2xx", async () => {
    const fetchImpl: FetchLike = () =>
      Promise.resolve({
        ok: false,
        status: 422,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("bad"),
      });
    const provider = new ResendEmailProvider({ apiKey: "rk", from: "f" }, { fetch: fetchImpl });
    await expect(provider.send({ to: "a", subject: "s", text: "t" })).rejects.toThrow(/422/);
  });
});

describe("FakeEmailProvider", () => {
  it("records sends", async () => {
    const provider = new FakeEmailProvider();
    await provider.send({ to: "a", subject: "s", text: "t" });
    expect(provider.sent).toHaveLength(1);
  });
});
