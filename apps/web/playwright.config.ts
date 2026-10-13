import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL },
  webServer: {
    // CI runs the production build (ci.yml builds apps/web first): the dev
    // server's Turbopack compile loop plus Chromium + Postgres exceeded the
    // hosted runner's resources and got the e2e step SIGTERM'd mid-suite.
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: `${baseURL}/api/health`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
