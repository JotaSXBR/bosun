# Relatório de Auditoria — Ambiente de desenvolvimento assistido por IA e projeto CRMv2 (Bosun)

- **Data da auditoria:** 2026-10-13
- **Workspace da auditoria:** `C:\Projetos\Auditoria-CRMv2`
- **Projeto auditado:** `C:\Projetos\CRMv2` (resolvido a partir de `..\CRMv2`)
- **Commit auditado:** `8c8aae6` (branch `main`, sincronizado com `origin/main`, 142 commits)
- **Natureza:** somente leitura (inspeção estática, documentação oficial). Nenhuma correção foi implementada.
- **Documentos associados:** `PLANO_DE_EXECUCAO.md` (plano por fases) e `PROMPT_EXECUCAO_APOS_APROVACAO.md` (prompt operacional para sessão futura).

Convenções: caminhos sem prefixo são relativos à raiz de `CRMv2`. Os identificadores `AUD-NNN` são estáveis e usados nos três documentos. Estados de evidência: **Confirmado**, **Provável**, **Não verificado**. Gravidade: **P0** crítico, **P1** alto, **P2** médio, **P3** baixo.

---

## 1. Resumo executivo

O CRMv2 (produto "Bosun", SaaS CRM multi-tenant) é um monorepo pnpm/Turborepo maduro e disciplinado. A postura de segurança documentada (isolamento por tenant na aplicação + RLS no Postgres, webhooks verificados sobre o corpo bruto, serviços com checagem de permissão, envelope `{ ok }` nas Server Actions, Zod em todas as fronteiras) **está de fato implementada**, não apenas descrita. CI cobre format, lint, typecheck, testes unitários, integração (Postgres + RustFS reais), e2e (Playwright) e varredura Trivy. Não foi encontrado nenhum problema P0.

Os problemas mais importantes estão concentrados em duas frentes:

**Segurança do produto (P1)**

1. **AUD-010 — Histórico do chat do site recuperável só com o e-mail do visitante.** Qualquer pessoa que conheça o token público do widget (presente no HTML do site do cliente) e o e-mail de um visitante obtém uma sessão nova vinculada ao mesmo contato e lê todo o histórico (mensagens do visitante e dos atendentes).
2. **AUD-011 — XSS armazenado via mídia.** Uploads de mídia aceitam qualquer MIME declarado pelo cliente (até 64 MB) e `/api/media/[id]` devolve o conteúdo `inline`, na mesma origem, com o `Content-Type` armazenado; rotas `/api` ficam fora do CSP. Mídia recebida de provedores (WhatsApp) segue o mesmo caminho. Comportamento do código confirmado; exploração ponta a ponta não testada.

**Governança do desenvolvimento assistido por IA (P2)**

3. **AUD-002 — Dez fontes divergentes para o “gate de verificação”**, incluindo uma (`/test`, `docs/development/workflow.md`) que manda rodar `pnpm format` (mutante) como parte da verificação.
4. **AUD-003 — Política de commits contraditória**: skills vendorizadas mandam “commitar cada slice”; `/ship` e `workflow.md` dizem “só com pedido explícito”; o `AGENTS.md` (única regra sempre carregada) não diz nada.
5. **AUD-004 / AUD-005 — Controles “técnicos” mais fracos do que parecem**: o hook de escopo só intercepta `edit`/`write` (comandos de shell passam), libera sempre `.devin/**` e `**/*.md` (o agente pode reescrever as próprias regras e o hook) e não há nenhuma regra de permissões do Devin (`.devin/config.json` inexistente).
6. **AUD-001 — O isolamento por pasta irmã não funciona no Devin**: ao ler arquivos de `..\CRMv2`, o Devin carregou `CRMv2/AGENTS.md`, `CRMv2/CLAUDE.md` (como regras _always-on_) e 34 skills de `CRMv2/.devin/skills` nesta sessão de auditoria. O comportamento é documentado (descoberta preguiçosa). Nesta sessão essas regras foram tratadas apenas como objeto de auditoria e não interferiram (nenhum comando `pnpm` foi executado, nenhum arquivo foi alterado).

**Outros riscos relevantes (P2):** sessões do widget sem expiração (AUD-012); credencial _owner_ do banco no ambiente de execução da aplicação (AUD-013); runtime Node 26 (_Current_) em CI/produção contra Node 24 LTS documentado como fonte de verdade (AUD-017); arquivo de segredos em texto puro persistente na raiz do projeto (AUD-018).

**Prioridades recomendadas:** (1) corrigir AUD-010 e AUD-011 após decisão de produto; (2) salvaguardas do fluxo de IA (AUD-005, AUD-003, AUD-002, AUD-004); (3) demais P2 de segurança/infra (AUD-012, AUD-013, AUD-018, AUD-017); (4) lote P3 de endurecimento, documentação e limpeza.

---

## 2. Objetivos e escopo

Objetivo: auditar, sem modificar nada, (a) os mecanismos que orientam e controlam o desenvolvimento assistido por IA (regras, skills, hooks, MCPs, permissões, documentação de processo) e (b) a arquitetura, o código, os testes, a automação e a segurança do CRMv2; e produzir um plano executável por outra IA após aprovação humana.

Dentro do escopo: tudo o que está em `C:\Projetos\CRMv2` (rastreado e não rastreado, exceto conteúdo de arquivos de segredos), configuração de usuário do Devin e de ferramentas de IA que afetam sessões neste projeto, e documentação oficial pertinente.

Fora do escopo: execução de builds/testes/lint, acesso a GitHub Actions, Coolify, banco de dados ou qualquer serviço externo; leitura do conteúdo de `.env`, `.coolify-secrets.tmp`, `.devin/mcp_config.local.json` (apenas nomes de chaves) e `docs/development/deployment.local.md`.

---

## 3. Metodologia

| Etapa                | O que foi feito                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Inventário       | `pwd`, listagens, `git --no-optional-locks status/log/ls-files` (sem atualizar o índice), contagem de arquivos rastreados por área, versões via leitura dos `package.json`.                                                                                                                                                                                                                 |
| B — Instruções       | Leitura de `AGENTS.md`, `CLAUDE.md`, `.devin/hooks.v1.json`, `.devin/hooks/workflow.mjs`, `.devin/mcp_config.json`, 34 `SKILL.md`, `skills-lock.json`, `docs/development/workflow.md`, `plan.template.md`, `CONTRIBUTING.md`, template de PR; configuração de usuário (`%APPDATA%\devin`, `~/.claude*`, `~/.agents`, `~/.copilot`, `~/.cursor`, Windsurf), com valores sensíveis redigidos. |
| C — Código           | Análise estática de `apps/web` e `packages/*` (isolamento, auth, webhooks, actions, jobs, storage, cripto, IA, CSP, dependências internas, migrações RLS).                                                                                                                                                                                                                                  |
| D — Qualidade        | `ci.yml`, `cd.yml`, `dependabot.yml`, `Dockerfile`, `docker/*`, `lefthook.yml`, `turbo.json`, configs de Vitest/Playwright/ESLint/Prettier, docs de tooling/testes.                                                                                                                                                                                                                         |
| E — Pesquisa externa | Documentação oficial do Devin (online e a cópia empacotada com o Devin Desktop), PostgreSQL, Node.js, pnpm, GitHub Actions, Next.js, repositórios oficiais `vercel-labs/skills` e `addyosmani/agent-skills`.                                                                                                                                                                                |
| F–H — Consolidação   | Cruzamento das frentes, eliminação de duplicatas, priorização, plano e prompt.                                                                                                                                                                                                                                                                                                              |

**Uso do Fusion (o que realmente ocorreu):** uma análise de código/segurança somente leitura foi delegada a **um** subagente que rodou em paralelo enquanto a governança, CI e pesquisa eram feitas na sessão principal. Os achados mais graves do subagente (AUD-010, AUD-011, AUD-012, AUD-014, AUD-015, AUD-016 item a, e o `apps/web/Dockerfile` de AUD-022) foram **reverificados diretamente no código** antes de entrar neste relatório. Uma afirmação foi corrigida: o upload de avatar **tem** allowlist de MIME (`image/png|jpeg|webp`, `apps/web/src/app/api/avatar/route.ts:13`) e, portanto, não integra AUD-011. Não houve validação cruzada por múltiplos modelos além disso.

---

## 4. Diretórios e ambiente identificados

| Item               | Resultado                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diretório atual    | `C:\Projetos\Auditoria-CRMv2` (vazio no início) — confirmado como workspace, distinto de `CRMv2` e do diretório-base `C:\Projetos`.                                                                           |
| Projeto            | `C:\Projetos\CRMv2` existe; `package.json` `name: "bosun"`; `AGENTS.md` descreve “Bosun — multi-tenant customer operations platform (SaaS CRM)”; remoto `github.com/JotaSXBR/bosun`. Corresponde ao contexto. |
| Diretório-base     | Contém outras pastas (`CRM`, `AgentsRoomCRM`, `BOSUNTEST`, `MarIA CRM` etc.). Não foram inspecionadas. `docker/compose.yml` cita `C:\Projetos\CRM` como projeto irmão com compose `crm`.                      |
| Nomes reservados   | Nenhum dos três arquivos de entrega existia antes da criação.                                                                                                                                                 |
| Plataforma         | Windows; Node `v24.21.0` local; Git `2.55.0.windows.5`. pnpm não foi invocado (via corepack poderia baixar binários).                                                                                         |
| Estado Git inicial | Árvore limpa (`## main...origin/main`, nenhuma entrada modificada/não rastreada fora de ignorados), sem stash, um branch local.                                                                               |

### 4.1 Instruções efetivamente aplicáveis a esta sessão

| Fonte                                                                    | Carregada?                                     | Evidência                                                                                                                                                                                                    |
| ------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Regras globais Windsurf (`~/.codeium/windsurf/memories/global_rules.md`) | Sim                                            | Arquivo vazio (0 bytes).                                                                                                                                                                                     |
| `%APPDATA%\devin\AGENTS.md`, `~/.claude/CLAUDE.md`                       | Não existem                                    | —                                                                                                                                                                                                            |
| Regras do workspace `Auditoria-CRMv2`                                    | Não existem                                    | Pasta vazia.                                                                                                                                                                                                 |
| `CRMv2/AGENTS.md` e `CRMv2/CLAUDE.md`                                    | **Sim, após a primeira leitura de `..\CRMv2`** | Injetados como `<rules type="always-on">` logo depois do primeiro `ls`. Ver AUD-001.                                                                                                                         |
| Skills `CRMv2/.devin/skills/*` (34)                                      | **Sim, idem**                                  | Listadas como skills disponíveis.                                                                                                                                                                            |
| Hooks `CRMv2/.devin/hooks.v1.json`                                       | Provavelmente não                              | A documentação diz que hooks são descobertos no diretório de trabalho e ancestrais (CRMv2 não é ancestral). Nenhum contexto do `SessionStart` foi injetado. Não foi possível rodar `/hooks` nesta interface. |
| MCPs do projeto (`chrome-devtools`, `coolify`)                           | Não                                            | A sessão lista apenas `context7` (MCP de usuário).                                                                                                                                                           |
| Skills de usuário                                                        | Sim                                            | `~/.agents/skills` (4), `~/.copilot/skills/officecli`, `~/.cursor/skills/officecli` (duplicada).                                                                                                             |

As regras do CRMv2 foram lidas apenas como objeto de auditoria. Nenhum procedimento delas foi seguido (por exemplo, `pnpm typecheck`/`lint` não foram executados; `tasks/plan.md` não foi criado). Não é possível comprovar o isolamento interno do Devin além do que foi observado.

---

## 5. Tecnologias e ferramentas encontradas

| Camada                         | Versões (lidas dos manifestos)                                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                        | Node `>=24` (`package.json`), `.nvmrc` = 24; CI e `Dockerfile` usam Node **26**                                                                                                             |
| Gerenciador/orquestração       | pnpm `12.8.1` (`packageManager`), Turborepo `2.11.7`                                                                                                                                        |
| Linguagem/qualidade            | TypeScript `6.0.3`, ESLint `9.39.2`, typescript-eslint `8.71.0`, eslint-config-next `16.3.8`, Prettier `3.9.9`, lefthook `^2.1.16`                                                          |
| App                            | Next.js `16.3.8` (App Router, `output: "standalone"`, `proxy.ts`), React `19.3.0`, next-intl `4.14.9`, Tailwind `4.3.3`, Zod `4.6.5`                                                        |
| Dados                          | PostgreSQL 18 + pgvector `0.8.7`, drizzle-orm `0.45.3`, drizzle-kit `0.31.11`, postgres.js `3.4.9`                                                                                          |
| Auth                           | better-auth `1.7.7` (plugins organization + admin)                                                                                                                                          |
| Jobs                           | pg-boss `12.35.0` (in-process, ADR 0016)                                                                                                                                                    |
| IA                             | `ai` `7.0.127`, `@ai-sdk/openai` `4.0.83`, `@ai-sdk/anthropic` `4.0.71`                                                                                                                     |
| Storage/e-mail/observabilidade | AWS SDK S3 `3.1146.0` (RustFS local), nodemailer `10.0.13`, `@sentry/nextjs` `11.4.0`                                                                                                       |
| Testes                         | Vitest `5.0.3`, Playwright `1.63.0`                                                                                                                                                         |
| CI/CD                          | GitHub Actions → GHCR → Coolify (webhook), Trivy `0.65.0` (imagem), Dependabot mensal                                                                                                       |
| Ferramentas de IA              | Devin Desktop/CLI (regras, skills, hooks, MCP); pacote `addyosmani/agent-skills` (25 skills vendorizadas via CLI `skills` da Vercel Labs, `skills-lock.json`); `CLAUDE.md` para Claude Code |

---

## 6. Limitações da inspeção

- Nenhum build, teste, lint ou typecheck foi executado; não se afirma que passam. Os números de violações e cobertura citados nos docs do projeto não foram reconferidos.
- Não houve acesso ao GitHub (configurações de branch protection, ambientes, secrets, permissões padrão do `GITHUB_TOKEN`), ao Coolify, ao banco ou a ambientes de produção/staging.
- Conteúdo de arquivos de segredos não foi lido.
- Achados de segurança são de análise estática; nenhuma exploração foi tentada.
- O carregamento de regras/hooks do Devin foi inferido de evidência da sessão e da documentação; o comportamento interno não é observável por completo.
- Pastas grandes de terceiros (`node_modules`, `research/`) não foram auditadas.
- A verificação final de “nada foi alterado” baseia-se em `git status` (incluindo ignorados) e listagens de diretório; não há hash completo da árvore anterior à sessão. Leituras não alteram arquivos, mas tempos de acesso (atime) podem mudar dependendo do sistema de arquivos.

---

## 7. Inventário resumido

| Área                 | Conteúdo relevante                                                                                                                                                                                                                                                             | Observações                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Raiz                 | `AGENTS.md` (12,7 KB), `CLAUDE.md`, `DESIGN.md` (32,8 KB), `TODO.md` (40 KB), `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `Dockerfile`, `lefthook.yml`, `turbo.json`, `pnpm-workspace.yaml`, `skills-lock.json`, configs Vitest                                             | 915 arquivos rastreados no total                      |
| `apps/web`           | 198 arquivos rastreados — Next.js, Server Actions, rotas API, e2e Playwright                                                                                                                                                                                                   | Contém `apps/web/Dockerfile` não usado (AUD-022)      |
| `packages/*`         | 12 pacotes rastreados (`core` 130 arquivos, `db` 80)                                                                                                                                                                                                                           | `packages/ui/` existe só com `node_modules` (AUD-022) |
| `design-system/`     | 208 arquivos — pacote `@crm/design-system`, referências HTML                                                                                                                                                                                                                   |                                                       |
| `tooling/`           | eslint, prettier, typescript compartilhados                                                                                                                                                                                                                                    |                                                       |
| `docs/`              | 17 ADRs, arquitetura (7), desenvolvimento (13 + 1 local ignorado), produto (11), auditoria de performance                                                                                                                                                                      | Diversas divergências (AUD-021)                       |
| `tasks/`             | 42 arquivos `*.done.md` rastreados; `tasks/briefs/` com 25 briefs legados **ignorados pelo Git**                                                                                                                                                                               | Sem `tasks/plan.md` ativo                             |
| `.devin/`            | `hooks.v1.json`, `hooks/workflow.mjs`, `mcp_config.json`, `mcp_config.local.json` (ignorado), 34 skills                                                                                                                                                                        | Sem `config.json`                                     |
| `.github/`           | `ci.yml`, `cd.yml`, `dependabot.yml`, templates de issue/PR                                                                                                                                                                                                                    |                                                       |
| `docker/`            | `compose.yml` (Postgres, Redis, RustFS), init do papel `crm_app`, migrador/entrypoint da imagem                                                                                                                                                                                |                                                       |
| Ignorados relevantes | `.env`, `.coolify-secrets.tmp`, `docs/development/deployment.local.md`, `research/{agent-skills,vibe-coding-toolkit}`, `coverage/`, `.turbo/`, `apps/web/.next`, `apps/web/test-results`, arquivo `C\uF03AUsersbkpdiAppDataLocalTempci-e2e-fail.log` (1,7 MB, nome corrompido) | Nenhum ignorado foi alterado                          |
| `graft/`             | apenas `.cache` vazio                                                                                                                                                                                                                                                          | Citado só em `.dockerignore`                          |

---

## 8. Mapa dos mecanismos de instrução

```
Sessão Devin
├── Regras de usuário: Windsurf global_rules.md (vazio) · %APPDATA%\devin\AGENTS.md (inexistente)
├── MCP de usuário: %APPDATA%\devin\mcp_config.json → context7 (pinado 1.0.31)
├── Skills de usuário: ~/.agents/skills (4) · ~/.copilot/skills/officecli · ~/.cursor/skills/officecli (duplicada)
└── Projeto CRMv2 (quando o cwd está dentro dele, ou por descoberta preguiçosa ao ler arquivos)
    ├── Regras always-on: AGENTS.md (fonte declarada de regras) + CLAUDE.md (“@AGENTS.md” + 3 notas)
    ├── Skills (.devin/skills, 34)
    │   ├── 8 aliases locais do ciclo: spec · plan-task · build · test · review · ship · code-simplify · webperf
    │   ├── 1 skill local: context7-docs (sobrepõe deliberadamente a skill de usuário context7-mcp)
    │   └── 25 skills vendorizadas de addyosmani/agent-skills (skills-lock.json, ~340 KB)
    ├── Hooks (.devin/hooks.v1.json → .devin/hooks/workflow.mjs)
    │   ├── SessionStart: injeta resumo do workflow
    │   ├── UserPromptSubmit: lembra o plan ativo
    │   ├── PreToolUse(edit|write|notebook_edit): bloqueia fora do “## Escopo” de tasks/plan.md
    │   ├── PostToolUse: marca sessão editada (arquivo em %TEMP%)
    │   ├── Stop: bloqueia a 1ª parada se houve edição (pede gate)
    │   └── SessionEnd: limpa marcador
    ├── MCP do projeto: chrome-devtools (pinado 1.10.1) · coolify (URL placeholder; real em mcp_config.local.json)
    ├── Permissões Devin: nenhuma (.devin/config.json ausente)
    └── Documentos de processo: docs/development/workflow.md · plan.template.md · CONTRIBUTING.md · PR template · TODO.md · tasks/*.done.md
Controles fora do agente: lefthook (prettier em staged) · CI (format/lint/typecheck/test/build, integração, e2e, Trivy) · CD (tag v* = aprovação de produção)
```

**Instalado × configurado × ativo × aplicado**

| Mecanismo           | Instalado  | Configurado | Ativo quando                                                                    | Controle técnico?                  |
| ------------------- | ---------- | ----------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| AGENTS.md/CLAUDE.md | —          | Sim         | Sempre que o Devin trabalha no projeto (inclusive por descoberta preguiçosa)    | Não (texto)                        |
| Skills do ciclo     | Sim        | Sim         | Sob invocação (`/build` etc.) ou decisão do modelo                              | Não                                |
| Hook de escopo      | Sim        | Sim         | Só com `cwd` dentro do CRMv2 **e** `tasks/plan.md` existente; só `edit`/`write` | Parcial (AUD-004)                  |
| Hook Stop           | Sim        | Sim         | Sessões com edição; bloqueia uma vez                                            | Lembrete forçado, não gate         |
| Permissões Devin    | Disponível | **Não**     | —                                                                               | Não configurado (AUD-005)          |
| MCP coolify         | Sim        | Sim (local) | Sessões no CRMv2                                                                | Depende de aprovação manual padrão |
| lefthook            | Sim        | Sim         | `git commit` local                                                              | Sim (formatação)                   |
| CI                  | Sim        | Sim         | push/PR (ignora `docs/**`, `tasks/**`, `**.md`, `.devin/**`)                    | Sim                                |

---

## 9. Precedência e conflitos

Precedência observada/documentada: para **permissões**, organização > sessão > `.devin/config.local.json` > `.devin/config.json` > usuário (doc empacotada `reference/permissions.mdx`). Para **regras**, todas as fontes _always-on_ são carregadas simultaneamente; a documentação não define precedência entre elas — conflitos ficam a critério do modelo. Skills não têm precedência formal sobre regras; aliases locais tentam “adaptar” skills vendorizadas, mas o modelo pode invocar a skill vendorizada diretamente (todas aparecem na lista com descrições como “Use when making any code change”).

Conflitos e divergências confirmados:

| Tema                      | Fontes em conflito                                                                                                                                                                | Achado          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Gate de verificação / DoD | `AGENTS.md` (Working agreement × Definition of done), `CLAUDE.md`, `workflow.md`, `/test`, mensagem do hook Stop, `CONTRIBUTING.md`, template de PR, `plan.template.md`, `ci.yml` | AUD-002         |
| Commits                   | `incremental-implementation/SKILL.md:41`, `git-workflow-and-versioning/SKILL.md:317` × `ship/SKILL.md`, `workflow.md` “O que NÃO muda”; ausente no `AGENTS.md`                    | AUD-003         |
| Coolify                   | `AGENTS.md` (“only via the coolify MCP — never raw REST/curl”) × `docs/development/deployment-coolify.md:141` (instrui `PATCH /applications/{uuid}`)                              | AUD-007         |
| Thresholds de lint        | `docs/development/tooling.md:48-50,66-72` × `tooling/eslint/base.js:171-182` e `code-quality-standard.md`                                                                         | AUD-021         |
| Versão do Node            | `docs/architecture/stack.md` (“fonte de verdade”: 24 LTS, migrar após 2026-10-28) × `ci.yml`/`Dockerfile` (26)                                                                    | AUD-017         |
| Ordem typecheck/lint      | `CLAUDE.md` (typecheck antes) × DoD do `AGENTS.md` (lint antes)                                                                                                                   | AUD-002 (menor) |

---

## 10. Achados classificados por prioridade

Índice:

| ID      | Título                                                 | Categoria                          | Gravidade | Estado                    |
| ------- | ------------------------------------------------------ | ---------------------------------- | --------- | ------------------------- |
| AUD-010 | Histórico do widget recuperável só com e-mail          | Segurança/privacidade              | P1        | Confirmado (estático)     |
| AUD-011 | XSS armazenado via mídia servida inline                | Segurança                          | P1        | Provável                  |
| AUD-001 | Regras/skills do CRMv2 carregadas em outro workspace   | Governança IA                      | P2        | Confirmado                |
| AUD-002 | Gate de verificação com 10 fontes divergentes          | Governança IA                      | P2        | Confirmado                |
| AUD-003 | Política de commits contraditória                      | Governança IA                      | P2        | Confirmado                |
| AUD-004 | Hook de escopo com lacunas de cobertura e integridade  | Governança IA                      | P2        | Confirmado                |
| AUD-005 | Nenhuma regra de permissão do Devin                    | Governança IA/segurança            | P2        | Confirmado                |
| AUD-012 | Sessões do widget sem expiração                        | Segurança                          | P2        | Confirmado                |
| AUD-013 | Credencial owner do banco no runtime da app            | Segurança/infra                    | P2        | Provável                  |
| AUD-017 | Node 26 (Current) em CI/produção × 24 LTS documentado  | Dependências                       | P2        | Confirmado                |
| AUD-018 | Segredos em texto puro na raiz do projeto              | Segurança operacional              | P2        | Confirmado                |
| AUD-006 | AGENTS.md extenso; papel do CLAUDE.md                  | Governança IA                      | P3        | Confirmado/Provável       |
| AUD-007 | Docs de governança desatualizados/contraditórios       | Governança IA                      | P3        | Confirmado                |
| AUD-008 | Cadeia de suprimento das skills vendorizadas           | Governança IA                      | P3        | Confirmado                |
| AUD-009 | Duplicações no ambiente de usuário                     | Ambiente                           | P3        | Confirmado/Não verificado |
| AUD-014 | Rate limit do widget confia em X-Forwarded-For         | Segurança                          | P3        | Confirmado                |
| AUD-015 | FORCE RLS ausente em tabelas recentes                  | Segurança (defesa em profundidade) | P3        | Confirmado                |
| AUD-016 | Lote de endurecimentos menores                         | Segurança                          | P3        | Confirmado/Provável       |
| AUD-019 | Endurecimento dos workflows do GitHub Actions          | CI/CD                              | P3        | Confirmado                |
| AUD-020 | Lacunas de testes e duplicação de scripts              | Qualidade                          | P3        | Confirmado                |
| AUD-021 | Documentação técnica divergente da implementação       | Documentação                       | P3        | Confirmado                |
| AUD-022 | Arquivos e restos sem uso                              | Limpeza                            | P3        | Confirmado                |
| AUD-023 | Compose local expõe serviços em todas as interfaces    | Infra local                        | P3        | Confirmado                |
| AUD-024 | Continuidade entre sessões dispersa e TODO.md volumoso | Processo                           | P3        | Confirmado (oportunidade) |

### P1

#### AUD-010 — Histórico do chat do site recuperável apenas com o e-mail do visitante

- **Categoria:** segurança / privacidade (divulgação de dados de clientes finais).
- **Localização:** `packages/core/src/modules/messaging/sitechat.ts:69-102` (`createWidgetSession`), `:161-193` (`getWidgetConversation`); `apps/web/src/app/api/widget/messages/route.ts`.
- **Evidência:** a sessão é criada a partir do token público de embed + e-mail do pré-formulário; o contato é “upsertado” por `channelUserId: email` e o comentário afirma “same email anywhere resumes the same thread”. `getWidgetConversation` busca a última conversa por `(connection.id, contact.channelUserId)` e retorna todas as mensagens visíveis (entrada e saída), sem relação com a sessão que as originou.
- **Problema:** não há prova de posse do e-mail; o token de embed é público por natureza.
- **Impacto:** qualquer pessoa que saiba o e-mail de um visitante de um site cliente lê a conversa completa daquele visitante com a empresa (dados pessoais, possivelmente sensíveis; LGPD).
- **Gravidade:** P1 — exposição remota, sem autenticação, de dados de terceiros; exige apenas conhecer um e-mail.
- **Recomendação:** decisão de produto (D1). Opção principal: retomar histórico apenas com o token de sessão já emitido para aquele navegador; um novo pré-formulário com o mesmo e-mail cria sessão que vê só mensagens a partir da sua criação (ou nova conversa). Alternativa: verificação do e-mail (link/código) antes de exibir histórico anterior — maior custo de UX e infraestrutura de e-mail.
- **Dependências/riscos:** muda a experiência de “continuar de outro dispositivo”; testes de integração do widget precisam ser ajustados.
- **Esforço:** médio.
- **Critério de resolvido:** teste de integração demonstra que uma sessão criada com o e-mail de outro visitante **não** recebe mensagens anteriores à sua criação (ou de outra sessão); comportamento documentado em `docs/product`.

#### AUD-011 — XSS armazenado via mídia servida inline com Content-Type controlado externamente

- **Categoria:** segurança.
- **Localização:** `apps/web/src/server/actions/chat.ts:67-79` (`mime = file.type`), `apps/web/src/lib/media-upload.ts:6,27-37` (só tamanho/vazio validados), `apps/web/src/app/api/media/[id]/route.ts:18-34` (`content-type` armazenado + `content-disposition: inline`), `packages/core/src/modules/messaging/message-views.ts:148,159` (contentType do objeto ou do provedor), `apps/web/src/proxy.ts` matcher (exclui `/api` do CSP).
- **Evidência:** qualquer MIME é aceito no upload (até 64 MB) e reproduzido na resposta, na mesma origem da aplicação; para mídia recebida, o tipo vem do provedor (`provider.fetchMedia`). `X-Content-Type-Options: nosniff` não impede um `text/html` declarado.
- **Problema:** um membro malicioso da organização, ou um remetente externo de WhatsApp (se o provedor repassar `text/html`/`image/svg+xml`), pode fazer o navegador de um atendente renderizar HTML/JS na origem da aplicação.
- **Impacto:** execução de ações em nome do atendente dentro do tenant (Server Actions, leitura de dados).
- **Gravidade:** P1 — vetor externo plausível (mídia recebida) e impacto alto; estado **Provável** porque a exploração não foi testada e depende do Content-Type repassado por cada provedor.
- **Recomendação (D2):** em `mediaResponse`, servir inline apenas uma allowlist (imagens raster, áudio, vídeo, PDF se desejado) e forçar `content-disposition: attachment` + `application/octet-stream` para o restante; adicionar `Content-Security-Policy: sandbox; default-src 'none'` nas respostas de mídia; opcionalmente validar MIME no upload.
- **Dependências/riscos:** pré-visualização de alguns documentos passa a baixar arquivo; verificar UI de chat.
- **Esforço:** baixo.
- **Critério de resolvido:** teste unitário/integração mostra que `text/html` e `image/svg+xml` são servidos como anexo/octet-stream com CSP `sandbox`; tipos permitidos continuam inline.

### P2

#### AUD-001 — Regras e skills do CRMv2 carregadas em sessões de outro workspace

- **Categoria:** governança IA / ambiente.
- **Localização:** comportamento do Devin; afeta `AGENTS.md`, `CLAUDE.md`, `.devin/skills/*`.
- **Evidência:** nesta sessão (workspace `Auditoria-CRMv2`), após o primeiro `ls` em `..\CRMv2`, os dois arquivos passaram a ser injetados como regras _always-on_ e 34 skills ficaram disponíveis. Documentação oficial: “Files in subdirectories are discovered lazily when the agent accesses files in that directory” (Rules & AGENTS.md); changelog empacotado: “Nested AGENTS.md files … are now discovered and remain scoped to the directory where they apply”.
- **Problema:** a premissa de isolamento por pasta irmã não se sustenta; qualquer sessão que leia o projeto recebe suas regras (que incluem ordens operacionais como “run `pnpm typecheck` and `pnpm lint`”, “Delegate mechanical work”, “Coolify only via MCP”).
- **Impacto:** em auditorias futuras ou em sessões de outros projetos que consultem o CRMv2, o agente pode seguir procedimentos do projeto fora de contexto. Nesta sessão não houve interferência.
- **Recomendação:** para sessões de auditoria, criar no workspace de auditoria um `.devin/config.json` com `read_config_from` desativando `agents_standard` e `claude`, e **verificar empiricamente** se isso bloqueia a descoberta preguiçosa (não documentado); se não bloquear, manter a instrução explícita no prompt de auditoria (como foi feito) e registrar a limitação. Não alterar o CRMv2 por causa disso.
- **Esforço:** baixo. **Critério:** sessão de teste no workspace de auditoria lê um arquivo do CRMv2 e as regras do CRMv2 não aparecem; ou a limitação fica documentada no prompt-padrão de auditoria.

#### AUD-002 — Gate de verificação/DoD com dez fontes divergentes

- **Categoria:** governança IA / qualidade.
- **Evidência:**

| Fonte                                                 | Comando(s)                                                                                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` → Working agreement                       | `pnpm typecheck` + `pnpm lint` + testes relevantes                                                                               |
| `AGENTS.md` → Definition of done                      | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` + integração                                                     |
| `CLAUDE.md`                                           | typecheck antes de lint; `pnpm --filter` ao iterar                                                                               |
| `docs/development/workflow.md` → Gates                | mínimo typecheck+lint+testes; completo **`pnpm format`** `&& lint && typecheck && test && test:integration && test:e2e && build` |
| `.devin/skills/test/SKILL.md` item 2                  | idem, com **`pnpm format`**                                                                                                      |
| `.devin/hooks/workflow.mjs:93` (Stop)                 | `pnpm format:check && pnpm typecheck && pnpm lint` + testes                                                                      |
| `workflow.md` (descrição do Stop)                     | `pnpm typecheck && pnpm lint` (difere do próprio hook)                                                                           |
| `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md` | `format:check && typecheck && lint && test`                                                                                      |
| `docs/development/plan.template.md`                   | typecheck + lint                                                                                                                 |
| `.github/workflows/ci.yml`                            | `format:check`; `turbo run lint typecheck test build`; integração; e2e; Trivy                                                    |

- **Problema:** não há fonte única; uma das variantes é mutante (`pnpm format` reescreve arquivos durante “verificação”, o que pode mascarar falhas e gerar diffs fora do escopo).
- **Impacto:** comportamento imprevisível do agente; relatórios de verificação incomparáveis.
- **Recomendação:** definir **uma** fonte de verdade (D10). Opção principal: scripts no `package.json` raiz — `verify` (= `format:check`, `lint`, `typecheck`, `test`) e `verify:full` (+ `test:integration`, `test:e2e`, `build`) — e fazer `AGENTS.md`, `workflow.md`, `/test`, hook Stop, `CONTRIBUTING.md`, template de PR e `plan.template.md` apenas referenciarem esses scripts. Alternativa sem script: uma seção “Gates” única em `workflow.md`, referenciada pelos demais.
- **Preservar:** a distinção mínimo × completo; a recomendação de `--filter` por pacote ao iterar; CI como barreira final.
- **Esforço:** baixo. **Critério:** busca por `format:check|pnpm format` nos arquivos de processo mostra apenas referências ao gate único; nenhuma instrução de verificação contém comando mutante.

#### AUD-003 — Política de commits contraditória

- **Evidência:** `.devin/skills/incremental-implementation/SKILL.md:41` (“**Commit** — save your progress”), `.devin/skills/git-workflow-and-versioning/SKILL.md:317` (“Commit each slice”) e descrição “Use when making any code change”; × `.devin/skills/ship/SKILL.md` (“Commits only on explicit user request”) e `workflow.md` (“Sem commit sem pedido explícito”). `AGENTS.md` só exige Conventional Commits.
- **Impacto:** agentes diferentes (ou o mesmo agente invocando a skill vendorizada diretamente) podem commitar sem pedido. No Devin, o prompt de sistema já desencoraja commits não solicitados, o que atenua mas não resolve para outras ferramentas.
- **Recomendação:** adicionar ao `AGENTS.md` uma linha explícita: “Commits, pushes e PRs só sob pedido explícito do usuário; skills que sugerem commit por slice devem apenas preparar o commit.” Ajustar `/build` para declarar a sobreposição. Não editar as skills vendorizadas (mantê-las fiéis ao upstream).
- **Esforço:** baixo. **Critério:** regra presente no `AGENTS.md`; `/build` referencia a exceção.

#### AUD-004 — Hook de escopo com lacunas de cobertura e de integridade

- **Localização:** `.devin/hooks.v1.json` (matcher `^(edit|write|notebook_edit)$`), `.devin/hooks/workflow.mjs:52-79, 86-100, 164-174`.
- **Evidência:** (a) apenas ferramentas de edição são interceptadas; `exec` pode alterar arquivos livremente (ex.: `pnpm format`, redirecionamentos); (b) sem `tasks/plan.md` o hook só injeta lembrete (hoje não existe plan); (c) `alwaysAllowed` libera `**/*.md`, `.devin/**`, `research/**`, `**/migrations/meta/**` — o agente pode editar `AGENTS.md`, skills e o próprio `workflow.mjs` sem plano; (d) Stop bloqueia uma única vez (`stop_hook_active`); (e) `toRel` compara prefixo de caminho com `process.cwd()` sensível a maiúsculas/minúsculas no Windows (risco de bloquear tudo ou nada — **Não verificado**); (f) `ci.yml` ignora `.devin/**`, e o hook não tem testes; (g) `.gitignore` ainda lista `.devin/hooks/.edited-*` (marcadores agora vão para `%TEMP%`).
- **Problema:** `workflow.md` e `AGENTS.md` apresentam a trava como garantia (“block edits outside the plan”), mas é um controle parcial.
- **Recomendação:** manter o hook (é útil e barato), mas: documentar honestamente o que ele cobre; retirar `.devin/**` e arquivos de regra (`AGENTS.md`, `CLAUDE.md`, `**/SKILL.md`) da lista sempre liberada **ou** cobri-los com regra `ask` de permissão (AUD-005); normalizar caminhos de forma case-insensitive no Windows; adicionar um teste unitário mínimo do `globMatch`/`readScope`. Não tentar interceptar `exec` com parsing de comandos (frágil); usar permissões.
- **Esforço:** baixo-médio. **Critério:** documentação descreve limites; teste do hook roda no `pnpm test`; edição de `AGENTS.md`/`.devin/**` passa a exigir aprovação.

#### AUD-005 — Nenhuma regra de permissões do Devin configurada

- **Evidência:** `.devin/config.json` e `.devin/config.local.json` inexistentes; `%APPDATA%\devin\config.json` sem `permissions`. A documentação oferece `allow`/`deny`/`ask` com `Exec(prefixo)`, `Write(glob)`, `Read(glob)` e `mcp__servidor__ferramenta`, com _deny_ sempre prevalecendo.
- **Impacto:** a proteção contra operações destrutivas, leitura de `.env`/segredos, mudanças nas próprias regras e ações de deploy/restart via MCP Coolify depende só do modo de permissão escolhido na hora e da disciplina do agente. Em modo Bypass, nada é perguntado.
- **Recomendação:** criar `.devin/config.json` (versionado) com um conjunto pequeno, por exemplo: `deny`: `Exec(git push --force)`, `Exec(git reset --hard)`, `Exec(git clean)`, `Write(.env)`, `Write(.coolify-secrets.tmp)`; `ask`: `Write(AGENTS.md)`, `Write(CLAUDE.md)`, `Write(.devin/**)`, `Write(.github/**)`, `Write(packages/db/migrations/**)`, `Exec(git push)`, `Exec(pnpm db:migrate)`, `Exec(pnpm infra:down)`, `mcp__coolify__*`. A lista final exige aprovação (D11); nomes exatos das ferramentas do MCP Coolify devem ser conferidos com `/mcp` antes de restringir por ferramenta.
- **Riscos:** `deny` amplo demais trava o fluxo; começar com `ask`.
- **Esforço:** baixo. **Critério:** arquivo existe; uma tentativa controlada de `Write(.env)` é negada e `git push` pede aprovação numa sessão de teste.

#### AUD-012 — Tokens de sessão do widget sem expiração

- **Localização:** `packages/db/src/schema/messaging.ts` (`site_chat_sessions`: só `createdAt`/`lastSeenAt`), `packages/core/src/modules/messaging/sitechat.ts:118-130` (nenhuma checagem de idade).
- **Impacto:** token guardado no `localStorage` do site cliente vale para sempre (XSS no site hospedeiro ou computador compartilhado ⇒ acesso permanente à conversa).
- **Recomendação:** expiração por inatividade (ex.: `lastSeenAt` + N dias) verificada em `resolveWidgetSession`; valor a decidir (D1). Coordenar com AUD-010.
- **Critério:** teste mostra sessão inativa além do limite rejeitada (404/401).

#### AUD-013 — Credencial owner do banco presente no ambiente de execução da aplicação

- **Localização:** `docker/web/entrypoint.sh` (migra a cada boot e depois `exec node server.js`), `docker/web/migrate.mjs:10`, `docs/development/deployment-coolify.md:86-87` (`DATABASE_ADMIN_URL` (postgres) listado entre as envs do app).
- **Evidência:** o processo web herda `DATABASE_ADMIN_URL`; a aplicação não usa essa variável em runtime (só `drizzle.config.ts`, `seed.ts`, `migrate.mjs`).
- **Impacto:** qualquer comprometimento do processo web (RCE, vazamento de env) entrega credencial que ignora RLS — anula a defesa em profundidade do papel `crm_app`.
- **Estado:** Provável (configuração real do Coolify não inspecionada).
- **Recomendação (D9):** opção principal — no `entrypoint.sh`, executar a migração e remover `DATABASE_ADMIN_URL` do ambiente antes do `exec` (`unset`); alternativa — migração como etapa/serviço separado no Coolify (pre-deploy). Avaliar também usar um papel de migração dedicado em vez do superusuário `postgres`.
- **Critério:** dentro do container em execução, o processo `node server.js` não possui `DATABASE_ADMIN_URL` (verificável com `cat /proc/1/environ` sob controle humano); migrações continuam aplicadas no deploy.

#### AUD-017 — Node 26 (Current) em CI e produção × Node 24 LTS documentado

- **Evidência:** `.nvmrc` = 24; `docs/architecture/stack.md` (“Esta tabela é a fonte de verdade … Node 24.x LTS … Node 26 vira LTS em 2026-10-28; migrar depois disso”); `.github/workflows/ci.yml` (`node-version: 26`, dois jobs); `Dockerfile` (`node:26-alpine` em três estágios). Node.js: v26 aparece como “Current” em 2026-10-13 e “Production applications should only use Active LTS or Maintenance LTS releases”.
- **Impacto:** testes locais em 24 e produção em 26; contradição com a fonte de verdade declarada; o próprio `stack.md` registra que Vitest 5 exige `^22.12/^24`.
- **Recomendação (D3):** opção principal — aguardar a promoção do 26 a LTS (prevista para 2026-10-28) e então alinhar `.nvmrc`, `engines`, `stack.md` em 26; até lá, nenhuma mudança. Alternativa — voltar CI/Docker para 24 imediatamente (o comentário do `Dockerfile` indica que o Node 24 ainda traz corepack, então a linha `npm i -g corepack` deixaria de ser necessária — confirmar no build).
- **Critério:** uma única versão maior em `.nvmrc`, `engines`, `ci.yml`, `Dockerfile` e `stack.md`.

#### AUD-018 — Arquivo de segredos em texto puro persistente na raiz do projeto

- **Localização:** `.coolify-secrets.tmp` (1,1 KB, de 2026-10-03; ignorado pelo Git; nunca commitado — `git log --all` vazio); `docs/development/deployment-coolify.md:143-145` (“guarda os gerados nesta sessão; migrar para cofre adequado quando existir”); `.dockerignore` **não** o exclui (nem `*.log`).
- **Impacto:** segredos de produção legíveis por qualquer ferramenta/agente com acesso ao diretório; um `docker build` local copiaria o arquivo para o estágio de build (`COPY . .`) e para o cache local de camadas. Builds de CI não são afetados (checkout limpo).
- **Recomendação (D7):** humano move os valores para um cofre/gerenciador (ou apenas para o Coolify) e exclui o arquivo; avaliar rotação se houver suspeita de exposição; adicionar `.coolify-secrets.tmp` e `*.log` ao `.dockerignore`.
- **Critério:** arquivo inexistente; `.dockerignore` atualizado; doc de deploy sem referência ao arquivo temporário.

### P3

#### AUD-006 — `AGENTS.md` extenso; papel do `CLAUDE.md`

- **Evidência:** `AGENTS.md` com 12,7 KB, cerca de 40% em “How-tos” de baixa frequência (novo ChannelProvider, BillingProvider, StorageProvider etc.). A documentação do Devin recomenda: “Rules and AGENTS should be kept as small as possible … use a rule to reference skills”. `CLAUDE.md` é lido pelo Devin como regra _always-on_; a linha `@AGENTS.md` é sintaxe de importação do Claude Code (para o Devin é texto literal) e as três notas (“typecheck antes de lint” etc.) passam a valer também para o Devin. `~/.claude/projects` não contém nenhum projeto CRM (Claude Code provavelmente não é usado aqui — **Provável**).
- **Recomendação:** mover os How-tos para `docs/development/how-tos.md` (ou skills locais) mantendo no `AGENTS.md` só regras invioláveis, arquitetura em 10 linhas, ponteiros para gate/skills; decidir (D6) se `CLAUDE.md` fica como ponteiro mínimo (só `@AGENTS.md`) ou é removido; mover as notas úteis para o `AGENTS.md`.
- **Preservar:** todas as “Security rules (non-negotiable)”, “Code rules”, checklist de tabela tenant, “Do NOT”.
- **Critério:** `AGENTS.md` < ~6 KB sem perda de regra obrigatória (checklist de equivalência registrado no PR).

#### AUD-007 — Documentação de governança desatualizada ou contraditória

- `docs/development/workflow.md` → “MCP servers do projeto” omite `coolify` (presente em `.devin/mcp_config.json`) e afirma que `github` é MCP de usuário ativo — o MCP de usuário do Devin tem só `context7`.
- `AGENTS.md` (Coolify só via MCP) × `docs/development/deployment-coolify.md:141` (instrução de `PATCH` REST).
- `workflow.md` descreve o Stop como `pnpm typecheck && pnpm lint`; o hook pede também `format:check`.
- `.gitignore`: entrada obsoleta `.devin/hooks/.edited-*`.
- **Recomendação:** corrigir os textos; manter a regra do `AGENTS.md` e reescrever o trecho REST como “escalar ao usuário”.

#### AUD-008 — Cadeia de suprimento das skills vendorizadas

- **Evidência:** `skills-lock.json` registra `source`, `skillPath`, `computedHash`, mas nenhum `ref` (o formato suporta `ref`); o repositório oficial do CLI reconhece que `computedHash` não pode ser recalculado a partir dos arquivos instalados (issue `vercel-labs/skills#806`). 25 skills (~340 KB) entram como instruções de terceiros; `.prettierignore` exclui `.devin/skills/` inteiro, inclusive os 9 arquivos locais. `idea-refine/scripts/idea-refine.sh` é código executável de terceiros.
- **Impacto:** uma atualização pode trocar instruções do agente sem revisão perceptível; integridade não verificável.
- **Recomendação:** registrar no `workflow.md` que atualizar skills exige revisão do diff de `.devin/skills/**` em PR próprio; fixar `ref` (tag/commit) na próxima atualização; restringir o `.prettierignore` às pastas vendorizadas. Avaliar (D8) remover skills vendorizadas nunca referenciadas pelo ciclo — **nenhuma é candidata confirmada**, pois `workflow.md` referencia praticamente todas.

#### AUD-009 — Duplicações no ambiente de usuário (fora do repositório)

- `officecli` duplicada em `~/.copilot/skills` e `~/.cursor/skills` (ambas lidas pelo Devin). Sobreposição deliberada e documentada entre `context7-mcp` (usuário) e `context7-docs` (projeto). MCP `pencil` em `~/.claude.json` não aparece na sessão (**Não verificado**).
- **Recomendação:** decisão do usuário; sem impacto no projeto.

#### AUD-014 — Rate limit do widget confia no primeiro hop de `X-Forwarded-For`

- `apps/web/src/lib/widget-http.ts:43-47`. Cliente pode forjar o cabeçalho e contornar o limite de `POST /api/widget/session`.
- **Recomendação:** usar o último hop adicionado pelo proxy confiável (Traefik/Coolify) ou um número configurável de proxies confiáveis. **Critério:** teste unitário com XFF forjado mantém a mesma chave de limite.

#### AUD-015 — `FORCE ROW LEVEL SECURITY` ausente em tabelas recentes

- FORCE aparece só em `0002`–`0006`, `0014`, `0024`; migrações `0012`, `0013`, `0015`–`0018` habilitam RLS sem FORCE (edições/reações, funis/negócios/etiquetas, sessões do widget, tabelas de IA, memória), contrariando o cabeçalho de `0002_rls_grants.sql` e o checklist. Não explorável hoje (`crm_app` não é owner — `docker/postgres/init/01-app-role.sh:11`), mas inconsistente.
- **Recomendação:** migração custom aplicando FORCE a essas tabelas e incluir FORCE no checklist do `AGENTS.md`/`docs/database/README.md`. **Critério:** consulta a `pg_class.relforcerowsecurity` mostra `true` para todas as tabelas com política; teste de integração existente segue verde.

#### AUD-016 — Lote de endurecimentos menores

- (a) `packages/auth/src/auth.ts:30-37` — hook padrão de e-mail loga `text` (contém URL com token de reset/verificação); o app injeta `sendEmail` real, então afeta seed/testes/configuração incorreta. **Confirmado.**
- (b) `GET /api/widget/messages?after=` sem validação UUID → erro 500 e ruído no Sentry. **Confirmado.**
- (c) `packages/channels/src/adapters/meta-cloud.ts:167-175` — `verify_token` comparado com `===`. **Confirmado.**
- (d) `packages/channels/src/adapters/waha.ts:350-358` — checagem por prefixo de string em vez de origem; `X-Api-Key` enviado a qualquer URL absoluta aceita. Depende de `WAHA_BASE_URL` sem porta/caminho. **Provável.**
- (e) `apps/web/src/app/accept-invitation/[id]/page.tsx` exibe o e-mail do convite a outro usuário logado. **Confirmado** (relatado pelo subagente; risco baixo).
- (f) `next.config.ts` sem `poweredByHeader: false`. **Confirmado.**
- **Recomendação:** um PR pequeno por item ou um PR com commits separados; testes unitários por item.

#### AUD-019 — Endurecimento dos workflows do GitHub Actions

- `ci.yml` não declara `permissions:` (usa o padrão do repositório; GitHub recomenda mínimo `contents: read`). `cd.yml` (job `rollback`) interpola `${{ inputs.rollback_ref }}` diretamente em `run:` (injeção de script; exposição baixa porque só quem tem escrita dispara). Actions referenciadas por tag maior (GitHub recomenda SHA completo; contrapartida: Dependabot não alerta ações pinadas por SHA — D5). Valores de teste no `env` do CI são fictícios (não são segredos).
- **Recomendação:** `permissions: contents: read` no topo do `ci.yml`; passar `inputs.rollback_ref` por `env:` e validar formato (`^(v\d+\.\d+\.\d+|sha-[0-9a-f]{7,40})$`); decidir política de pin.

#### AUD-020 — Lacunas de testes e duplicação de scripts

- Nenhum `test:coverage` tem threshold. Dois caminhos para unitários: `pnpm test` (Vitest na raiz, `vitest.config.ts`) e `turbo run test` (scripts por pacote com excludes repetidos em 14 `package.json`) — o CI usa o segundo, a documentação o primeiro. `workflow.mjs` sem testes. Sem testes automatizados para AUD-010/011/012.
- **Recomendação:** não criar ferramenta nova. Registrar a decisão sobre qual caminho é canônico (sugestão: manter ambos, mas documentar que `pnpm test` = conveniência local e `turbo run test` = CI); thresholds de cobertura só após medir a linha de base (D12).

#### AUD-021 — Documentação técnica divergente da implementação

- `docs/development/tooling.md:48-50,66-72` (thresholds antigos: complexity 12, max-params 4, max-statements 20, max-lines 350 error) × `tooling/eslint/base.js:171-182` (complexity 20 error, max-params 3 warn, max-statements 10 warn, max-lines 300 warn).
- `docs/development/testing.md:18` (“`webServer` starts `pnpm dev`”) × `apps/web/playwright.config.ts:21-23` (CI usa o servidor standalone).
- `docs/architecture/security.md:112`, `providers.md:28`, `multi-tenancy.md:43,51` citam Trigger.dev (substituído por pg-boss, ADR 0016).
- `docs/development/design-system-lint.md:3,18,47` cita `packages/ui`.
- `docs/architecture/security.md` omite o papel `viewer` (relatado pelo subagente; não reconferido).
- **Recomendação:** corrigir textos; nenhum impacto em código.

#### AUD-022 — Arquivos e restos sem uso

Ver classificação detalhada na seção 15.

#### AUD-023 — Compose local publica serviços em todas as interfaces

- `docker/compose.yml`: `5432`, `6379` (Redis sem autenticação), `9000/9001` (RustFS com console e credenciais padrão) publicados sem `127.0.0.1:`. Em Windows/Docker Desktop isso pode expor os serviços à rede local, dependendo do firewall (**Não verificado**).
- **Recomendação:** prefixar portas com `127.0.0.1:`; decidir sobre Redis (AUD-022).

#### AUD-024 — Continuidade entre sessões dispersa

- Estado do trabalho vive em `TODO.md` (40 KB, backlog + histórico “Concluído”), `tasks/*.done.md` (42 rastreados), `tasks/briefs/*` (25 legados ignorados pelo Git), `docs/audits/`. Funciona, mas `TODO.md` cresce e é lido inteiro.
- **Recomendação (opcional):** mover “Concluído” do `TODO.md` para `docs/changelog` ou para os próprios `tasks/*.done.md`; documentar que `tasks/briefs/` é histórico local.

---

## 11. Auditoria de arquitetura e código

**Arquitetura real × documentada.** Monólito modular conforme ADR 0002: `apps/web` (UI, Server Actions, rotas) → `@crm/core` (serviços com `TenantContext` e `assertPermission`) → repositórios Drizzle → Postgres. Direção de dependências verificada pelo grafo de imports: `core` → {db, config, permissions, channels, billing, observability}; `automation` → {core, ai, db}; nenhum adapter importado fora do registro; `core` não importa `automation`. ESLint impõe a fronteira UI→db (`apps/web/eslint.config.js`) e proíbe imports profundos `@crm/*/src`.

**Pontos fortes confirmados (não alterar):**

- Papel `crm_app` `NOSUPERUSER NOBYPASSRLS` (`docker/postgres/init/01-app-role.sh:11`); app conecta como `crm_app` (`packages/db/src/client.ts:32-35`); migrações como owner.
- `withTenant` usa `set_config(..., true)` (local à transação) e rejeita IDs não-UUID; predicado RLS com `nullif(current_setting(...))::uuid` (`packages/db/src/schema/audit.ts:24`).
- As 30 tabelas tenant/plataforma têm `organization_id`, `pgPolicy` e `enableRLS`; tabelas do Better Auth sem RLS por decisão documentada.
- `organizationId` nunca vem do cliente: `TenantContext` deriva de `session.activeOrganizationId` + rechecagem de membership (`apps/web/src/server/tenant.ts`); as 15 actions usam `requireTenantContext`/`requireSession` + Zod + envelope `{ ok }`.
- Webhooks: corpo bruto lido antes de parsing; conexão resolvida por token de 192 bits; HMAC obrigatório e `timingSafeEqual` (WAHA, Asaas); idempotência por `event_id` e por `(channel_connection_id, external_id)`.
- Jobs pg-boss: payload só com identidade, `TenantContext` reconstruído, enqueue transacional (`fromDrizzle`), no-op sem boss.
- AES-256-GCM com IV aleatório de 12 bytes e formato versionado; `tenantObjectKey` impede traversal; CSP com nonce + `strict-dynamic` para documentos; seed recusa `NODE_ENV=production`; zero `any` fora de testes; 10 `eslint-disable` justificados.
- IA: ainda não há ferramentas registradas; agentes apenas geram sugestões pendentes de aprovação humana, saídas revalidadas por Zod.

**Riscos e débitos:** AUD-010, AUD-011, AUD-012, AUD-013, AUD-014, AUD-015, AUD-016. Não há recomendação de reestruturação arquitetural: a arquitetura atual é adequada ao produto e ao tamanho da equipe.

**Desempenho:** existe auditoria de performance própria (`docs/audits/perf-baseline-2026-10-11.md`) com correções aplicadas em 4 etapas; não foi reavaliada aqui.

---

## 12. Auditoria de testes, qualidade e automação

- **Testes existentes** (contagem do subagente, não reconferida): 65 unitários, 42 de integração, 13 specs e2e. Integração roda contra Postgres/RustFS reais no CI, inclusive com o script de criação do papel `crm_app` (mesmo do compose) — bom alinhamento local/CI.
- **Lint/format/typecheck:** ESLint 9 flat config centralizado, typescript-eslint type-aware, regras de segurança e drizzle, política documentada de warn→error com contagens (`code-quality-standard.md`). Prettier via lefthook em staged + `format:check` no CI. Sem sobreposição problemática de ferramentas (Biome/Oxlint rejeitados com justificativa).
- **CI:** `quality` → `integration` + `scan` em paralelo; `paths-ignore` evita gastar minutos com docs, mas também deixa `.devin/**` (hooks) sem validação.
- **CD:** imagem construída no CI, varrida pelo Trivy antes do deploy; produção só por tag `v*`; rollback por retag sem rebuild. Desenho sólido.
- **Dependabot:** mensal, agrupado, com exclusões justificadas (TS 7, ESLint 10).
- **pnpm:** `minimumReleaseAge` padrão de 1440 min está ativo (pnpm ≥ 11), com exclusões pinadas por versão; `allowBuilds` explícito. Não alterar essas políticas sem decisão humana.
- **Lacunas:** AUD-002, AUD-019, AUD-020; exige validação dinâmica futura: suíte completa verde, e2e, cobertura de linha de base.

---

## 13. Auditoria de segurança e confiabilidade do fluxo de IA

| Controle                                      | Situação                                                                                        | Tipo                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| Operações destrutivas (rm, reset, force push) | Só texto (AGENTS “Do NOT”, prompt do Devin); sem `deny`                                         | Textual (AUD-005)                 |
| Banco de dados                                | Regras textuais (“nunca editar migração aplicada”); `db:migrate` local livre                    | Textual                           |
| Arquivos/escopo                               | Hook parcial (AUD-004)                                                                          | Técnico parcial                   |
| Credenciais                                   | `.env` ignorado; MCP com `${env:...}`; arquivo `.coolify-secrets.tmp` exposto (AUD-018)         | Misto                             |
| Serviços externos                             | Coolify via MCP com aprovação padrão do Devin; regra textual de escalar                         | Textual + padrão da ferramenta    |
| Dependências                                  | `minimumReleaseAge`, lockfile congelado no CI, Dependabot, Trivy                                | Técnico                           |
| Git                                           | lefthook; política de commit contraditória (AUD-003); branch protection não verificado          | Misto                             |
| Produção                                      | tag `v*` como aprovação; ambientes `staging`/`production` no GitHub (revisores não verificados) | Técnico (parcial, não verificado) |
| Revisão de código                             | `/review` + checklist UX; sem revisão obrigatória verificada                                    | Textual                           |
| Integridade das instruções                    | `.devin/**` e `*.md` sempre editáveis; skills de terceiros sem pin                              | Fraco (AUD-004, AUD-008)          |
| Conteúdo não confiável                        | IA sem ferramentas; sugestões exigem aprovação humana                                           | Técnico (bom)                     |
| Interrupção diante de incerteza               | “Gate de esclarecimento” em `workflow.md`/`/plan-task`                                          | Textual                           |
| Registro de decisões                          | ADRs, `tasks/*.done.md`, `TODO.md`                                                              | Processo (bom)                    |

O ambiente separa bem planejamento (plan com Escopo) de implementação, mas a aprovação de mudanças de alto impacto depende do humano estar atento às solicitações do Devin.

---

## 14. Redundâncias e oportunidades de consolidação

| Grupo                  | Fontes                                                                                   | Equivalência funcional?                                    | Recomendação                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Gate de verificação    | 10 fontes (AUD-002)                                                                      | Não — divergem em comandos, ordem e mutabilidade           | Unificar em scripts/seção única; demais fontes referenciam                                  |
| Regras de código       | `AGENTS.md` “Code rules” × `CONTRIBUTING.md` “short version”                             | Sim para o subconjunto (o CONTRIBUTING declara ser resumo) | Manter; `CONTRIBUTING` já aponta para o `AGENTS.md`. Sem ação.                              |
| Workflow               | `AGENTS.md` “Development workflow” × `workflow.md` × SessionStart do hook × skills alias | Parcial; o hook e o AGENTS resumem o doc                   | Manter o `workflow.md` como fonte; reduzir o parágrafo do `AGENTS.md` a 3 linhas + ponteiro |
| Arquitetura/camadas    | `AGENTS.md` × `README.md` × `docs/architecture/overview.md`                              | Parcial                                                    | Manter; o `README` é público, o `AGENTS` operacional. Sem ação além de AUD-006              |
| Documentação Context7  | skill de usuário `context7-mcp` × `context7-docs`                                        | Sobreposição deliberada e documentada                      | Manter                                                                                      |
| Testes unitários       | `vitest.config.ts` raiz × scripts por pacote                                             | Sim (mesmo conjunto, com excludes)                         | Documentar canônico (AUD-020); remoção não recomendada sem medir                            |
| Dockerfiles            | `Dockerfile` × `apps/web/Dockerfile`                                                     | Não — o segundo é obsoleto                                 | Remover o segundo após confirmação (AUD-022)                                                |
| Varredura de segurança | Trivy fs (CI) × Trivy image (CD)                                                         | Complementares                                             | Manter                                                                                      |

---

## 15. Arquivos e mecanismos potencialmente descartáveis (AUD-022)

| Item                                                                                       | Rastreado?                 | Evidência                                                                                                                                   | Classificação                                              | Confirmação necessária                                                                            |
| ------------------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/ui/` (só `node_modules`)                                                         | Não                        | Sem `package.json`; pacote movido para `design-system/` (ADR 0017, `git log` mostra remoção dos arquivos)                                   | **Descartável confirmado**                                 | — (exclusão local, sem efeito no Git)                                                             |
| `graft/.cache/` (vazio)                                                                    | Não                        | Nenhuma referência exceto `.dockerignore:16`                                                                                                | **Descartável confirmado** (pasta)                         | Remover também a linha do `.dockerignore`                                                         |
| `C\uF03AUsers…ci-e2e-fail.log` (1,7 MB, raiz)                                              | Não (ignorado por `*.log`) | Nome corrompido por caminho Windows em shell POSIX; nenhuma referência; e2e corrigido em commits posteriores                                | **Candidato à remoção**                                    | Humano confirma que o log não é mais necessário                                                   |
| `apps/web/Dockerfile`                                                                      | Sim                        | Inalterado desde o bootstrap (`eae37b9`), Node 24, sem migrador; CD usa `context: .` → `Dockerfile` raiz; nenhuma referência no repositório | **Candidato à remoção**                                    | Confirmar no painel Coolify que nenhum app constrói a partir dele (CD indica apps “Docker Image”) |
| Redis em `docker/compose.yml` + `REDIS_URL` em `.env.example`/`@crm/config`                | Sim                        | “Nothing in the codebase depends on Redis yet”; contraria “No new infrastructure services … without justification”                          | **Necessário ou potencialmente necessário** — decisão (D4) | Decidir se fica para uso futuro                                                                   |
| `.trigger-selfhost/` (`.gitignore`, `.prettierignore`), `docker/trigger` (`.dockerignore`) | Sim (entradas)             | Trigger.dev substituído (ADR 0016)                                                                                                          | **Candidato à remoção** (entradas)                         | Confirmar que não há checkout local `.trigger-selfhost/`                                          |
| `.devin/hooks/.edited-*` em `.gitignore`                                                   | Sim (entrada)              | Marcadores agora em `%TEMP%` (`workflow.mjs:125-127`)                                                                                       | **Descartável confirmado** (entrada)                       | —                                                                                                 |
| `.coolify-secrets.tmp`                                                                     | Não                        | Ver AUD-018                                                                                                                                 | **Necessário até migração**                                | Humano migra segredos e então exclui                                                              |
| `tasks/briefs/` (25 legados)                                                               | Não                        | Referenciados em `workflow.md` como histórico                                                                                               | **Necessário ou potencialmente necessário**                | Manter                                                                                            |
| `research/`                                                                                | Não (exceto README)        | Material de referência citado por ADR 0013 e `workflow.md`                                                                                  | **Necessário**                                             | Manter                                                                                            |
| `CLAUDE.md`                                                                                | Sim                        | Lido pelo Devin; Claude Code aparentemente não usado                                                                                        | Decisão (D6)                                               | —                                                                                                 |
| Skills vendorizadas                                                                        | Sim                        | Referenciadas no `workflow.md`                                                                                                              | **Necessárias**                                            | —                                                                                                 |
| `coverage/`, `.turbo/`, `test-results/`, `.next/`                                          | Não                        | Artefatos gerados, ignorados                                                                                                                | Descartáveis por natureza; não são problema                | —                                                                                                 |

---

## 16. Recomendações de estrutura futura

Mantém-se a estrutura atual. Mudanças propostas são de consolidação, não de expansão:

1. `AGENTS.md` curto (regras invioláveis, mapa de arquitetura, ponteiros) + `docs/development/workflow.md` como fonte do processo + gate único (scripts `verify`/`verify:full` **ou** seção única).
2. `.devin/config.json` com poucas regras `deny`/`ask` (AUD-005) — o único mecanismo novo recomendado, e ele já faz parte da ferramenta em uso.
3. Hook mantido, com limites documentados e teste mínimo.
4. Skills vendorizadas mantidas, com atualização apenas via PR revisado e `ref` fixado.
5. Nenhuma nova ferramenta de lint/test/segurança é necessária.

---

## 17. Fontes oficiais consultadas (acesso em 2026-10-13)

| Título                                      | URL / caminho                                                                                                                    | Origem            | Escopo                        | Achado sustentado                                                                                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules & AGENTS.md                           | https://docs.devin.ai/cli/extensibility/rules                                                                                    | Cognition (Devin) | Devin CLI atual               | Descoberta preguiçosa de regras em subdiretórios; `CLAUDE.md` tratado como regra; recomendação de regras mínimas; `read_config_from` (AUD-001, AUD-006) |
| Hooks                                       | https://docs.devin.ai/cli/extensibility/hooks/overview                                                                           | Cognition         | Devin CLI atual               | Formato `decision: block`, exit code 2, descoberta em cwd e ancestrais, `DEVIN_PROJECT_DIR` (AUD-004, §4.1)                                             |
| Permissions (doc empacotada)                | `C:\Users\bkpdi\AppData\Local\Programs\Devin\resources\app\extensions\windsurf\devin\share\devin\docs\reference\permissions.mdx` | Cognition         | versão instalada              | `allow/deny/ask`, precedência, modos Smart/Bypass (AUD-005)                                                                                             |
| Config / global-vs-local (doc empacotada)   | `…\docs\reference\configuration\config-file.mdx`, `global-vs-local.mdx`                                                          | Cognition         | versão instalada              | Locais de `mcp_config*.json`, `config.json` no Windows (`%APPDATA%\devin`)                                                                              |
| Changelog estável (doc empacotada)          | `…\docs\changelog\stable.mdx`                                                                                                    | Cognition         | versão instalada              | AGENTS.md aninhados descobertos; limite de 32 KiB por regra                                                                                             |
| Row Security Policies                       | https://www.postgresql.org/docs/current/ddl-rowsecurity.html                                                                     | PostgreSQL        | PG 18                         | Owners e `BYPASSRLS` ignoram RLS; `FORCE ROW LEVEL SECURITY` (AUD-013, AUD-015)                                                                         |
| Node.js Releases                            | https://nodejs.org/en/about/previous-releases                                                                                    | Node.js           | v24/v26                       | v26 “Current”; produção deve usar LTS (AUD-017)                                                                                                         |
| pnpm — Dependency Resolution Settings       | https://pnpm.io/settings/dependency-resolution#minimumreleaseage                                                                 | pnpm              | v11+/v12                      | `minimumReleaseAge` padrão 1440 desde v11 (§12)                                                                                                         |
| Secure use reference                        | https://docs.github.com/en/actions/reference/security/secure-use                                                                 | GitHub            | Actions atual                 | Permissões mínimas do `GITHUB_TOKEN`, variáveis intermediárias contra injeção, pin por SHA e limitação do Dependabot (AUD-019)                          |
| How to think about data security in Next.js | https://nextjs.org/docs/app/guides/data-security                                                                                 | Vercel            | doc 16.4.0 (instalado 16.3.8) | DAL com autorização no servidor — o padrão do projeto está alinhado (§11)                                                                               |
| `src/local-lock.ts`                         | https://github.com/vercel-labs/skills/blob/3176ae42/src/local-lock.ts                                                            | Vercel Labs       | CLI `skills`                  | Campos de `skills-lock.json`, incluindo `ref` opcional (AUD-008)                                                                                        |
| Issue #806                                  | https://github.com/vercel-labs/skills/issues/806                                                                                 | Vercel Labs       | CLI `skills`                  | `computedHash` não verificável contra arquivos instalados (AUD-008)                                                                                     |
| addyosmani/agent-skills                     | https://github.com/addyosmani/agent-skills                                                                                       | Addy Osmani       | main                          | Origem das 25 skills vendorizadas (AUD-003, AUD-008)                                                                                                    |

---

## 18. Riscos residuais

- Mesmo após as correções, a segurança do fluxo de IA continuará dependendo do modo de permissão escolhido pelo humano (Bypass anula `ask`, mas não `deny`).
- Achados de segurança não foram testados dinamicamente; podem existir problemas que só um teste de intrusão revelaria.
- Configurações do GitHub (branch protection, revisores de ambientes) e do Coolify não foram verificadas.
- A descoberta preguiçosa de regras pode continuar ocorrendo em auditorias futuras se `read_config_from` não a bloquear.

---

## 19. Pendências e decisões que exigem intervenção humana

| ID  | Decisão                                                                | Achados          | Recomendação principal                                                   |
| --- | ---------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| D1  | Modelo de identidade/retomada do widget e prazo de expiração da sessão | AUD-010, AUD-012 | Retomar histórico só pela sessão do navegador; expiração por inatividade |
| D2  | Política de mídia inline                                               | AUD-011          | Allowlist inline + anexo para o resto + CSP `sandbox`                    |
| D3  | Node 24 × 26                                                           | AUD-017          | Alinhar em 26 após virar LTS (≈ 2026-10-28)                              |
| D4  | Manter Redis no compose/config?                                        | AUD-022, AUD-023 | Remover até haver uso (ou manter com bind local)                         |
| D5  | Pin de Actions por SHA × tag                                           | AUD-019          | Manter tags + Dependabot (time pequeno); reavaliar                       |
| D6  | Destino do `CLAUDE.md`                                                 | AUD-006          | Reduzir a ponteiro mínimo                                                |
| D7  | Destino dos segredos de `.coolify-secrets.tmp` e eventual rotação      | AUD-018          | Migrar para Coolify/cofre e excluir                                      |
| D8  | Podar skills vendorizadas?                                             | AUD-008          | Não podar agora; só fixar `ref` e revisar atualizações                   |
| D9  | Migração no boot × etapa separada; papel de migração                   | AUD-013          | `unset` após migrar; papel dedicado depois                               |
| D10 | Forma do gate único                                                    | AUD-002          | Scripts `verify`/`verify:full`                                           |
| D11 | Lista final de `deny`/`ask` do `.devin/config.json`                    | AUD-005          | Começar pequena, majoritariamente `ask`                                  |
| D12 | Thresholds de cobertura                                                | AUD-020          | Medir linha de base antes                                                |

---

## 20. Próximos passos recomendados

1. Revisar este relatório e o `PLANO_DE_EXECUCAO.md`; tomar as decisões D1–D12 (ou marcar como adiadas).
2. Aprovar explicitamente, por escrito, a versão e as fases do plano a executar.
3. Iniciar nova sessão no workspace `CRMv2` usando `PROMPT_EXECUCAO_APOS_APROVACAO.md`.
4. Antes do próximo deploy de produção, priorizar AUD-010 e AUD-011.

---

## 21. Verificação final do estado observável

Ver seção correspondente no final da sessão (registrada também na mensagem de conclusão). Resumo dos meios: `git --no-optional-locks status --porcelain=v1 -b --ignored=matching` antes e depois; listagem da raiz do CRMv2 com tamanhos e datas antes e depois; listagem do workspace de auditoria. Resultado registrado no Apêndice A.

### Apêndice A — Resultado da verificação final

Executada em 2026-10-13, após a criação dos três documentos, só com comandos de inspeção.

| Verificação                                                                                            | Resultado                                                             |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `git --no-optional-locks status --porcelain=v1 -b --untracked-files=all`                               | `## main...origin/main`, sem entradas — idêntico ao início            |
| HEAD                                                                                                   | `8c8aae6` — idêntico ao início; stash vazio                           |
| Ignorados (sem `node_modules`)                                                                         | 62 entradas, mesmo conjunto observado no início                       |
| Raiz do CRMv2 (tamanhos e datas)                                                                       | Idêntica à listagem inicial, **exceto o horário do diretório `.git`** |
| Busca por qualquer arquivo/diretório com mtime ≥ 12:30 (excluindo `node_modules`, `.next`, `research`) | Apenas o diretório `.git` (12:42:20)                                  |
| Workspace de auditoria                                                                                 | Contém somente os três documentos entregues                           |

**Divergência observada:** o mtime do diretório `.git` mudou de 11:55 para 12:42:20 durante a sessão. Nenhum arquivo dentro de `.git` mudou (`index` 11:55:06, `HEAD`, `refs`, `objects`, `logs` com datas anteriores), o que indica a criação e remoção de uma entrada transitória (por exemplo, um arquivo de lock ou temporário de um processo `git`). A origem não foi identificada: todos os comandos `git` desta sessão foram de leitura com `--no-optional-locks`/`GIT_OPTIONAL_LOCKS=0`, mas um processo externo (extensão Git do editor, outra ferramenta) também pode ter acessado o repositório. Não houve alteração de conteúdo e nada foi revertido.

**Limitações:** sem hash completo da árvore anterior; `node_modules`, `.next` e `research/` não foram varridos por mtime; tempos de acesso (atime) podem ter mudado com as leituras.
