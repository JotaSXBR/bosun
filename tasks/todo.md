# TODO — Perf: etapa 2 (F3-b denormalização)

- [x] **Task 1**: colunas `last_message_preview/direction` + migration 0026 com backfill
- [x] **Task 2**: `updateConversationLastMessage` com `{direction, preview}` + `messagePreviewText` + 3 call sites
- [x] **Task 3**: `refreshConversationLastMessage` em edit/revoke
- [x] **Task 4**: `listConversations` lê colunas — EXPLAIN com 0 subplanos
- [x] **Task 5**: int test — nota interna não apaga awaitingReply/preview (+reescrita do caso outbound pelo write path real)
- [x] **Checkpoint**: gate completo (typecheck 14/14, lint 0 erros, unit 167/167, int 261/261, format:check) + relatório/TODO + commits
