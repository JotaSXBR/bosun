// Pure scope-matching helpers for the workflow hook (workflow.mjs).
// Kept side-effect-free so they are unit-testable (scope.test.mjs).

import { posix, win32 } from "node:path";

/**
 * Path of `p` relative to `cwd`, with forward slashes. On Windows the
 * comparison is case-insensitive (win32.relative lowercases drives) — the
 * hook must not depend on which casing the tool call happens to send.
 * Paths outside `cwd` come back "../…" and simply never match the globs.
 */
export function toRel(cwd, p) {
  const pathApi = process.platform === "win32" ? win32 : posix;
  return pathApi.relative(cwd, p).split(pathApi.sep).join("/");
}

/**
 * Scope globs parsed from a tasks/plan.md "## Escopo" section, or null
 * when none exists. Lines stop at the next heading.
 */
export function parseScopeLines(lines) {
  const out = [];
  let inScope = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^#{2,}\s+escopo\b/i.test(line)) {
      inScope = true;
      continue;
    }
    if (inScope && /^#{1,}\s/.test(line)) break;
    if (!inScope) continue;
    const glob = line
      .replace(/^[-*]\s+/, "")
      .replace(/^`|`$/g, "")
      .trim();
    if (glob && !glob.startsWith("<") && !glob.startsWith("<!--")) out.push(glob);
  }
  return out.length ? out : null;
}

// Minimal glob → regex: ** crosses /, * and ? stay within a segment.
export function globMatch(glob, path) {
  // Placeholders keep the single-"*"/"?" replaces from re-processing the
  // substitution text inserted for "**/" and "**".
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "\x01")
    .replace(/\*\*/g, "\x02")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\x01/g, "(.+/)?")
    .replace(/\x02/g, ".*");
  return new RegExp(`^${re}$`).test(path);
}
