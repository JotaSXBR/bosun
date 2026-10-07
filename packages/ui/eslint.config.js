import base from "@crm/eslint-config/base";
import { plugin as shadcn } from "@shadcn/lint";

const config = [
  ...base,
  {
    // Design-system linter spike — measuring violations before enforcing.
    files: ["src/**/*.tsx"],
    plugins: { shadcn },
    rules: {
      "shadcn/no-arbitrary-values": "warn",
      "shadcn/no-raw-colors": "warn",
      "shadcn/no-inline-styles": "warn",
      "shadcn/require-static-classes": "warn",
      "shadcn/no-unknown-classes": "warn",
    },
  },
];

export default config;
