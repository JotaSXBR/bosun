import { defineConfig } from "vitest/config";

// Integration tests require local infrastructure (Postgres, etc.).
// Run `pnpm infra:up && pnpm db:migrate` first.
export default defineConfig({
  test: {
    include: ["packages/**/*.int.test.ts", "apps/**/*.int.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
