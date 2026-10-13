// Unit tests for the pure scope helpers (scope.mjs) used by workflow.mjs.
import { describe, expect, it } from "vitest";

import { globMatch, parseScopeLines, toRel } from "./scope.mjs";

describe("globMatch", () => {
  it("matches ** across segments and * within one segment", () => {
    expect(globMatch("apps/web/**", "apps/web/src/a.ts")).toBe(true);
    // "dir/**" requires content under dir — a bare "dir" is not a file anyway.
    expect(globMatch("apps/web/**", "apps/web")).toBe(false);
    expect(globMatch("apps/**/*.ts", "apps/a.ts")).toBe(true);
    expect(globMatch("apps/*", "apps/web")).toBe(true);
    expect(globMatch("apps/*", "apps/web/src")).toBe(false);
    expect(globMatch("**/*.md", "docs/a/b.md")).toBe(true);
    expect(globMatch("**/*.md", "docs/a/b.ts")).toBe(false);
  });

  it("does not let * escape to a different segment", () => {
    expect(globMatch("packages/db/src/*", "packages/db/migrations/x")).toBe(false);
  });
});

describe("parseScopeLines", () => {
  it("collects globs until the next heading", () => {
    const lines = [
      "# Plan",
      "## Escopo",
      "",
      "apps/web/**",
      "- packages/core/**",
      "`docker/**`",
      "<placeholder>",
      "## Fora de escopo",
      "should/not/match",
    ];
    expect(parseScopeLines(lines)).toEqual(["apps/web/**", "packages/core/**", "docker/**"]);
  });

  it("returns null without an Escopo section", () => {
    expect(parseScopeLines(["# Plan", "apps/web/**"])).toBeNull();
  });

  it("matches the heading case-insensitively", () => {
    expect(parseScopeLines(["## ESCOPO", "a/**"])).toEqual(["a/**"]);
  });
});

describe("toRel", () => {
  it("returns forward-slashed relative paths inside the root", () => {
    const root = process.platform === "win32" ? "C:\\repo" : "/repo";
    const file = process.platform === "win32" ? "C:\\repo\\src\\a.ts" : "/repo/src/a.ts";
    expect(toRel(root, file)).toBe("src/a.ts");
  });

  it("is case-insensitive on Windows", () => {
    if (process.platform !== "win32") return;
    expect(toRel("C:\\Projetos\\CRMv2", "c:\\projetos\\crmv2\\apps\\web\\x.ts")).toBe(
      "apps/web/x.ts",
    );
    expect(toRel("c:\\projetos\\crmv2", "C:\\Projetos\\CRMv2\\apps\\x.ts")).toBe("apps/x.ts");
  });

  it("paths outside the root never match a scope glob", () => {
    const outside = process.platform === "win32" ? "D:\\other\\x.ts" : "/other/x.ts";
    expect(globMatch("apps/**", toRel(process.cwd(), outside))).toBe(false);
  });
});
