# Plan — Execução do Plano v1.0 (auditoria CRMv2)

- **Origem**: `docs/audits/Auditoria-CRMv2/PLANO_DE_EXECUCAO.md` (v1.0) + `RELATORIO_AUDITORIA.md` (AUD-001…AUD-024)
- **Lifecycle**: execução de plano aprovado (não é o ciclo /spec → /ship de produto)
- **Data**: 2026-10-13
- **Autorização**: humana, registrada na sessão — todas as tarefas desbloqueadas; recomendação principal do relatório para D1–D12; D4 = manter Redis com bind local; 1 proxy confiável (Traefik/Coolify); infra local autorizada; um commit por tarefa, sem push; remoções de T5.2 confirmadas (packages/ui, graft, log corrompido, apps/web/Dockerfile).

## Objetivo

Aplicar as correções da auditoria (segurança do produto, salvaguardas do fluxo de IA, endurecimento e limpeza) em mudanças pequenas, testadas e reversíveis — um commit por tarefa.

## Contexto

- Bloqueadas/fora: T3.3 (Node 26 só vira LTS ~2026-10-28), T2.7 (fora do repo), passo humano de T3.1 (migrar/excluir `.coolify-secrets.tmp` — o agente só faz `.dockerignore`+doc).
- T1.2: D1 = histórico restrito a mensagens a partir da sessão atual + expiração por inatividade de 30 dias em `resolveWidgetSession`.
- T1.1: D2 = allowlist inline + `attachment`/`octet-stream` para o resto + `Content-Security-Policy: sandbox; default-src 'none'`.
- T2.3: D10 = scripts `verify`/`verify:full` no `package.json` raiz como fonte única do gate.
- T2.4: teste do hook mora em `.devin/hooks/workflow.test.mjs`, incluído no `pnpm test` via `vitest.config.ts`.
- T2.5: D6 = `CLAUDE.md` reduzido a ponteiro mínimo (`@AGENTS.md`).

## Escopo

<!-- Globs relativos à raiz; docs/markdown são sempre livres. -->

apps/web/**
packages/**
docker/**
.devin/**
.github/**
tasks/**
package.json
vitest.config.ts
.gitignore
.prettierignore
.dockerignore
Dockerfile
_.log
graft/_*

## Fora de escopo

- `.env`, `.coolify-secrets.tmp`, `.devin/mcp_config.local.json`, `docs/development/deployment.local.md` (nunca ler/editar)
- Produção, Coolify, GitHub (além de leitura), rotação/exclusão de segredos — ação humana
- `apps/worker`, novas dependências/infra, refactors fora das tarefas
- T3.3 (alinhar Node 24×26) — aguardando LTS
- T2.7 — workspace de auditoria (fora do repo)
- Exclusão de `.coolify-secrets.tmp` — ação humana

## Tarefas

1. **T1.1** Mídia segura — `apps/web/src/app/api/media/[id]/route.ts` + helper em `apps/web/src/lib/` + teste unitário (falha antes, passa depois).
2. **T1.2** Widget — `packages/core/src/modules/messaging/sitechat.ts` + repository + schema/migração se preciso (`last_seen_at` existe; vínculo sessão↔conversa pode exigir coluna) + testes de integração.
3. **T2.1** `.devin/config.json` com `deny`/`ask` mínimos.
4. **T2.2** Regra de commits em `AGENTS.md` + `.devin/skills/build/SKILL.md`.
5. **T2.3** `verify`/`verify:full` no `package.json` + unificar referências (AGENTS, CLAUDE, workflow.md, /test, hook Stop, CONTRIBUTING, PR template, plan.template).
6. **T2.4** `workflow.mjs`: `toRel` case-insensitive + `workflow.test.mjs` + `.gitignore` + `workflow.md` (limites do hook).
7. **T2.5** `AGENTS.md` ≤ ~6 KB (How-tos → `docs/development/how-tos.md`) + `CLAUDE.md` ponteiro.
8. **T2.6** `workflow.md` (MCP, atualização de skills), `deployment-coolify.md` (REST→escalar), `.prettierignore` (manter `.devin/skills/` justificado ou restringir).
9. **T3.1** `.dockerignore` (`.coolify-secrets.tmp`, `*.log`) + `deployment-coolify.md` sem menção ao tmp.
10. **T3.2** `docker/web/entrypoint.sh`: `unset DATABASE_ADMIN_URL` após migrar + doc.
11. **T4.1** Migração custom FORCE RLS (tabelas de 0012, 0013, 0015–0018 com policy) + checklist `AGENTS.md` + `docs/database/README.md`.
12. **T4.2** `apps/web/src/lib/widget-http.ts`: `clientIp` usa último hop do XFF + teste.
13. **T4.3** 6 endurecimentos: (a) auth log sem `text`; (b) `after` z.uuid; (c) meta-cloud timing-safe; (d) waha origin; (e) convite sem e-mail alheio; (f) `poweredByHeader: false`.
14. **T4.4** `ci.yml` `permissions: contents: read`; `cd.yml` rollback_ref via `env:` + regex.
15. **T4.5** `docker/compose.yml` portas `127.0.0.1:` (Redis mantido).
16. **T5.1** Docs: `tooling.md` thresholds, `testing.md` webServer, Trigger→pg-boss (security/providers/multi-tenancy), `design-system-lint.md`, papel `viewer`.
17. **T5.2** Remoções: `packages/ui/`, `graft/`, log corrompido, `apps/web/Dockerfile`, entradas `.trigger-selfhost`/trigger dos ignores.
18. **T5.3** `testing.md`: `pnpm test` local × `turbo run test` CI; medir baseline de cobertura e registrar.
19. **T5.4** Mover "Concluído" de `TODO.md` para `docs/changelog.md`.
20. **T6.1** Gate final + integração/e2e + relatório.

## Critérios de pronto

- [ ] `pnpm format:check` + `pnpm lint` + `pnpm typecheck` + `pnpm test` verdes (gate; após T2.3 = `pnpm verify`)
- [ ] Testes de segurança novos falham antes e passam depois (T1.1, T1.2, T4.2)
- [ ] `pnpm test:integration` verde nas tarefas que tocam DB (T1.2, T4.1, T4.5)
- [ ] Um commit convencional por tarefa; nenhum arquivo fora do Escopo alterado
- [ ] Relatório final com comandos reais, tarefas puladas e riscos residuais
