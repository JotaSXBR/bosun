# Status da execução — Plano v1.0

**Data de execução:** 2026-10-13
**Aprovação:** explícita, pelo usuário (todas as tarefas desbloqueadas,
recomendações principais D1–D12; D4 = manter Redis com bind `127.0.0.1`;
1 proxy confiável = Coolify/Traefik)
**Branch:** `chore/audit-plano-v1` (base `8c8aae6`) — 22 commits,
`tasks/plan-auditoria-crmv2.done.md` = contrato de escopo executado
**Commit de referência final:** ver `git log main..chore/audit-plano-v1`

## Resultado por tarefa

| Tarefa | AUDs             | Status         | Commit(s) principais                                                                                       |
| ------ | ---------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| T1.1   | AUD-011          | ✅             | `0b674f9` — mídia inline só p/ allowlist, resto attachment/octet-stream                                    |
| T1.2   | AUD-010, AUD-012 | ✅             | `e252015` — histórico por sessão + expiração 30d inatividade                                               |
| T2.1   | AUD-005          | ✅             | `6389401` — `.devin/config.json` deny/ask                                                                  |
| T2.2   | AUD-003          | ✅             | `114104e` — política de commits única                                                                      |
| T2.3   | AUD-002          | ✅             | `feacaf4` — gate `pnpm verify`/`verify:full`, 10 fontes unificadas                                         |
| T2.4   | AUD-004          | ✅             | `7c23254` — hook case-insensitive + `scope.test.mjs`                                                       |
| T2.5   | AUD-006          | ✅             | `a187399` — AGENTS.md 12,7→7,1KB, CLAUDE.md → `@AGENTS.md`                                                 |
| T2.6   | AUD-007, AUD-008 | ✅             | `5b6fcd2` — MCP honesto, política de skills, `.prettierignore`                                             |
| T2.7   | —                | ⚠️ consolidada | workspace externo `C:\Projetos\Auditoria-CRMv2` fundido neste diretório; config externa não se aplica mais |
| T3.1   | AUD-018          | ✅ (agente)    | `63d0435` — `.dockerignore` + doc. Passo humano alterado: ver desvio abaixo                                |
| T3.2   | AUD-013          | ✅             | `f46eb7f` — `unset DATABASE_ADMIN_URL` pós-migrate                                                         |
| T3.3   | AUD-017          | ⏸️ adiada      | Node 26 vira LTS ~2026-10-28; item já existia no TODO.md                                                   |
| T4.1   | AUD-015          | ✅             | `39f5ea8` — migração 0029 FORCE RLS, 15 tabelas                                                            |
| T4.2   | AUD-014          | ✅             | `0f6e4f5` — `clientIp` último hop XFF                                                                      |
| T4.3   | AUD-016 (a–f)    | ✅             | `f475c23` + `8090a9c`                                                                                      |
| T4.4   | AUD-019          | ✅             | `04c10b7` — `permissions: contents: read`, `rollback_ref` via env validado                                 |
| T4.5   | AUD-023          | ✅             | `9a4bfe6` — compose `127.0.0.1`, Redis mantido                                                             |
| T5.1   | AUD-021          | ✅             | `a218055`                                                                                                  |
| T5.2   | AUD-022          | ✅             | `69be50c` — remoções confirmadas executadas                                                                |
| T5.3   | AUD-020          | ✅             | `e97ae5f` — baseline de cobertura medida, sem threshold (D12)                                              |
| T5.4   | AUD-024          | ✅             | `d61926d` + `28f3076` — Concluído → `docs/changelog.md`                                                    |
| T6.1   | —                | ✅             | gates verdes; arquivo de auditoria commitado em `2e22799`                                                  |

## Verificação final (resultados reais)

- `pnpm verify` ✅ — format ✓, lint 0 erros (116 warnings preexistentes),
  typecheck 14/14, unit 26 arquivos / 192 testes
- `pnpm test:integration` ✅ — 42 arquivos / 267 testes (RLS cross-tenant
  pós-FORCE, widget/session scoping, cursor uuid→400)
- `pnpm build` ✅ — Next 16.3.8 standalone
- `pnpm test:e2e` ✅ — 17/17 (~1,4min)
- `pnpm test:coverage` — baseline por pacote registrada em
  `docs/development/testing.md` (thresholds adiados, D12)
- `pg_class` check — 0 tabelas com RLS sem FORCE
- compose — binds `127.0.0.1` verificados ao vivo nos 3 serviços

## Desvios da recomendação (decisões do usuário)

1. **`.coolify-secrets.tmp` mantido** (2026-10-13): o arquivo é referência
   local de secrets para o trabalho com o Coolify MCP enquanto o produto
   tem zero usuários. Permanece gitignored + fora do build context do
   Docker. Aposentadoria virou gatilho no `TODO.md`: primeiro usuário/dado
   real em produção → migrar para cofre e excluir. Commit `514e4e8`.
2. **T3.3 adiado** por calendário, não por recusa — Node 26 LTS ~2026-10-28.

## Pendências humanas restantes

- Rotação de secrets: desnecessária enquanto `.coolify-secrets.tmp` não
  sair da máquina (nunca commitado, nunca saiu do workspace local).
- Nenhuma operação externa (Coolify/GitHub produção) foi executada — as
  mudanças de workflow valem no próximo run de CI.

## Achados sem remediação direta

- **AUD-001** (regras do CRMv2 carregadas no workspace de auditoria):
  resolvida pela consolidação — os artefatos vivem agora neste diretório
  dentro do repo; config de workspace externo deixa de ser necessária.
- **AUD-009** (duplicações no ambiente de usuário): item de ambiente, não
  de repo — sem ação de código.
- **AUD-017** (Node 26 Current × 24 LTS): coberto por T3.3, adiado até o
  26 virar LTS.
- **AUD-008** (supply chain das skills vendorizadas): mitigação política
  via T2.6 (update só em PR próprio + diff review + ref pin, D8); revisão
  de conteúdo do pack fica como débito futuro, não urgente.
