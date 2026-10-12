# TODO — Perf: correções da auditoria 2026-10-11

- [x] **Task 1 — F1**: `listContacts` LEFT JOIN + GROUP BY (sem count por linha)
- [x] **Task 2 — F3**: inbox com 1 lookup de última mensagem (jsonb em select-list;
      LATERAL medido pior e descartado)
- [x] **Task 3 — F10**: `listMessages` retorna as últimas N (cronológica)
- [x] **Checkpoint A**: typecheck+lint+testes alvo
- [x] **Task 4 — F2**: índice `(channel_connection_id, external_id, created_at desc)`
      — migration 0025 aplicada + EXPLAIN confirma Index Scan
- [x] **Task 5 — F4**: `cache()` por request em tenant/services (dedup)
- [x] **Task 6 — F11**: paginação `?page=` em `/app/contacts`
- [x] **Checkpoint B**: gate completo (typecheck 14/14, lint 0 erros, unit 167/167,
      int 260/260) + re-benchmark B1–B3 + relatório/TODO atualizados
