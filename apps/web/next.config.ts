import { resolve } from "node:path";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Single env source: the repository root .env (Next only reads apps/web/.env*
// by default, so we load the root here explicitly).
loadEnvConfig(resolve(import.meta.dirname, "../.."));

const nextConfig: NextConfig = {
  output: "standalone",
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

export default nextConfig;
