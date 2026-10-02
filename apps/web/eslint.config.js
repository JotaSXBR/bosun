import next from "@crm/eslint-config/next";

const config = [
  ...next,
  {
    ignores: ["test-results/**", "playwright-report/**", ".next/**"],
  },
];

export default config;
