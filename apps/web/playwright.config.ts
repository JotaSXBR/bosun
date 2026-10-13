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
    // CI runs the standalone production build (ci.yml builds apps/web first
    // and copies .next/static + public next to server.js, like the Docker
    // image): `next start` is unsupported with output:"standalone", and the
    // dev server's Turbopack compile loop plus Chromium + Postgres exceeded
    // the hosted runner's resources and got the e2e step SIGTERM'd mid-suite.
    // The standalone server hardcodes NODE_ENV=production (server.js line
    // 11), so ci.yml sets AUTH_REQUIRE_EMAIL_VERIFICATION/AUTH_RATE_LIMIT=false
    // for the e2e step — specs sign up without verifying e-mail.
    command: process.env.CI
      ? "PORT=3000 HOSTNAME=localhost node .next/standalone/apps/web/server.js"
      : "pnpm dev",
    url: `${baseURL}/api/health`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
