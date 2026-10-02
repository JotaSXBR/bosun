// Plugins are resolved relative to this config file so consumers don't need
// prettier-plugin-tailwindcss in their own node_modules.
const tailwindPlugin = import.meta.resolve("prettier-plugin-tailwindcss");

/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  plugins: [tailwindPlugin],
};
