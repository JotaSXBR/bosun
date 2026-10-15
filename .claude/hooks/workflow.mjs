// Workflow hooks — enforces the repo's development process (docs/development/workflow.md).
// Reads the hook event JSON on stdin; prints a control JSON object on stdout.
//
//   SessionStart      → injects the workflow summary into context
//   UserPromptSubmit  → injects a one-line reminder when a task brief is active
//   PreToolUse        → blocks edits to files outside `tasks/plan.md`'s ## Escopo globs
//   PostToolUse       → marks the session as "files were edited"
//   Stop              → blocks once (per session) if files were edited, forcing a
//                       verification pass before the agent declares the work done
//   SessionEnd        → cleans the session marker

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { globMatch, parseScopeLines, toRel } from "./scope.mjs";

const ROOT = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const BRIEF = join(ROOT, "tasks", "plan.md");

const input = JSON.parse(await readStdin());
const event = input.hook_event_name;

switch (event) {
  case "SessionStart":
    emit({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: [
          "WORKFLOW (docs/development/workflow.md): spec in docs/product/* → /plan-task writes tasks/plan.md (## Escopo globs = the scope contract) → /build → /test → /review → /ship.",
          "A PreToolUse hook BLOCKS edits to source/config files outside the plan's Escopo. No plan yet → run /plan-task or confirm scope with the user before editing code. Docs/markdown are always editable.",
          "A Stop hook requires the verification gate (`pnpm verify`) after any edit session.",
          "Backlog source of truth: TODO.md → 'Produto — backlog' + docs/product/.",
        ].join("\n"),
      },
    });
    break;

  case "UserPromptSubmit": {
    const scope = readScope();
    if (scope) {
      emit({
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: `Active plan tasks/plan.md (${scope.length} escopo glob(s)). Stay inside it; expand only by editing the plan's Escopo (ask the user first).`,
        },
      });
    } else {
      emit({});
    }
    break;
  }

  case "PreToolUse": {
    const filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
    if (!filePath) emit({});
    else {
      const rel = toRel(ROOT, filePath);
      if (alwaysAllowed(rel)) emit({});
      else {
        const scope = readScope();
        if (!scope) {
          emit({
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              additionalContext:
                "No tasks/plan.md with an ## Escopo section found. For feature work, run /plan-task first — the plan is the contract that keeps work in scope.",
            },
          });
        } else if (scope.some((g) => globMatch(g, rel))) {
          emit({});
        } else {
          emit({
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: `Blocked by workflow hook: "${rel}" is outside the plan's Escopo (${scope.join(", ")}). Either revert, or ask the user to expand the Escopo in tasks/plan.md.`,
            },
          });
        }
      }
    }
    break;
  }

  case "PostToolUse":
    markEdited(input.session_id);
    emit({});
    break;

  case "Stop": {
    const marker = markerPath(input.session_id);
    const edited = existsSync(marker);
    if (edited && !input.stop_hook_active) {
      emit({
        decision: "block",
        reason:
          "Files were edited this session. Before finishing: run `pnpm verify` (`pnpm verify:full` when the change touches DB/providers), update TODO.md/docs touched by the work, and report what was verified.",
      });
    } else {
      if (edited) unlinkSync(marker);
      emit({});
    }
    break;
  }

  case "SessionEnd": {
    const marker = markerPath(input.session_id);
    if (existsSync(marker)) unlinkSync(marker);
    emit({});
    break;
  }

  default:
    emit({});
}

// --- helpers ---

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data || "{}";
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function markerPath(sessionId) {
  return join(tmpdir(), `crmv2-edited-${sessionId ?? "unknown"}`);
}

function markEdited(sessionId) {
  try {
    writeFileSync(markerPath(sessionId), new Date().toISOString());
  } catch {
    // marker failure must never break the agent loop
  }
}

/** Scope globs from `tasks/plan.md`'s "## Escopo" section, or null. */
function readScope() {
  try {
    if (!existsSync(BRIEF)) return null;
    const lines = readFileSync(BRIEF, "utf8").split(/\r?\n/);
    return parseScopeLines(lines);
  } catch {
    return null;
  }
}

// Docs/meta are always editable — the trava only governs source & config.
// (.claude/** stays allowed here because .claude/settings.json already guards
// rule files with `ask` permissions — AUD-004/T2.1.)
function alwaysAllowed(rel) {
  const allowed = ["**/*.md", "TODO.md", ".claude/**", "research/**", "**/migrations/meta/**"];
  return allowed.some((g) => globMatch(g, rel));
}
