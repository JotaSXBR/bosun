import eslint from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import drizzle from "eslint-plugin-drizzle";
import security from "eslint-plugin-security";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

// Test files and test-support files, matched either by suffix or by living in
// a fixture/mock directory. Reused by the relaxations block and the vitest
// plugin block at the bottom of this config.
const TEST_FILE_GLOBS = [
  "**/*.test.{ts,tsx}",
  "**/*.int.test.{ts,tsx}",
  "**/{__fixtures__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}",
];

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/migrations/**",
      // NOTE: e2e/ is deliberately NOT ignored — a flat-config global ignore
      // can never be re-enabled, so it would make the playwright block in
      // apps/web dead config. Spec files (*.spec.ts) don't match the vitest
      // test globs, and src/-scoped rules don't reach e2e/ either.
      "**/*.tsbuildinfo",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      // Always-a-bug tier (all files, JS and TS alike).
      "no-var": "error",
      "prefer-const": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      // allowSeparateTypeImports: the codebase splits `import type` from value
      // imports on purpose (enforced by consistent-type-imports). The rule
      // still catches same-kind duplicates.
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      // `== null` stays allowed — it is the idiomatic null-or-undefined check.
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  {
    // Production code never writes to the console directly — it goes through
    // the @crm/observability logger. Exemptions live in the blocks AFTER this
    // one (flat config applies later blocks last for files matched by both).
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
  {
    // CLI-style entry points and the logger implementation itself.
    files: [
      // Repo-root glob: matches when eslint runs from the workspace root. The
      // observability package also disables no-console in its own config,
      // because per-package runs never see a "packages/observability" prefix.
      "packages/observability/**",
      "**/seed.ts",
      "**/init-bucket.ts",
      "**/scripts/**",
      "tooling/**",
    ],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Security lint over application source only (not config/scripts/tests —
    // tests intentionally hit some of these patterns).
    files: ["**/src/**/*.{ts,tsx}"],
    plugins: { security },
    rules: {
      "security/detect-eval-with-expression": "error",
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-unsafe-regex": "warn",
      "security/detect-child-process": "warn",
      // Deliberately NOT enabled: security/detect-object-injection fires on
      // every obj[variable] access — noUncheckedIndexedAccess already forces
      // handling of the resulting undefined, so the rule is pure noise here.
    },
  },
  {
    // Drizzle foot-guns: delete()/update() without .where() wipes the table.
    // drizzleObjectName limits the check to our known handles (db, tx) so
    // unrelated objects with a delete/update method don't trip it.
    files: ["**/src/**/*.{ts,tsx}"],
    plugins: { drizzle },
    rules: {
      "drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["db", "tx"] }],
      "drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["db", "tx"] }],
    },
  },
  {
    // Size/complexity budget — refactoring pressure, not a hard gate. Each
    // rule is "warn" until its violation count reaches zero, then it can be
    // promoted to "error". See docs/development/tooling.md.
    files: ["**/src/**/*.{ts,tsx}"],
    rules: {
      complexity: ["warn", 12],
      "max-depth": ["warn", 4],
      "max-params": ["warn", 4],
      "max-statements": ["warn", 20],
      "max-nested-callbacks": ["warn", 3],
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true }],
      // Hard stop on file size — largest source file is ~320 lines today.
      "max-lines": ["error", { max: 350, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      // Config files and scripts are Node code — declare the runtime so
      // no-undef doesn't fire on process/console/etc.
      globals: globals.node,
    },
  },
  {
    // Promotions from strictTypeChecked, adopted 2026-10 after a repo-wide
    // violation count: the three "error" rules had zero violations;
    // nullish-coalescing (1) and unnecessary-condition (4) stay at warn until
    // their counts reach zero. See docs/adr/0013.
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
    },
  },
  {
    // Test files get relaxed size limits (describe/it nesting and long
    // arrange sections are normal) and mock-friendly typings. This block and
    // the vitest block MUST stay last — they override earlier blocks for
    // files they match. max-params stays on for tests on purpose.
    files: TEST_FILE_GLOBS,
    plugins: { vitest },
    rules: {
      "max-statements": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
      "no-console": "off",
      "max-lines": ["warn", { max: 350, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/unbound-method": "off",
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "warn",
      "vitest/no-commented-out-tests": "warn",
    },
  },
);
