# Implementation Plan: Multi-atendimento slice 4 — settings + teams UI

## Overview

Deliver the administration surface of multi-atendimento: `/app/settings`
with the org settings form — exposing `ticketReopenWindowHours` (today
SQL-only) plus the already-modeled `offHoursMessage`/`timezone`/`locale` —
and `/app/settings/teams` with teams CRUD and member management. The domain
is nearly complete: `@crm/core/teams` ships the full CRUD and
`@crm/core/organizations` ships settings get-or-create/update minus the
reopen-window field. Work = one small domain gap + web wiring + two pages.

## Architecture Decisions

- **`ticketReopenWindowHours` bounds: int 1–168** (7 dias, user decision) —
  `z.number().int().min(1).max(168).optional()` in `updateOrgSettingsInput`;
  `undefined` keeps the stored value (drizzle skips `undefined` in
  `values`/`set`, so partial update semantics are preserved).
- **Duplicate team name → `DomainError("TEAM_NAME_TAKEN")`** thrown inside
  `createTeam`/`updateTeam` by catching pg `23505` on
  `teams_org_name_idx` — postgres.js surfaces `error.code`, and drizzle may
  wrap it on `error.cause`, so check both. Race-safe, no extra query, and
  `DomainError.message` flows through the action's PT-BR `errorMessage`.
- **Two new action files**: `server/actions/settings.ts`
  (`updateOrgSettingsAction`) and `server/actions/teams.ts` (5 team/member
  actions) — `organization.ts` stays untouched (surgical diffs); both
  follow the `messaging.ts` pattern (`requireTenantContext` → service →
  `revalidatePath` → `{ ok } | { ok: false, error }` PT-BR).
- **Role gating via `hasPermission(ctx.role, …)`** from `@crm/permissions`
  (already a web dep; `ctx.role` is `OrgRole`): settings edit needs
  `organization:update` (owner/admin), team management needs
  `teams:manage` (owner/admin/manager). Pages render for everyone — reads
  only need `messaging:read`/`teams:read` — with controls disabled or
  hidden when the role can't write.
- **No `dialog` component**: inline forms + select + `window.confirm` for
  delete, same convention as slice 3's transfer picker.
- **Member names resolved server-side**: page passes `TeamWithMembers[]`
  - `OrgMember[]` to one small client island; the island maps
    `memberUserIds` → names and offers non-members in the add-picker.
- **Form stack**: `react-hook-form` + `zodResolver` + `@crm/ui` Form/Input/
  Textarea (the `new-connection-form.tsx` recipe). Number input uses
  `z.coerce.number().int().min(1).max(168)` on the client, mirroring the
  domain schema.

## Task List

### Phase 1: Domain

- [x] Task 1: `ticketReopenWindowHours` in `@crm/core/organizations`
- [x] Task 2: `TEAM_NAME_TAKEN` DomainError in teams service

### Checkpoint: Foundation

- [x] `pnpm typecheck && pnpm lint` green; organizations/teams unit+int
      tests green (int needs `pnpm infra:up`)

### Phase 2: Web wiring

- [x] Task 3: `getOrgSettings` wrapper + `actions/settings.ts` +
      `actions/teams.ts`

### Phase 3: Pages

- [x] Task 4: `/app/settings` — org settings form (gated by
      `organization:update`)
- [x] Task 5: `/app/settings/teams` — teams CRUD + member management
      (gated by `teams:manage`)

### Phase 4: Nav + wrap-up

- [x] Task 6: "Configurações" link on `/app`, e2e smoke spec, docs

### Checkpoint: Complete

- [x] `format:check && typecheck && lint && test` green; `next build` ok;
      settings int test covering the new field passes

## Risks and Mitigations

| Risk                                                     | Impact | Mitigation                                                                                                                                                    |
| -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drizzle wraps the pg error so `error.code` is on `cause` | Low    | `isUniqueViolation` helper checks `err.code` **and** `err.cause?.code`, plus `constraint_name === "teams_org_name_idx"`; int test on duplicate name proves it |
| `offHoursMessage` null vs empty-string semantics         | Low    | Schema is `.nullish()`; form sends `null` when cleared, `undefined` when untouched                                                                            |
| Number input returns `""`/`NaN`                          | Low    | `z.coerce.number().int().min(1).max(168)` client-side + domain schema re-validates on the server                                                              |
| Manager sees settings form but can't save                | Low    | `canEdit` flag renders fields `disabled` and hides submit — server still enforces `organization:update`                                                       |
| Team delete while conversations reference it             | None   | `conversations.sector_id` is `onDelete: set null` — verified                                                                                                  |

## Open Questions

- None — decisions recorded in `.task-brief.md ## Contexto`.
