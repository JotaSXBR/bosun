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
];
