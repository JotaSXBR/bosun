import playwright from "eslint-plugin-playwright";

// Playwright e2e specs. They run under @playwright/test — a different runner
// from vitest — so none of the vitest/test relaxations in base.js apply.
// Only packages that actually have an e2e/ directory should spread this
// (apps/web today); the import resolves here so consumers don't need
// eslint-plugin-playwright in their own dependency list.
//
// flat/recommended severities are kept as shipped: the vendor preset already
// marks bug-class rules error (no-focused-test, missing-playwright-await,
// no-networkidle, no-unsafe-references, unused locators, web-first
// assertions, valid-*) and hygiene rules warn. Measured 2026-10 against
// apps/web/e2e: zero violations on every error-level rule; the only hit is
// playwright/no-useless-not (1, preset warn) — recorded as budget.
export default [
  {
    files: ["e2e/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
    },
  },
];
