import base from "@crm/eslint-config/base";
import { plugin as shadcn } from "@shadcn/lint";

const config = [
  ...base,
  {
    // Design-system linter — primitives legitimately use arbitrary values
    // (centering, radix CSS vars, focus rings) and Sonner's `toaster` hook;
    // those are allowlisted, everything else must use theme tokens. See
    // docs/development/design-system-lint.md.
    files: ["src/**/*.tsx"],
    plugins: { shadcn },
    rules: {
      "shadcn/no-arbitrary-values": [
        "error",
        {
          allow: [
            "ring-[3px]",
            "grid-rows-[auto_auto]",
            "grid-cols-[*]",
            "top-[50%]",
            "left-[50%]",
            "translate-x-[-50%]",
            "translate-y-[-50%]",
            "max-w-[*]",
            "min-w-[*]",
            "h-[var(*)]",
            "transition-[color,box-shadow]",
          ],
        },
      ],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-inline-styles": "warn",
      "shadcn/require-static-classes": "warn",
      "shadcn/no-unknown-classes": ["error", { allow: ["toaster"] }],
    },
  },
];

export default config;
