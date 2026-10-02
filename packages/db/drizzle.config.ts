import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

// Migrations must run as the owner role (bypasses RLS, owns objects).
// Uses the repository root .env — the single env source for the monorepo.
// drizzle-kit runs this config with cwd = packages/db; the root .env is two
// levels up. (drizzle-kit bundles the config to CJS, so import.meta.dirname
// is unavailable — use process.cwd().)
const rootEnv = resolve(process.cwd(), "../../.env");
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_ADMIN_URL (or DATABASE_URL) is required for drizzle-kit");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  casing: "snake_case",
  dbCredentials: { url },
});
