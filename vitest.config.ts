import { defineConfig } from "vitest/config";

// Unit tests only: `*.test.ts` must not require external infrastructure.
// Integration tests live in `*.int.test.ts` and run via `pnpm test:integration`.
export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    exclude: ["**/*.int.test.ts", "**/node_modules/**", "**/.next/**"],
  },
});
