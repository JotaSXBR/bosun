import { defineConfig } from "vitest/config";

// Single source for unit-runner perf flags: the root vitest.config.ts
// merges this, and each per-package vitest.config.ts stub re-exports it —
// `turbo run test` (CI) runs vitest inside each package dir, so it never
// sees the root config. Keep local `pnpm test` and CI in parity here.
export default defineConfig({
  test: {
    // Share workers across test files — no cross-file global state to
    // isolate (~540ms/file startup saving) — and keep transformed
    // modules on disk between runs.
    isolate: false,
    fsModuleCache: true,
  },
});
