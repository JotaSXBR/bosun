// BOSUN design-system adherence — ESLint port of
// design-system/lint/adherence.oxlintrc.json (Claude Design export).
// The per-component prop/enum allowlists in that file are enforced here by
// the components' TypeScript types (strict typecheck); react/forbid-elements
// had an empty list. Only what TS can't see lives below.
export const designSystemSyntax = [
  {
    selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
    message: "Raw hex color — use a design-system color token via var().",
  },
  {
    selector: "Literal[value=/\\b\\d+px\\b/]",
    message: "Raw px value — use a design-system spacing token via var().",
  },
  {
    selector: "Literal[value=/font-family\\s*:\\s*(?!['\\\"]?(?:Inter|JetBrains Mono|Manrope))/i]",
    message: "Font not provided by the design system. Available: Inter, JetBrains Mono, Manrope.",
  },
];
export const designSystemImports = {
  patterns: [
    {
      group: [
        "@crm/ui/src/**",
        "**/design-system/src/**",
        "**/design-system/reference/**",
        "**/design-system/assets/**",
      ],
      message:
        "Import the design system through @crm/ui package exports (components/*, templates/*, lib/*, hooks/*) — never internals or reference files.",
    },
  ],
};
export function designSystemAdherence({ files, restrictImports = true }) {
  return {
    files,
    rules: {
      "no-restricted-syntax": ["error", ...designSystemSyntax],
      ...(restrictImports && {
        "@typescript-eslint/no-restricted-imports": ["error", designSystemImports],
      }),
    },
  };
}
