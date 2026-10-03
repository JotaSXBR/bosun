import next from "@crm/eslint-config/next";
import playwright from "@crm/eslint-config/playwright";

const UI_BOUNDARY_MESSAGE =
  "UI must not touch the database or server auth; go through src/server helpers and @crm/core services.";

const config = [
  ...next,
  ...playwright,
  {
    ignores: ["test-results/**", "playwright-report/**", ".next/**"],
  },
  {
    // UI layer boundary: .tsx files and component code never import the db
    // handle, drizzle, or the server-side auth composition directly. Server
    // code (route handlers, server actions, src/server/*) keeps direct access.
    files: ["src/**/*.tsx", "src/components/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@crm/db", message: UI_BOUNDARY_MESSAGE },
            { name: "drizzle-orm", message: UI_BOUNDARY_MESSAGE },
            { name: "@crm/auth", message: UI_BOUNDARY_MESSAGE },
          ],
          patterns: [{ group: ["@crm/db/*", "drizzle-orm/*"], message: UI_BOUNDARY_MESSAGE }],
        },
      ],
    },
  },
];

export default config;
