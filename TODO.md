# TODO

Prioridades: **P0** segurança/correção urgente · **P1** próximo trabalho
planejado · **P2** quando escalar · **P3** backlog de higiene.

## Implementação futura (prioridade)

- **P0 — Security: CSP com nonce** (headers em `next.config.ts`). Problema: sem
  CSP a superfície XSS fica aberta. Benefício: mitigação real contra script
  injection. Custo: médio — precisa compat com Next inline scripts (nonce via
  middleware/proxy).
- **P1 — Integrations: `channel_connections`** — tabela com tenant + RLS e
  credenciais criptografadas; rotas de webhook
  `/api/webhooks/channels/[connectionId]` (verify → normalize → enqueue
  Trigger). Problema: canais não podem conectar contas reais. Benefício:
  desbloqueia todo o pipeline de messaging. Custo: alto.
- **P1 — Messaging: `contacts`, `conversations`, `messages`** — tabelas
  consumindo `ChannelEvent`. Benefício: inbox central do CRM. Custo: alto.
- **P1 — Realtime: SSE inbox** por `docs/architecture/realtime.md`. Custo:
  médio.
- **P1 — Billing: idempotência do webhook ASAAS** (tabela de eventos) +
  tabelas de billing. Benefício: cobrança confiável. Custo: médio.
- **P2 — Rate limit em Redis** quando houver >1 instância do web. Benefício:
  limites corretos multi-instância. Custo: baixo.
- **P2 — Sentry sourcemaps/upload wiring**. Benefício: stacks legíveis em
  produção. Custo: baixo.

## Pesquisa / upgrades futuros

- **P1 — Node 26**: migrar após 2026-10-28 (vira LTS) + validação da toolchain.
- **P1 — TypeScript 7**: migrar quando typescript-eslint suportar (acompanhar
  typescript-eslint#10940; API só chega no TS 7.1). `tsgo` como typecheck
  sidecar é opção intermediária.
- **P3 — `erasableSyntaxOnly`**: revertido na adoção (7 propriedades de
  parâmetro de construtor em 7 arquivos > teto de 3). A expansão é mecânica;
  refazer o trial depois libera compat com type-stripping/tsgo. Ver
  docs/adr/0013.
- **P3 — Split lint tipado/não-tipado** se lint passar de ~30s (hoje ~25s
  uncached). Ver docs/adr/0013.
- **P3 — Dead-code sweep (knip), dependabot/renovate, git hooks** para
  contribuidores humanos.
- **P3 — Logger edge-safe**: `instrumentation.ts` puxa
  `@crm/observability` para o bundle Edge e o Turbopack avisa que
  `process.stdout/stderr` não existem lá (warning de build, não erro).
  Opções: isolar o registro de streams atrás de uma checagem de runtime ou
  variant `edge` do logger.
- **P3 — Promover warns a error** quando a contagem zerar:
  `prefer-nullish-coalescing` (1), `no-unnecessary-condition` (4),
  `complexity` (4), `max-statements` (3) — workflow em
  `docs/development/tooling.md`.
