# Development workflow

How work flows in this repo — human + Devin agent. The lifecycle commands
come from the installed `addyosmani/agent-skills` pack (`.devin/skills/`),
wired to this repo's own gates.

## The loop

```
/spec  →  /plan  →  /build  →  /test  →  /review  →  /ship
```

Mesma sequência do pack upstream. Adaptações locais:

- **`/spec`** escreve/edita o PRD em `docs/product/` (o formato do projeto,
  não `SPEC.md` na raiz); quando o item já é coberto por um doc, `/spec`
  pode ser pulado — ver "Quando /spec é obrigatório".
- **`/plan`** escreve `tasks/plan.md`, que **também carrega o contrato de
  escopo** (`## Escopo` globs) que o hook enforça — o plano é o contrato.
  Não existe passo de "brief" separado.

Skills por fase (espelha `skills.addy.ie/lifecycle`): cada comando carrega
o **conjunto da fase** — as "sempre" definem o método da fase; as
condicionais se aplicam quando o trabalho toca o eixo delas.

| Stage  | Command   | Skills — sempre                                                                                                                                               | Skills — quando o eixo se aplica                                                                                                                                                                                                                                           |
| ------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec   | `/spec`   | `spec-driven-development` (PRD em `docs/product/`; ver "Quando /spec é obrigatório")                                                                          | `interview-me`, `idea-refine` — ideia crua/ambígua                                                                                                                                                                                                                         |
| Plan   | `/plan`   | `planning-and-task-breakdown` → `tasks/plan.md` (template: `docs/development/plan.template.md`; carrega `## Contexto` + `## Escopo`) + gate de esclarecimento | —                                                                                                                                                                                                                                                                          |
| Build  | `/build`  | `incremental-implementation` (slices finos), `test-driven-development` (teste junto)                                                                          | `frontend-ui-engineering` (UI), `api-and-interface-design` (contratos novos), `source-driven-development` + `context7-docs` (API de lib/framework — checar docs oficiais), `doubt-driven-development` (decisão arriscada), `context-engineering` (setup de contexto/rules) |
| Test   | `/test`   | `debugging-and-error-recovery` (triage de falha)                                                                                                              | `browser-testing-with-devtools` — evidência real no browser via chrome-devtools MCP quando há UI/fluxo                                                                                                                                                                     |
| Review | `/review` | `code-review-and-quality` (diff review antes de commit)                                                                                                       | `code-simplification` (complexidade acumulada), `security-and-hardening` (auth/webhooks/dados/deps), `performance-optimization` (queries, N+1, bundle)                                                                                                                     |
| Ship   | `/ship`   | `git-workflow-and-versioning` (commit convencional — só quando o usuário pedir), `shipping-and-launch` (checklist/rollback)                                   | `ci-cd-and-automation` (pipeline), `documentation-and-adrs` (docs/ADR), `observability-and-instrumentation` (logs/métricas), `deprecation-and-migration` (remoções/migrações)                                                                                              |

Comandos standalone fora do loop principal: `/webperf` (audit de
performance) e `/code-simplify` (rodada de simplificação).

Skills fora de fase (upstream, standalone): `using-agent-skills`
(meta — roteamento de skill) e `constraint-driven-development` (barra
de qualidade como contrato escrito; invocar quando o projeto não tem
padrões escritos ou agentes silenciam checks pra chegar no verde).

Skill local (não-upstream): `context7-docs` (docs de libs via Context7
MCP — companheira de `source-driven-development` no Build).

Fonte de verdade do pack: `github.com/addyosmani/agent-skills` — clone
de referência em `research/agent-skills` (gitignored, re-cloneable).

## Gate de esclarecimento (antes de /plan, sempre)

Trabalho não-trivial **começa com perguntas, não com código**. Mudança feita
sobre suposição é a definição de risco (CRAP: complexo × sem cobertura de
entendimento). Regra:

- Antes de escrever o plan, o agente identifica ambiguidades que afetam
  **escopo ou arquitetura** e pergunta ao usuário (menu de múltipla escolha
  com opção de texto livre — `ask_user_question`).
- Pergunta só o que muda decisão — preferências cosméticas seguem o default
  documentado e são registradas no plan como decisões provisórias.
- As respostas entram no `## Contexto` do `tasks/plan.md` — fica o registro
  do porquê, não só do quê.
- Pedido já claro e fechado ("rode X", "corrija o typo em Y") não exige
  gate — usar julgamento. Na dúvida, perguntar: uma pergunta é mais barata
  que um retrabalho.
- `interview-me` e `spec-driven-development` são as skills para quando a
  ambiguidade é de produto, não de implementação.

## Quando `/spec` é obrigatório

Todo item entra pelo `/plan` — o que varia é se antes disso um spec precisa
ser escrito:

- **`/spec` obrigatório** (PRD em `docs/product/` via
  `spec-driven-development`): feature nova com comportamento visível ao
  usuário, item do TODO sem decisões registradas, ou qualquer ambiguidade
  de produto que o gate de esclarecimento não resolve em 1-2 perguntas.
- **`/spec` pode ser pulado** (vai direto ao `/plan`, que ainda registra as
  decisões no `## Contexto`): chore/hardening já especificado — findings de
  review com decisões tomadas, itens do TODO com decisão datada, fixes
  mecânicos — e todo item já coberto por um doc em `docs/product/`.

Regra prática: se a pergunta "o que deve existir quando isso terminar?" não
tem resposta de uma frase já escrita em algum lugar, `/spec` primeiro.

## A trava de escopo (`tasks/plan.md` + hooks)

`.devin/hooks.v1.json` → `.devin/hooks/workflow.mjs` registra:

- **SessionStart**: injeta o resumo deste workflow no contexto.
- **UserPromptSubmit**: lembra qual plan está ativo.
- **PreToolUse** (edit/write): **bloqueia** editar arquivo de código/config
  fora dos globs de `## Escopo` do `tasks/plan.md`. Markdown/docs são
  sempre livres. Sem plan → só lembrete (edições pontuais/docs não travam).
- **PostToolUse**: marca que a sessão editou arquivos.
- **Stop**: se a sessão editou, **bloqueia a primeira tentativa de parar**
  exigindo o gate mínimo — `pnpm typecheck && pnpm lint` + testes
  relevantes + TODO/docs atualizados. Bloqueia uma vez por sessão (não
  faz loop).
- **SessionEnd**: limpa o marcador.

Para expandir escopo no meio do trabalho: edite o `## Escopo` do plan
(o agente pergunta antes) — a trava cede, o registro fica.

Um plan ativo por vez. Concluído → arquivar como
`tasks/plan-<item>.done.md` (junto do `tasks/todo-<item>.done.md`).
Briefs históricos da era `.task-brief.md` estão arquivados em
`tasks/briefs/`.

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
