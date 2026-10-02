import base from "@crm/eslint-config/base";

export default [
  ...base,
  // seed.ts is a script — allow console output.
  {
    files: ["src/seed.ts", "src/auth.ts"],
    rules: { "no-console": "off" },
  },
];
