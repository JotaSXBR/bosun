import { getRequestConfig } from "next-intl/server";

// Single-locale app (pt-BR). A second locale is a new file in messages/ —
// per docs/product/rules.md — no routing segment is involved.
export default getRequestConfig(async () => ({
  locale: "pt-BR",
  messages: (await import("../../messages/pt-BR.json")).default,
}));
