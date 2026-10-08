import base from "@crm/eslint-config/base";

export default [
  ...base,
  {
    files: ["src/modules/**/*.ts"],
    rules: {
      // Modules are siblings: audit/ must not reach into organizations/ etc.
      // Cross-module code goes through the module index or shared src/ files.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // "../<module>/..." reaches a sibling module's internals;
              // "../../..." (shared src/) stays allowed.
              regex: "^\\.\\./(?!\\.\\./)[^/]+/",
              message:
                "Deep imports across modules are not allowed. Import shared code from src/ or the module's index.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/lib/pg-error.ts", "src/lib/pg-error.test.ts"],
    rules: {
      // Postgres driver errors are read only inside lib/pg-error.ts —
      // call sites use the typed PgError predicates/translatePgErrors.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='constraint_name']",
          message:
            "Read pg constraint names via @crm/core lib/pg-error.ts (isUniqueViolation & friends) — drizzle wraps driver errors on `cause`.",
        },
        {
          selector: "Literal[value=/^23[0-9A-Z]{3}$/]",
          message:
            "SQLSTATE literals live in lib/pg-error.ts — use its typed PgError predicates instead.",
        },
      ],
    },
  },
];
