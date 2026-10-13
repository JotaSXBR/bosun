# Plano de Execução — Melhorias do CRMv2 e do ambiente de desenvolvimento assistido por IA

- **Versão do plano:** 1.0 (2026-10-13)
- **Base:** `RELATORIO_AUDITORIA.md` (mesma pasta), commit auditado `8c8aae6` de `main`.
- **Raiz dos caminhos:** raiz do repositório `CRMv2` (ex.: `C:\Projetos\CRMv2`), salvo indicação contrária.
- **Status:** **NÃO APROVADO.** Nenhuma tarefa pode ser executada sem autorização humana explícita que cite esta versão do plano e as fases/tarefas autorizadas.

---

## 1. Objetivo e escopo

Converter os achados `AUD-001`…`AUD-024` em mudanças pequenas, verificáveis e reversíveis, priorizando: (1) riscos de segurança do produto, (2) salvaguardas do fluxo de IA, (3) riscos P2 de infraestrutura, (4) endurecimentos P3, (5) documentação e limpeza.

Fora do escopo: reestruturação arquitetural, atualização de dependências não citadas, novas ferramentas (exceto o `.devin/config.json`, mecanismo nativo do Devin), mudanças em produção/Coolify/GitHub feitas pelo agente.

## 2. Estratégia

- Uma tarefa = um branch ou um commit isolado, com verificação própria. Nada de agrupar tarefas independentes.
- Toda decisão marcada `Dn` (seção 19 do relatório) precisa estar respondida antes da tarefa que depende dela; caso contrário a tarefa fica **bloqueada**.
- Código de segurança vem com teste que falha antes e passa depois.
- Arquivos de governança (AGENTS.md, `.devin/**`) mudam em commits próprios, revisáveis pelo humano.
- Operações com efeito externo (Coolify, GitHub, rotação de segredos, exclusão de segredos) são **sempre executadas pelo humano**; o agente apenas prepara instruções.

### Legenda de efeitos dos comandos

| Marca       | Significado                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| `[LEITURA]` | Não altera arquivos nem serviços                                                           |
| `[ESCREVE]` | Altera arquivos do repositório                                                             |
| `[CACHE]`   | Escreve apenas artefatos gerados/ignorados (`.turbo`, `coverage`, `.next`, `node_modules`) |
| `[INFRA]`   | Sobe/derruba containers ou altera banco local                                              |
| `[GIT]`     | Altera estado do Git (branch, índice, commit)                                              |
| `[EXTERNO]` | Acessa serviço externo (rede, GitHub, Coolify)                                             |

Comandos de verificação (todos existem em `package.json`):

| Comando (PowerShell)                                   | Efeito                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `git status --porcelain=v1 -b`                         | `[LEITURA]` (pode atualizar o índice; use `git --no-optional-locks status ...` para evitar) |
| `pnpm typecheck`                                       | `[CACHE]`                                                                                   |
| `pnpm lint`                                            | `[CACHE]`                                                                                   |
| `pnpm format:check`                                    | `[LEITURA]`                                                                                 |
| `pnpm test` / `pnpm --filter @crm/<pkg> test`          | `[CACHE]`                                                                                   |
| `pnpm infra:up`                                        | `[INFRA]` (Docker)                                                                          |
| `pnpm db:migrate`, `pnpm db:seed`, `pnpm storage:init` | `[INFRA]` (banco/bucket locais)                                                             |
| `pnpm test:integration`                                | `[INFRA]` (exige infra local)                                                               |
| `pnpm test:e2e`                                        | `[INFRA]` (sobe servidor)                                                                   |
| `pnpm build`                                           | `[CACHE]`                                                                                   |
| `pnpm db:generate`                                     | `[ESCREVE]` (gera migração)                                                                 |
| `pnpm format`                                          | `[ESCREVE]` — **não usar como verificação**; só se o humano pedir                           |

## 3. Ordem das fases e dependências

```
Fase 0 (proteção) ──► Fase 1 (segurança P1) ──► Fase 3 (P2 infra/segurança)
        │                                               │
        └──► Fase 2 (salvaguardas IA) ──────────────────┤
                                                        ▼
                                  Fase 4 (endurecimento P3) ──► Fase 5 (docs/limpeza) ──► Fase 6 (verificação final)
```

- Fases 1 e 2 são independentes entre si; podem ser autorizadas em qualquer ordem. Recomenda-se 1 antes, porque expõe dados de clientes.
- T2.5 depende de T2.2 e T2.3. T5.1 depende de T2.3 (gate) para não reescrever docs duas vezes. T3.3 está bloqueada por D3 e pela data de LTS.

## 4. Resumo das tarefas

| Tarefa                                    | Achados          | Gravidade | Aprovação/decisão           | Situação                      |
| ----------------------------------------- | ---------------- | --------- | --------------------------- | ----------------------------- |
| T0.1 Proteger estado inicial              | —                | —         | Autorização geral           | Pronta                        |
| T1.1 Mídia segura                         | AUD-011          | P1        | D2                          | Pronta após D2                |
| T1.2 Identidade e expiração do widget     | AUD-010, AUD-012 | P1/P2     | D1                          | Bloqueada até D1              |
| T2.1 Permissões do Devin                  | AUD-005, AUD-004 | P2        | D11                         | Pronta após D11               |
| T2.2 Regra de commits                     | AUD-003          | P2        | Autorização                 | Pronta                        |
| T2.3 Gate único                           | AUD-002          | P2        | D10                         | Pronta após D10               |
| T2.4 Ajustes do hook                      | AUD-004          | P2        | Autorização                 | Pronta                        |
| T2.5 Enxugar AGENTS.md/CLAUDE.md          | AUD-006          | P3        | D6                          | Depende de T2.2, T2.3         |
| T2.6 Docs de governança e skills          | AUD-007, AUD-008 | P3        | Autorização                 | Pronta                        |
| T2.7 Isolamento do workspace de auditoria | AUD-001          | P2        | Autorização (fora do CRMv2) | Condicional                   |
| T3.1 Segredos locais                      | AUD-018          | P2        | D7 (ação humana)            | Humano primeiro               |
| T3.2 Credencial owner fora do runtime     | AUD-013          | P2        | D9                          | Pronta após D9                |
| T3.3 Alinhar versão do Node               | AUD-017          | P2        | D3                          | Bloqueada (data/decisão)      |
| T4.1 FORCE RLS                            | AUD-015          | P3        | Autorização                 | Pronta                        |
| T4.2 IP confiável no rate limit           | AUD-014          | P3        | Autorização                 | Pronta (requer info de proxy) |
| T4.3 Endurecimentos menores               | AUD-016          | P3        | Autorização                 | Pronta                        |
| T4.4 Workflows do Actions                 | AUD-019          | P3        | D5                          | Pronta                        |
| T4.5 Compose local                        | AUD-023          | P3        | D4                          | Pronta após D4                |
| T5.1 Docs técnicas                        | AUD-021, AUD-007 | P3        | Autorização                 | Depende de T2.3               |
| T5.2 Remoções condicionais                | AUD-022          | P3        | D4 + confirmações           | Condicional                   |
| T5.3 Testes/cobertura                     | AUD-020          | P3        | D12                         | Parcialmente bloqueada        |
| T5.4 Continuidade (opcional)              | AUD-024          | P3        | Autorização                 | Opcional                      |
| T6.1 Verificação final e relatório        | todos            | —         | —                           | Sempre                        |

AUD-009 (ambiente do usuário, fora do repositório) não gera tarefa: é informação para o usuário decidir.

---

## 5. Fase 0 — Proteção do estado atual

### T0.1 — Registrar e proteger o estado inicial

- **Objetivo:** garantir recuperação e separar alterações preexistentes das novas.
- **Pré-requisitos:** autorização humana citando “Plano v1.0” e as tarefas autorizadas.
- **Operações:**
  1. `git --no-optional-locks status --porcelain=v1 -b --untracked-files=all` `[LEITURA]` — registrar saída completa.
  2. `git --no-optional-locks log --oneline -5` `[LEITURA]` — registrar HEAD.
  3. `git --no-optional-locks stash list` `[LEITURA]`.
  4. Se houver alterações não commitadas do usuário: **parar** e perguntar como proceder (não usar stash/reset/checkout).
  5. Com árvore limpa: `git switch -c chore/audit-fase-<n>` `[GIT]` a partir de `main` atualizado (não fazer `pull`/`fetch` sem autorização `[EXTERNO]`).
- **Aceite:** saída inicial registrada; branch criado; nenhuma alteração do usuário tocada.
- **Parada:** HEAD diferente de `8c8aae6` → comparar o diff de `8c8aae6..HEAD` nos arquivos citados pelo plano; se algum arquivo-alvo mudou, parar e reavaliar a tarefa afetada.
- **Recuperação:** `git switch main` `[GIT]`; branch descartável só com aprovação.
- **Evidências:** saídas dos comandos acima.

---

## 6. Fase 1 — Segurança do produto (P1)

### T1.1 — Servir mídia com segurança (AUD-011)

- **Decisão:** D2 (allowlist inline). Padrão proposto: `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `audio/*`, `video/mp4`, `video/webm`, `application/pdf` (PDF opcional — confirmar).
- **Arquivos:**
  - modificar `apps/web/src/app/api/media/[id]/route.ts` (`mediaResponse`);
  - opcionalmente extrair helper puro para `apps/web/src/lib/media-upload.ts` (ou novo `apps/web/src/lib/media-response.ts`) para teste unitário;
  - testes: `apps/web/src/lib/media-upload.test.ts` (ou `media-response.test.ts`).
- **Alterações:** se o tipo (normalizado, sem parâmetros) não estiver na allowlist → `content-type: application/octet-stream` e `content-disposition: attachment; filename="..."`; sempre adicionar `Content-Security-Policy: sandbox; default-src 'none'` e manter `cache-control` atual. Não alterar a lógica de autorização (`getTenantContext`, `resolveMessageMedia`).
- **Preservar:** 401/403/404/400/500 atuais; `captureException`; cache privado.
- **Testes:** unitários para `text/html`, `image/svg+xml`, `application/xhtml+xml`, tipo ausente, `image/png; charset=...`; `pnpm --filter @crm/web test` `[CACHE]`, `pnpm typecheck`, `pnpm lint`.
- **Aceite:** testes novos passam; tipos fora da allowlist nunca saem `inline`; UI de chat ainda exibe imagens/áudios (verificação manual ou e2e existente).
- **Riscos/parada:** se algum componente de UI depender de pré-visualização inline de documentos, parar e consultar.
- **Recuperação:** `git revert` do commit.
- **Evidências:** diff, saída dos testes.

### T1.2 — Identidade e expiração do widget (AUD-010, AUD-012)

- **Bloqueada até D1.** Proposta padrão: (a) histórico entregue ao widget restrito a mensagens/conversas criadas a partir da sessão atual (ou conversa nova por sessão); (b) expiração por inatividade de 30 dias verificada em `resolveWidgetSession`.
- **Arquivos:** `packages/core/src/modules/messaging/sitechat.ts`, `packages/core/src/modules/messaging/repository*.ts` (consultas `findLatestConversationForChat`, `listWidgetMessages`, `findSiteChatSessionByToken`), possivelmente `packages/db/src/schema/messaging.ts` + nova migração se for preciso guardar vínculo sessão↔conversa ou `expiresAt`; testes `packages/core/src/modules/messaging/sitechat.int.test.ts`, `apps/web/src/app/api/widget/widget.int.test.ts`; doc `docs/product/inbox.md` (ou spec do site chat).
- **Ordem:** escrever testes de integração que reproduzem o problema (nova sessão com e-mail de outro visitante lê histórico; sessão antiga além do limite aceita) → implementar → migração (se necessária) com `pnpm db:generate` `[ESCREVE]`, revisar SQL, `pnpm db:migrate` `[INFRA]` local.
- **Preservar:** identidade da mensagem vem da sessão, nunca do input (`sendWidgetMessage`); `withServiceAccess` só para resolver por token; filtro `contactId` do stream.
- **Testes:** `pnpm infra:up` `[INFRA]`, `pnpm db:migrate` `[INFRA]`, `pnpm test:integration` `[INFRA]`, `pnpm typecheck`, `pnpm lint`, `pnpm --filter @crm/core test`.
- **Aceite:** testes novos falham antes e passam depois; comportamento descrito na doc de produto.
- **Riscos/parada:** mudança de schema em tabela com dados de produção → migração aditiva apenas; se exigir remoção/renomeação de coluna, parar (expand/contract precisa de aprovação).
- **Recuperação:** `git revert`; migração aditiva não precisa de rollback imediato (coluna nova ignorada pelo código antigo).
- **Evidências:** diff, SQL gerado, saída dos testes.

---

## 7. Fase 2 — Salvaguardas do fluxo de IA

### T2.1 — Permissões do Devin (AUD-005; reforça AUD-004)

- **Decisão:** D11 (lista final).
- **Arquivo:** criar `.devin/config.json` (versionado). Proposta inicial:

```json
{
  "permissions": {
    "deny": [
      "Exec(git push --force)",
      "Exec(git reset --hard)",
      "Exec(git clean)",
      "Write(.env)",
      "Write(.coolify-secrets.tmp)"
    ],
    "ask": [
      "Write(AGENTS.md)",
      "Write(CLAUDE.md)",
      "Write(.devin/**)",
      "Write(.github/**)",
      "Write(packages/db/migrations/**)",
      "Exec(git push)",
      "Exec(git commit)",
      "Exec(pnpm db:migrate)",
      "Exec(pnpm infra:down)",
      "mcp__coolify__*"
    ]
  }
}
```

- **Observações:** sintaxe conforme a doc oficial de permissões (`Exec(prefixo)`, `Write(glob)`, `mcp__servidor__*`). Antes de restringir ferramentas específicas do Coolify, listar os nomes reais com `/mcp` numa sessão no CRMv2. `.devin/` está em `.prettierignore`? Não — só `.devin/skills/`; rodar `pnpm format:check` após criar.
- **Testes:** em sessão Devin de teste (cwd no CRMv2): pedir escrita em `.env` → negada; `git push --dry-run` → pede aprovação. Registrar.
- **Aceite:** arquivo existe, `pnpm format:check` verde, testes manuais registrados.
- **Riscos:** regras amplas demais travam o fluxo → preferir `ask`. **Recuperação:** reverter o commit.

### T2.2 — Regra explícita de commits (AUD-003)

- **Arquivos:** `AGENTS.md` (seção “Working agreement” ou “Do NOT”), `.devin/skills/build/SKILL.md`.
- **Alteração:** adicionar “Commits, pushes e PRs só sob pedido explícito do usuário. Skills que recomendam commit por slice (`incremental-implementation`, `git-workflow-and-versioning`) devem apenas preparar/descrever o commit.” Em `/build`, uma linha referenciando a regra. Não editar skills vendorizadas.
- **Preservar:** Conventional Commits.
- **Aceite:** `git diff` mostra só essas inserções; `pnpm format:check` verde.

### T2.3 — Gate de verificação único (AUD-002)

- **Decisão:** D10. Opção principal: scripts no `package.json` raiz:
  - `"verify": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test"`
  - `"verify:full": "pnpm verify && pnpm test:integration && pnpm test:e2e && pnpm build"`
- **Arquivos:** `package.json` (raiz); referenciar o gate em `AGENTS.md` (Working agreement + Definition of done → uma só frase), `CLAUDE.md` (remover ordem conflitante ou alinhar), `docs/development/workflow.md` (Gates + descrição do Stop), `.devin/skills/test/SKILL.md` (remover `pnpm format` mutante), `.devin/hooks/workflow.mjs` (mensagem do Stop e texto do SessionStart), `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/development/plan.template.md`.
- **Preservar:** recomendação de `pnpm --filter @crm/<pkg> test` ao iterar; mínimo por sessão × completo antes de commit; CI inalterado.
- **Testes:** `pnpm verify` `[CACHE]` uma vez (registrar resultado real); `git grep -n "pnpm format &&"` `[LEITURA]` não retorna instruções de verificação.
- **Aceite:** todas as fontes listadas no AUD-002 apontam para `verify`/`verify:full`; nenhuma instrução de verificação usa comando mutante.
- **Parada:** se `pnpm verify` falhar por motivo preexistente, **não corrigir** fora do escopo — registrar e reportar.

### T2.4 — Ajustes do hook de escopo (AUD-004)

- **Arquivos:** `.devin/hooks/workflow.mjs`, novo teste `.devin/hooks/workflow.test.mjs` **ou** extração das funções puras para um módulo testável (decidir com o humano onde o teste deve morar, pois `vitest.config.ts` só inclui `packages/**`, `apps/**`, `design-system/**` — incluir `.devin/hooks/**/*.test.*` exige alterar o config); `.gitignore` (remover `.devin/hooks/.edited-*`); `docs/development/workflow.md` (descrever limites: só `edit`/`write`, sem plan = só lembrete, Stop bloqueia uma vez).
- **Alterações:** (a) `toRel` com comparação case-insensitive no Windows; (b) retirar `.devin/**` de `alwaysAllowed` **somente se** T2.1 não for aprovada (caso contrário, permissões cobrem); manter `**/*.md` livre para docs, mas registrar que `AGENTS.md`/`SKILL.md` ficam sob `ask` (T2.1).
- **Testes:** casos de `globMatch`, `readScope` (com e sem Escopo), `toRel` com `C:\` × `c:\`.
- **Aceite:** testes passam no `pnpm test`; doc atualizada.
- **Risco:** hook quebrado bloqueia todas as edições → testar numa sessão Devin antes de concluir. **Recuperação:** reverter commit.

### T2.5 — Enxugar `AGENTS.md` e decidir `CLAUDE.md` (AUD-006)

- **Depende de:** T2.2, T2.3; decisão D6.
- **Arquivos:** `AGENTS.md`; novo `docs/development/how-tos.md` (conteúdo movido da seção “How-tos”); `CLAUDE.md`.
- **Preservar (checklist obrigatório no PR):** todas as linhas de “Security rules (non-negotiable)”, “Code rules”, “Database & migrations” (incluindo checklist de tabela tenant), “Design system” (regras de token), “Do NOT”, “Tooling (integrations)”, comandos e ponteiros. Os How-tos passam a ser referenciados por um ponteiro.
- **Aceite:** `AGENTS.md` ≤ ~6 KB; tabela de equivalência “regra → novo local” no PR; nenhuma regra obrigatória perdida.

### T2.6 — Documentação de governança e skills (AUD-007, AUD-008)

- **Arquivos:** `docs/development/workflow.md` (seção MCP: incluir `coolify`, remover afirmação sobre `github` ou marcá-la como “se configurado”; procedimento de atualização de skills: PR próprio, revisar diff de `.devin/skills/**`, fixar `ref`); `docs/development/deployment-coolify.md:141` (trocar instrução REST por “escalar ao usuário”); `.prettierignore` (substituir `.devin/skills/` pelas 25 pastas vendorizadas **ou** manter e justificar — decidir com o humano, pois listar 25 pastas também tem custo).
- **Não fazer:** atualizar/podar skills nesta tarefa (D8: recomendação principal é não podar agora; qualquer poda exige tarefa nova aprovada).
- **Aceite:** textos corrigidos; `pnpm format:check` verde.

### T2.7 — Isolamento de futuras sessões de auditoria (AUD-001) — fora do CRMv2

- **Escopo:** workspace `C:\Projetos\Auditoria-CRMv2` (não o CRMv2).
- **Alteração proposta:** `Auditoria-CRMv2\.devin\config.json` com `{"read_config_from": {"agents_standard": false, "claude": false}}`.
- **Verificação empírica:** abrir nova sessão nesse workspace, ler um arquivo de `..\CRMv2` e observar se `AGENTS.md`/`CLAUDE.md` do CRMv2 são injetados. Registrar o resultado. Se continuarem sendo carregados, desfazer e documentar a limitação no prompt-padrão de auditoria.
- **Aprovação:** o humano deve autorizar escrita nesse workspace (a sessão de auditoria original só podia criar os três documentos).

---

## 8. Fase 3 — Segurança e infraestrutura (P2)

### T3.1 — Segredos locais (AUD-018)

- **Passo humano (obrigatório, antes do agente):** migrar os valores de `.coolify-secrets.tmp` para o Coolify/cofre, decidir sobre rotação (D7) e excluir o arquivo. O agente **não lê nem exclui** esse arquivo.
- **Passo do agente:** adicionar `.coolify-secrets.tmp` e `*.log` ao `.dockerignore`; atualizar `docs/development/deployment-coolify.md:143-145` removendo a menção ao arquivo temporário.
- **Aceite:** `.dockerignore` contém as entradas; humano confirma exclusão; `Test-Path .coolify-secrets.tmp` `[LEITURA]` retorna `False`.

### T3.2 — Credencial owner fora do runtime (AUD-013)

- **Decisão:** D9. Opção principal: em `docker/web/entrypoint.sh`, após `node /migrate/migrate.mjs`, executar `unset DATABASE_ADMIN_URL` antes de `exec node server.js`.
- **Arquivos:** `docker/web/entrypoint.sh`; `docs/development/deployment-coolify.md` (explicar que a variável só é usada na migração).
- **Testes:** `pnpm build` não cobre; validação requer build da imagem (`docker build .` `[INFRA]`) e execução local com envs fictícias — só com autorização. Verificação estática mínima: `sh -n docker/web/entrypoint.sh` não está disponível no Windows sem shell POSIX; usar Git Bash se autorizado.
- **Aceite:** script revisado; em ambiente de teste, `node server.js` não tem `DATABASE_ADMIN_URL` (`/proc/1/environ`), migrações aplicadas.
- **Risco:** se algum código de runtime precisar da variável (não encontrado na auditoria — só `drizzle.config.ts`, `seed.ts`, `migrate.mjs`), parar.
- **Recuperação:** `git revert`; redeploy da imagem anterior via rollback do CD (humano).

### T3.3 — Alinhar a versão do Node (AUD-017)

- **Bloqueada** até D3 e, na opção principal, até o Node 26 ser LTS (conferir em https://nodejs.org/en/about/previous-releases).
- **Arquivos:** `.nvmrc`, `package.json` (`engines`), `.github/workflows/ci.yml` (2 ocorrências), `Dockerfile` (3 estágios), `docs/architecture/stack.md`.
- **Testes:** CI completo verde no PR `[EXTERNO]` (o humano abre/acompanha o PR, salvo autorização).
- **Aceite:** uma única versão maior em todos os arquivos; CI verde.

---

## 9. Fase 4 — Endurecimento (P3)

### T4.1 — FORCE RLS nas tabelas recentes (AUD-015)

- **Arquivos:** nova migração custom em `packages/db/migrations/` + atualização de `migrations/meta` gerada pela ferramenta; `AGENTS.md` (checklist: incluir FORCE) e `docs/database/README.md`.
- **Procedimento:** seguir o mesmo método usado para `0014_platform_settings_force_rls.sql` (migração custom). Confirmar a sintaxe exata com `pnpm --filter @crm/db exec drizzle-kit generate --help` `[LEITURA]` antes de gerar. Tabelas: as criadas em `0012`, `0013`, `0015`–`0018` que possuem política (levantar a lista exata lendo essas migrações).
- **Preservar:** nunca editar migração já aplicada.
- **Testes:** `pnpm infra:up`, `pnpm db:migrate`, `pnpm test:integration` `[INFRA]`; consulta `select relname from pg_class where relrowsecurity and not relforcerowsecurity and relnamespace = 'public'::regnamespace;` deve retornar vazio (executar só no banco local).
- **Aceite:** consulta vazia; testes verdes.

### T4.2 — IP confiável no rate limit do widget (AUD-014)

- **Pré-requisito:** humano informa quantos proxies existem na frente da aplicação (Coolify/Traefik, Cloudflare?).
- **Arquivo:** `apps/web/src/lib/widget-http.ts` (`clientIp`) + teste unitário.
- **Aceite:** XFF forjado não altera a chave de limite; teste passa.

### T4.3 — Endurecimentos menores (AUD-016)

Um commit por item:

- (a) `packages/auth/src/auth.ts:30-37` — remover `text` do log padrão.
- (b) `apps/web/src/app/api/widget/messages/route.ts` — validar `after` com `z.uuid().optional()`; responder 400.
- (c) `packages/channels/src/adapters/meta-cloud.ts:167-175` — comparação em tempo constante (reaproveitar helper existente em `packages/channels/src/shared/hmac.ts`, se adequado).
- (d) `packages/channels/src/adapters/waha.ts:350-358` — comparar `new URL(...).origin`.
- (e) `apps/web/src/app/accept-invitation/[id]/page.tsx` — não exibir o e-mail do convite a outro usuário.
- (f) `apps/web/next.config.ts` — `poweredByHeader: false`.
- **Testes:** unitários do pacote tocado; `pnpm typecheck`, `pnpm lint`.

### T4.4 — Workflows do GitHub Actions (AUD-019)

- **Arquivos:** `.github/workflows/ci.yml` (adicionar `permissions: contents: read` no topo); `.github/workflows/cd.yml` (job `rollback`: mover `inputs.rollback_ref` para `env:` e validar com regex antes de usar).
- **Decisão D5:** pin por SHA — só se aprovado.
- **Aceite:** CI do PR verde; `workflow_dispatch` de rollback testado pelo humano em momento oportuno (opcional).
- **Risco:** jobs que precisem de permissões adicionais falham → conceder por job.

### T4.5 — Compose local (AUD-023)

- **Decisão D4** (Redis).
- **Arquivo:** `docker/compose.yml` — prefixar portas com `127.0.0.1:`; remover Redis se D4 = remover (junto com `REDIS_URL` em `.env.example`, `packages/config/src/index.ts` e teste — avaliar impacto em `isConfigured`).
- **Testes:** `pnpm infra:up` `[INFRA]` + `pnpm test:integration` `[INFRA]`.

---

## 10. Fase 5 — Documentação e limpeza

### T5.1 — Documentação técnica (AUD-021)

- **Arquivos:** `docs/development/tooling.md` (thresholds conforme `tooling/eslint/base.js`), `docs/development/testing.md` (webServer CI × local), `docs/architecture/security.md`, `providers.md`, `multi-tenancy.md` (Trigger → pg-boss), `docs/development/design-system-lint.md` (`packages/ui` → `design-system/`), `docs/architecture/security.md` (papel `viewer`, após conferir em `packages/permissions`).
- **Aceite:** `git grep -n -i "trigger" docs/architecture` só retorna menções históricas explícitas; thresholds iguais ao `base.js`.

### T5.2 — Remoções condicionais (AUD-022)

| Item                                                                | Condição                                   | Operação                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `packages/ui/` (não rastreado)                                      | nenhuma                                    | excluir pasta local (`Remove-Item -Recurse` — **confirmação humana explícita**, pois é exclusão) |
| `graft/` (não rastreado)                                            | nenhuma                                    | excluir pasta; remover linha `graft` do `.dockerignore`                                          |
| log `C\uF03AUsers…ci-e2e-fail.log`                                  | humano confirma                            | excluir arquivo (usar `Get-ChildItem` para obter o nome exato)                                   |
| `apps/web/Dockerfile`                                               | humano confirma no Coolify que não é usado | `git rm apps/web/Dockerfile` `[GIT]`                                                             |
| entradas Trigger (`.gitignore`, `.prettierignore`, `.dockerignore`) | não existir `.trigger-selfhost/` local     | remover entradas                                                                                 |
| entrada `.devin/hooks/.edited-*` do `.gitignore`                    | —                                          | feito em T2.4                                                                                    |
| Redis                                                               | D4                                         | feito em T4.5                                                                                    |

- **Aceite:** `git status` mostra só as remoções previstas; build e testes inalterados.

### T5.3 — Testes e cobertura (AUD-020)

- Documentar em `docs/development/testing.md` que `turbo run test` é o caminho do CI e `pnpm test` o atalho local.
- Thresholds de cobertura: **bloqueado** até D12; antes, medir com `pnpm test:coverage` `[CACHE]` e registrar a linha de base.

### T5.4 — Continuidade (AUD-024) — opcional

- Mover seção “Concluído” de `TODO.md` para `docs/changelog.md` (ou equivalente aprovado); manter links.

---

## 11. Fase 6 — Verificação final e relatório

### T6.1

- `pnpm verify` (ou o gate equivalente aprovado) `[CACHE]`; se infra autorizada, `pnpm test:integration` e `pnpm test:e2e` `[INFRA]`.
- `git --no-optional-locks status --porcelain=v1 -b --untracked-files=all` e `git diff --stat main...HEAD` `[LEITURA]`.
- Comparar com o estado registrado em T0.1; listar qualquer diferença não planejada.
- Produzir relatório de mudanças: tarefas executadas, arquivos alterados, comandos e resultados reais, decisões, pendências, riscos residuais.

---

## 12. Plano de testes e validações (consolidado)

| Nível              | Quando                              | Comando                                                       |
| ------------------ | ----------------------------------- | ------------------------------------------------------------- |
| Unitário do pacote | Toda tarefa de código               | `pnpm --filter @crm/<pkg> test`                               |
| Tipos/lint         | Toda tarefa                         | `pnpm typecheck`, `pnpm lint`                                 |
| Formato            | Toda tarefa                         | `pnpm format:check`                                           |
| Integração         | T1.2, T4.1, T4.5                    | `pnpm infra:up` → `pnpm db:migrate` → `pnpm test:integration` |
| E2E                | Fim das fases 1 e 5 (se autorizado) | `pnpm test:e2e`                                               |
| Manual Devin       | T2.1, T2.4, T2.7                    | sessão de teste com registro das respostas                    |
| CI                 | Todo PR                             | GitHub Actions (acompanhado pelo humano)                      |

## 13. Riscos e pontos de parada gerais

Parar e pedir decisão humana quando:

- houver alterações preexistentes não commitadas ou HEAD diferente do esperado nos arquivos-alvo;
- uma tarefa exigir arquivo fora da lista “Arquivos” dela;
- um teste preexistente falhar antes da mudança;
- uma migração não for puramente aditiva;
- for necessário acessar produção, Coolify, GitHub (além de leitura autorizada) ou segredos;
- uma decisão `Dn` não estiver registrada;
- o hook de escopo bloquear algo inesperadamente (não contornar via shell).

## 14. Procedimentos de recuperação

- Código/doc: `git revert <commit>` `[GIT]` (preferível a reset).
- Branch inteiro: abandonar o branch (não excluir sem autorização).
- Banco local: `pnpm infra:down` + recriar volume **só com autorização** (destrutivo para dados locais).
- Produção: rollback via `workflow_dispatch` do CD — **apenas o humano**.

## 15. Pendências que bloqueiam tarefas

| Pendência              | Bloqueia                                |
| ---------------------- | --------------------------------------- |
| D1                     | T1.2                                    |
| D2                     | T1.1                                    |
| D3 + data de LTS       | T3.3                                    |
| D4                     | T4.5, parte de T5.2                     |
| D5                     | parte de T4.4                           |
| D6                     | T2.5                                    |
| D7 + ação humana       | T3.1                                    |
| D9                     | T3.2                                    |
| D10                    | T2.3 (e, por consequência, T2.5 e T5.1) |
| D11                    | T2.1                                    |
| D12                    | parte de T5.3                           |
| Informação de proxy    | T4.2                                    |
| Confirmação no Coolify | remoção de `apps/web/Dockerfile`        |

## 16. Etapas que dependem de aprovação humana

Todas. Além da aprovação geral do plano, exigem confirmação pontual: qualquer exclusão de arquivo, migração de banco, mudança em `.devin/**`/`AGENTS.md`/`.github/**`, uso de `[INFRA]`, qualquer `[EXTERNO]`, commits e pushes.

## 17. Checklist final de conclusão

- [ ] Autorização registrada (versão do plano + tarefas).
- [ ] Estado inicial registrado (T0.1).
- [ ] Cada tarefa executada tem diff, testes e aceite registrados.
- [ ] Tarefas bloqueadas/omitidas listadas com motivo.
- [ ] Nenhum arquivo fora das listas foi alterado.
- [ ] Nenhuma alteração preexistente do usuário foi perdida.
- [ ] Gate final executado com resultados reais.
- [ ] Relatório final entregue (arquivos, comandos, resultados, decisões, riscos residuais).
