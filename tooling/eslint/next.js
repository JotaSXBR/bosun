import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

import base from "./base.js";

export default [
  ...base,
  ...nextVitals,
  // eslint-config-next swaps the parser for every file (including plain JS);
  // disable type-checked rules for JS again after it.
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // React handlers (onSubmit={form.handleSubmit(fn)}, onClick={...})
      // legitimately return promises.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
];
