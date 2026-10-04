# Development workflow

How work flows in this repo — human + Devin agent. The lifecycle commands
come from the installed `addyosmani/agent-skills` pack (`.devin/skills/`),
wired to this repo's own gates.

## The loop

```
docs/product/* (spec)  →  /brief  →  /plan  →  /build  →  /test  →  /review  →  /ship
```

| Stage  | Command                                                                    | What happens                                                                                                                  |
| ------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Spec   | (já existe)                                                                | `docs/product/` + `TODO.md` são a fonte. Se a ideia estiver crua: `spec-driven-development` / `interview-me` / `idea-refine`. |
| Brief  | **`/brief`**                                                               | Cria `.task-brief.md` — a trava de escopo. Ver abaixo.                                                                        |
| Plan   | `/plan` → `planning-and-task-breakdown`                                    | Quebra o brief em tarefas pequenas ordenadas com critério de aceite.                                                          |
| Build  | `/build` → `incremental-implementation` + `test-driven-development`        | Slices finos, teste junto. Sem slice gigante.                                                                                 |
| Test   | `/test` → `debugging-and-error-recovery` + `browser-testing-with-devtools` | Gates do repo (abaixo) + verificação real no browser via chrome-devtools MCP quando UI.                                       |
| Review | `/review` → `code-review-and-quality`                                      | Diff review antes de qualquer commit.                                                                                         |
| Ship   | `/ship` → `git-workflow-and-versioning` + `shipping-and-launch`            | Commit convencional (só quando o usuário pedir), TODO/docs atualizados.                                                       |

Skills de apoio sob demanda: `doubt-driven-development` (decisões
arriscadas), `source-driven-development` (conferir docs oficiais),
`security-and-hardening` (webhooks/auth/dados), `api-and-interface-design`
(contratos novos), `constraint-driven-development` (barra de qualidade),
`documentation-and-adrs` (ADRs).

## A trava de escopo (`.task-brief.md` + hooks)

`.devin/hooks.v1.json` → `.devin/hooks/workflow.mjs` registra:

- **SessionStart**: injeta o resumo deste workflow no contexto.
- **UserPromptSubmit**: lembra qual brief está ativo.
- **PreToolUse** (edit/write): **bloqueia** editar arquivo de código/config
  fora dos globs de `## Escopo` do `.task-brief.md`. Markdown/docs são
  sempre livres. Sem brief → só lembrete (edições pontuais/docs não travam).
- **PostToolUse**: marca que a sessão editou arquivos.
- **Stop**: se a sessão editou, **bloqueia a primeira tentativa de parar**
  exigindo o gate mínimo — `pnpm typecheck && pnpm lint` + testes
  relevantes + TODO/docs atualizados. Bloqueia uma vez por sessão (não
  faz loop).
- **SessionEnd**: limpa o marcador.

Para expandir escopo no meio do trabalho: edite o `## Escopo` do brief
(o agente pergunta antes) — a trava cede, o registro fica.

Um brief por vez. Concluído → apagar ou arquivar como
`.task-brief-<item>.done.md`.

## Gates de qualidade (o que "verde" significa)

Mínimo por sessão com edição: `pnpm typecheck` + `pnpm lint` + testes do
pacote tocado. Completo antes de commit/review de fase:
`pnpm format && pnpm lint && pnpm typecheck && pnpm test &&
pnpm test:integration && pnpm test:e2e && pnpm build`
(ver `docs/development/tooling.md`).

## MCP servers do projeto

`.devin/mcp_config.json` (commitado, escopo do projeto):

- **chrome-devtools** (`chrome-devtools-mcp@1.10.1`) — browser real para a
  skill `browser-testing-with-devtools`: DOM, console, network, screenshots.
  Sem credenciais. Carrega em novas sessões.

Servidores user-level já ativos (não duplicar no projeto): context7
(docs de libs), github.

## O que NÃO muda

- AGENTS.md continua a fonte de verdade de regras de código/segurança.
- Sem commit sem pedido explícito. Sem `apps/worker` sem ADR.
- Sem infra/dependências novas sem justificativa concreta.
- Secrets só via env — nunca em `.devin/mcp_config.json` (usar
  `mcp_config.local.json`, gitignored, se um dia precisar).
