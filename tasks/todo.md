# TODO — Perf: etapa 3 (leituras desnormalizadas + N+1 restantes)

- [x] **Task 1**: drafts/repository.ts — `listNudgeCandidates`/`listStaleNudges` leem `last_message_direction`/`last_message_at` (subplanos removidos)
- [x] **Task 2**: regressão — nota privada não suprime nudge; outbound pública vira stale (2 testes novos, 10/10 no arquivo)
- [x] **Task 3**: F8 — `listStagesByFunnels` (repo) + `listStagesForFunnels` (service) + `listFunnelsWithStages` em 2 queries
- [x] **Task 4**: F14 — EXPLAIN (Seq Scan + sort, 62 buffers) → índice parcial `messages(conversation_id, created_at desc) where direction='inbound'` (migration 0027) → Bitmap Heap Scan
- [x] **Checkpoint**: gate completo (format ✅, typecheck 14/14, lint 0 erros, unit 167/167, int 263/263) + relatório/TODO + commits
