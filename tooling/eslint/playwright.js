import playwright from "eslint-plugin-playwright";

// Playwright e2e specs. They run under @playwright/test — a different runner
// from vitest — so none of the vitest/test relaxations in base.js apply.
// Only packages that actually have an e2e/ directory should spread this
// (apps/web today); the import resolves here so consumers don't need
// eslint-plugin-playwright in their own dependency list.
export default [
  {
    files: ["e2e/**/*.ts"],
    plugins: { playwright },
    rules: {
      "playwright/no-focused-test": "error",
      "playwright/no-conditional-in-test": "warn",
      "playwright/no-networkidle": "warn",
    },
  },
];
