import { resolve } from "node:path";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Single env source: the repository root .env (Next only reads apps/web/.env*
// by default, so we load the root here explicitly).
loadEnvConfig(resolve(import.meta.dirname, "../.."));

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo: trace deps from the repo root so `standalone` includes the
  // root node_modules the app actually resolves through pnpm.
  outputFileTracingRoot: resolve(import.meta.dirname, "../.."),
  transpilePackages: [
    "@crm/auth",
    "@crm/channels",
    "@crm/config",
    "@crm/core",
    "@crm/db",
    "@crm/permissions",
    "@crm/ui",
  ],
  headers() {
    return Promise.resolve([
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]);
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
