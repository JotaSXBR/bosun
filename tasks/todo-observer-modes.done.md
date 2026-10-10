# Tasks — observer-modes (sem realtime)

- [x] **T1** schema+settings: cols `ai_observer_mode`/`observer_interval_minutes`/`observer_idle_minutes`/`observer_auto_draft`/`observer_last_scan_at` (migration); índice pending `IN ('draft','nudge')`; `updateObserverSettings` (ai:manage) + zod
- [x] **T2** agents: `findOrCreateAgentByKind` genérico + `findOrCreateDrafter` migra; owner-only `kind==='observer'` em update/delete; int test
- [x] **T3** thread cards: `NUDGE_TARGET_TYPE`, `listPendingThreadCards`, `createNudgeSuggestion`, `reviewNudge`, `supersedeStaleNudges`; schemas + int tests
- **Checkpoint C1**: typecheck+lint+migration+int core
- [x] **T4** observer-analyze: `+force`, mode gate (skip fora de on_close/realtime), `findOrCreateObserver` lazy, honra systemPrompt (append) + modelRef (override se provider casa); int tests
- [x] **T5** observer-scan job: queue `observer-scan` + cron `*/5`, due orgs → BYOK → idle candidates → nudge OU enqueueGenerateDraft; cleanup supersede; last_scan_at; int tests
- [x] **T6** web: observer-section settings (mode select, realtime disabled+nota, interval/idle/auto_draft) + action; owner-only no agents UI; `NudgeCard` + página por targetType + approve/reject nudge actions; toast nudge; composer disabled sem credencial; i18n
- [x] **T7** verify: gates + int + browser (settings UI + nudge→gerar→draft) + TODO.md + archive
