# Plan — Observer modes (sem realtime): setting, interval scan, nudge cards

## Objetivo

`ai_observer_mode` por org (`off`/`on_close`/`interval`/`realtime`) governa
o observer; `interval` adiciona um scan determinístico **sem LLM** que emite
**nudge cards** no thread ("cliente aguardando — gerar sugestão?") ou, com
`auto_draft`, enfileira `generate-draft` direto. Observer agent vira row
`kind='observer'` lazy, configurável **owner-only** (system agent).
`realtime` fica desabilitado — depende do tool-loop do observer
(`brain_search`/`memory_propose`/`request_draft`), próxima fatia.

## Contexto (decisões)

- **Sem realtime nesta fatia** — UI mostra a opção disabled com nota de
  custo; o tool-loop do observer é a fatia seguinte.
- **Owner-only do observer junto**: `updateAgent`/`deleteAgentById` exigem
  `role==='owner'` quando `kind==='observer'` (system agent). Drafter
  (`kind='drafter'`) é org agent → `ai:manage` segue.
- **Mode gate dentro do job**, não no tx de resolve: payload ganha
  `force` (trigger manual "analisar agora" bypassa — click consciente).
  `off`/`interval` → job skipa silencioso.
- **Nudge = `agent_suggestions` `target_type='nudge'`** — reutiliza
  pending→reviewed + SSE + `messaging:write`. Índice parcial vira
  `target_type IN ('draft','nudge')` → **no máximo 1 card pendente por
  conversa** (draft ou nudge). Não aparece no inbox de settings (whitelist
  já filtra só config targets).
- **Nudge lifecycle por scan** (decisão): a cada tick o scan supersede
  nudges cujo predicado deixou de valer (última msg outbound, ticket
  resolvido/closed, draft pendente surgiu). Sem acoplamento ao send path.
- **Cooldown de nudge** = `observer_idle_minutes`: conv com nudge criado
  dentro da janela não é re-nudjada (evita spam pós-dismiss).
- **`auto_draft`** (org flag): scan enfileira `generate-draft`
  (mode='suggest', requestedBy=null) em vez de criar nudge — o scan já é
  o "quando" determinístico; o drafter continua dono do "o quê".
- **Scan multi-org**: query de candidatos em `withPlatformScope` (job de
  plataforma), escrita por org via `withTenant` + `observer_last_scan_at`.
- **Observer agent row lazy** (`findOrCreateAgentByKind` genérico no
  agents module, reusa `insertAgentOnce`): job honra `systemPrompt`
  (append "Instruções da organização" no prompt do observer — o contrato
  de schema permanece) e `modelRef` (override de `modelId` quando o
  provider casa com a credencial).
- **Composer disabled sem BYOK**: página passa `hasCredentials` —
  botões Sugerir/Melhorar disabled com tooltip (spec: "disabled state"),
  precheck na action já existente continua como rede de segurança.
- **Manual draft buttons funcionam em qualquer mode** (click explícito).

## Escopo

- `packages/db/src/schema/settings.ts`
- `packages/db/src/schema/ai.ts`
- `packages/db/migrations/**`
- `packages/core/src/modules/organizations/**`
- `packages/core/src/modules/agents/**`
- `packages/core/src/modules/drafts/**`
- `packages/core/src/modules/suggestions/**`
- `packages/core/src/modules/ai/**`
- `packages/core/src/index.ts`
- `packages/ai/src/**`
- `packages/automation/src/**`
- `apps/web/src/server/actions/**`
- `apps/web/src/server/services.ts`
- `apps/web/src/server/tenant.ts`
- `apps/web/src/components/**`
- `apps/web/src/lib/**`
- `apps/web/src/app/app/inbox/**`
- `apps/web/src/app/app/settings/ai/**`
- `apps/web/messages/pt-BR.json`
- `apps/web/e2e/**`
- `tasks/**`
- `docs/**`

## Tasks

- [ ] **T1 — schema+settings**: `organization_settings` +
      `ai_observer_mode`/`observer_interval_minutes`/`observer_idle_minutes`/
      `observer_auto_draft`/`observer_last_scan_at` (migration 0022); índice
      `agent_suggestions_pending_draft_idx` → `IN ('draft','nudge')`;
      service `updateObserverSettings` (`ai:manage`) + schema zod.
- [ ] **T2 — agents**: `findOrCreateAgentByKind` genérico
      (repository+service, reusa `insertAgentOnce`); `findOrCreateDrafter`
      migra pra ele; gate owner-only `kind==='observer'` em
      update/delete + int test.
- [ ] **T3 — thread cards** (drafts module): `NUDGE_TARGET_TYPE`,
      `listPendingThreadCards` (draft+nudge), `createNudgeSuggestion`,
      `reviewNudge` (approve|reject marca reviewed — enqueue é da action),
      `supersedeStaleNudges(orgs)` pro cleanup do scan; schemas + int tests.
- [ ] **Checkpoint C1**: typecheck+lint+migration+int core verdes.
- [ ] **T4 — observer-analyze**: payload `+force`; mode gate (skip se
      mode ∉ {on_close,realtime} e !force); `findOrCreateObserver` lazy;
      honra `systemPrompt` (append) + `modelRef` (modelId override se
      provider casa); int tests de gating.
- [ ] **T5 — observer-scan job**: fila `observer-scan` + schedule `*/5`
      no boss + `observerScanHandler` (due orgs → credenciais → candidatos
      idle → nudge OU enqueueGenerateDraft; cleanup supersede; marca
      last_scan_at) + `enqueueObserverScan` não necessário (cron-only) +
      int tests (nudge criado/skipped/auto-draft/cleanup/cooldown).
- [ ] **T6 — web**: seção observer em `/app/settings/ai` (mode select
  - interval/idle/auto_draft visíveis em interval; realtime disabled
  - nota de custo) + `updateObserverSettingsAction`; owner-only no
    agents-section (disable edit/delete p/ observer não-owner);
    `NudgeCard` (rationale + "Gerar sugestão"/"Dispensar") + página
    renderiza por `targetType` + `approveNudgeAction` (review +
    enqueueGenerateDraft + precheck credencial) + `rejectNudgeAction`;
    toast nudge-aware no inbox-live; composer disabled sem credencial;
    i18n pt-BR.
- [ ] **T7 — verify**: `format:check`+`typecheck`+`lint`+`test`+int
      relevantes + browser check (settings mode UI + nudge semeado →
      gerar→draft card) + atualizar TODO.md + archive plan.
