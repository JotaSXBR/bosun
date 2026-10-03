import base from "@crm/eslint-config/base";

const config = [
  ...base,
  {
    // This package IS the logging layer — writing to stdout/stderr (and, if
    // ever needed, console) is its job. The base config's `no-console`
    // exemption for "packages/observability/**" only matches when eslint runs
    // from the repo root; per-package runs see paths like src/logger.ts.
    rules: {
      "no-console": "off",
    },
  },
];

export default config;
