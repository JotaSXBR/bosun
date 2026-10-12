# UX — as 7 leis (auditoria + plano)

Spec do esforço "toda tela segue as 7 leis de UX". Primeira parte é a
auditoria do estado atual (o que já cumpre, o que viola); segunda é a
proposta de trabalho em slices. As decisões abertas no fim precisam de
resposta antes do `/plan-task`.

## As leis (contrato)

1. **Fitts** — CTA primário ≥ 44px de altura (ideal ~50), padding generoso,
   acima da dobra, alto contraste. Ação principal nunca em menu "..." nem no
   rodapé.
2. **Hick** — máx. 3 opções por decisão crítica; excedente vai para
   "Avançado". Pricing (quando existir): máx. 3 planos, 1 recomendado.
3. **Zeigarnik** — todo fluxo multi-etapas tem barra de progresso +
   "Passo X de Y" + estado de check.
4. **Jakob** — padrões consagrados: lupa = busca no topo, engrenagem =
   config, avatar canto superior direito = conta, dropdown abre pra baixo.
5. **Gradiente de meta** — progresso > 70% → copy motivacional
   ("Quase lá", "Falta 1"), % visível e estimativa quando fizer sentido.
6. **Von Restorff** — 1 CTA primário por tela (accent, destaque). Secundário
   = ghost/outline. Hierarquia primário > secundário > terciário.
7. **Miller** — máx. 5–7 elementos interativos agrupados por tela; acima
   disso, abas ou seções.

Checklist de aceitação por tela (do brief): CTA clicável em <1s · ≤1 ação
principal · progresso em fluxos · padrões consagrados · hierarquia visual ·
nada pra memorizar.

## Nuances da pesquisa (revisão 2026-10-11)

Fontes: lawsofux.com (Yablonski), NN/g, WCAG 2.5.5/2.5.8, literature
(Hick 1952, Miller 1956 + Cowan 2001, Kivetz/Urminsky/Zheng 2006 —
endowed progress), Radix primitives docs. O que a pesquisa corrige ou
afina nas interpretações populares das leis:

- **Fitts** — 44px = WCAG 2.5.5 (AAA) e recomendação NN/g (~1cm);
  o piso AA é 24px (2.5.8) + espaçamento entre alvos. Primário ≥44px;
  secundários podem ser menores se bem espaçados — logo bump de
  `control-md` cobre tudo sem penalidade.
- **Hick** — tempo de decisão cresce em **log₂(n)**, não linear; vale
  para decisões entre opções equiprováveis, não para scan de listas
  ordenadas (alfabética/frequência é varrida, não "decidida"). Regra
  correta: **categorizar > remover**; "máx 3" vale só para decisões
  críticas simultâneas. Tabs de navegação não são decisão Hick.
- **Zeigarnik** — o gatilho é a **visibilidade do incompleto**: checklist
  escondido em menu não gera tensão. Combinar com **endowed progress**
  (Nunes & Drèze 2006): pré-creditar passos já feitos — cartão com 2
  selos bônus converteu 34% vs 19% idêntico em esforço.
- **Gradiente de meta** — o número certo é **o que falta**, não o que
  acumulou ("falta 1" > "4 de 5"); framing vira na reta final. Copy
  motivacional sem número é fraca — sempre com a contagem. Estado de
  conclusão merece tratamento próprio (celebração honesta).
- **Miller** — 7±2 mede **chunks na memória de trabalho**, não elementos
  na tela (Cowan: ~4 quando algo precisa ser carregado entre passos).
  Alavanca real: agrupar com rótulos significativos e nunca exigir
  memorização entre telas (recognition > recall).
- **Von Restorff** — o isolamento exige **uniformidade dos pares**: todos
  os secundários no mesmo estilo discreto. Vigiar "isolamento não
  intencional" — um botão danger vermelho ao lado de secundários rouba
  a atenção do primário; danger fica recolhido (menu) até ser preciso.
- **Jakob** — a convenção inclui a **versão anterior do próprio produto**:
  manter deep links funcionando (redirects) ao reorganizar rotas.

## Auditoria — estado atual

O que **já cumpre** (não mexer):

- **Jakob no shell** — `AppTopBar` com lupa + ⌘K, sino, `UserMenu` com avatar
  no canto direito, engrenagem `settings` no `ModuleNav`. Padrão
  Chatwoot/Linear.
- **Von Restorff na regra** — DESIGN.md já manda "one primary per view
  region" e o `Button` tem variantes certas. Falta enforcement por tela.
- **Zeigarnik na base** — `ProgressBar` já existe no DS
  (`design-system/src/components/progress-bar.tsx`).
- **Auth/onboarding** — sign-in/sign-up/onboarding com 1 CTA primário
  `size="lg"` full-width, formulário único, AuthLayout do kit.

Violações encontradas, por tela:

| Tela                | Lei                       | Problema                                                                                                                                                                                                      |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/app` (home)       | Fitts / Von Restorff      | Nenhum CTA — página só tem cards de conta e auditoria. Sem ação principal acima da dobra.                                                                                                                     |
| `/app/inbox`        | Miller (limite)           | 6 tabs + filtros (busca, setor, canal, "aguardando") = ~9 elementos interativos no rail. No teto do aceitável; ok por ora, observar.                                                                          |
| Thread do ticket    | Von Restorff / Hick       | `TicketActions` chega a 5 botões + 2 selects na mesma linha (Assumir, Aguardando, Em andamento, Resolver, Adiar, Transferir). Nenhum primário quando `in_progress` — "Resolver" é secondary igual aos demais. |
| `/app/deals`        | Von Restorff              | Toolbar com 3 ações mesmo peso (`Novo funil`, `Nova etapa`, `Excluir funil` ghost-danger) + select de funil. Nenhum primário claro; "Novo negócio" mora na coluna.                                            |
| `/app/integrations` | Von Restorff / Hick       | Um `variant="primary"` por linha de conexão ("Conectar"/"Reconectar") → N primários na tela. Linha WAHA conectada mostra 5 botões (Reconectar + Reiniciar + Parar + Desparear + Excluir).                     |
| `/app/settings`     | Miller                    | Form de org + card Equipes + card IA + `PlatformSettings` (admin) empilhados num scroll só; links "Voltar" como texto sublinhado (não-padrão).                                                                |
| `/app/settings/ai`  | **Miller (pior ofensor)** | 6 seções interativas empilhadas: Sugestões, Credenciais, Observador, Agentes, Conhecimento, Brain — cada uma com forms/tabelas próprias. Precisa de abas.                                                     |
| `/app/setup`        | Fitts (menor)             | Wizard de 1 etapa disfarçado de "setup" — ok, mas usa `<select>` nativo fora do DS.                                                                                                                           |
| Onboarding          | Zeigarnik (ausência)      | Fluxo de ativação real (criar org → conectar canal → equipe → primeira conversa → funil) é invisível: usuário cai na home vazia sem senso de progresso.                                                       |
| Geral               | Fitts                     | `control-md` = 42px < 44px e vários CTAs primários usam `size="sm"` (34px) — ex.: "Conectar" em integrations, ações do kanban.                                                                                |
| Geral               | Jakob                     | `<select>` nativo em `setup-form.tsx` e `new-connection-form.tsx` (deveria ser `Select` do DS); links "Voltar" soltos como `<Link>` sublinhado.                                                               |
| Futuro              | Hick                      | Não existe página de pricing ainda — a regra dos 3 planos fica registrada como contrato pra quando a landing pública sair.                                                                                    |

## O que vamos fazer (proposta)

**Slice 1 — Regras no DS (fundação, ~1 sessão)**

- Bump do token `control-md` 42→44px em `DESIGN.md` + `tokens/*.css`
  (decidido — afeta todos os controles md; `tokens.test.ts` precisa
  acompanhar). Primário de página/seção segue podendo usar `lg` (50px).
- `Steps`/`Checklist` no DS em cima da `ProgressBar` existente: contador
  "Passo X de Y", item com check; na reta final (falta 1 ou ≥70%)
  o framing vira "o que falta" + copy motivacional ("Quase lá — falta 1")
  e conclusão tem estado de celebração próprio (cobre Zeigarnik +
  Gradiente num componente só).
- Substituir os 2 `<select>` nativos por `Select` do DS.
- Documentar a régua em `DESIGN.md` (seção UX laws ou Do's).

**Slice 2 — Home `/app` com checklist de ativação**

- Card "Primeiros passos" **sempre visível enquanto incompleto** (a
  tensão do Zeigarnik exige visibilidade — não colapsa, não vira menu):
  org criada ✓ → conectar canal → criar equipe → criar funil → primeira
  conversa.
- **Endowed progress**: "org criada" nasce marcada — o checklist abre
  em 1/5 (20%), nunca 0%.
- Persistência decidida: tabela `onboarding_checklist` por org — seguir o
  checklist de tabela tenant-owned (RLS + `organization_id` + grant
  `crm_app` + teste de isolamento). Itens marcados por ação do usuário,
  não por derivação.
- CTA primário da página = próximo passo do checklist. Some quando 100%
  (com estado de conclusão breve — "Espaço pronto", não sumiço abrupto).
- Resolve Fitts+Von Restorff+Zeigarnik+Gradiente da tela mais vista do app.

**Slice 3 — Correções tela a tela**

- `/app/settings/ai`: 6 seções → subpaths (decidido — mesmo padrão de
  `/app/settings/teams`): `/settings/ai/suggestions`, `/credentials`,
  `/observer`, `/agents`, `/knowledge`, `/brain`, com nav de abas no topo
  (`Tabs` underline do DS ou sub-nav própria).
- Thread do ticket: primário contextual por status (decidido) —
  open → "Assumir", in_progress → "Resolver", waiting_customer →
  "Retomar"; demais secondary; Adiar + Transferir dentro de menu
  "Mais ações".
- `/app/integrations`: 1 primário na tela (form "Criar conexão"); ações de
  linha viram secondary/ghost + menu para o ciclo de vida secundário —
  inclusive "Excluir" (danger recolhido: vermelho ao lado de secundários
  é isolamento não intencional e rouba o primário).
- `/app/deals` toolbar: hierarquia clara (1 ação primária ou tudo
  secondary com primário no empty state).
- `/app/settings`: nav de seções (abas ou âncoras) no lugar de cards-link
  - "Voltar" sublinhado; padronizar o padrão "voltar" (ghost icon button).

**Slice 4 — Gate**

- Registrar o checklist das 7 leis em `docs/development/` como parte do
  `/review` (cada tela nova/alterada passa pelas 6 perguntas do brief).

## Critérios de sucesso

- Toda tela de `apps/web/src/app/**` passa no checklist de 6 perguntas.
- Nenhuma tela com >1 `variant="primary"` na mesma região, nenhuma com 0
  ação principal.
- `/app/settings/ai` navegável por abas; `/app` home com CTA + progresso.
- `pnpm lint && pnpm typecheck && pnpm test` verdes; DS sem drift de tokens.

## Fora de escopo (v1)

- Página de pricing (produto não tem billing UI ainda).
- `/design-system` showcase e `/widget-demo` (dev/demo, não são produto).
- Widget público `widget.js`.
- Onboarding multi-etapas novo — o checklist da home cobre a ativação sem
  virar wizard.

## Decisões tomadas (2026-10-11)

1. **CTA** — bump `control-md` 42→44px (não a regra "sempre lg").
2. **Checklist** — persistir `onboarding_checklist` por org (não derivar).
3. **Abas IA** — subpaths `/app/settings/ai/*` (não tabs client-side).
4. **Ticket** — mapeamento de primário por status confirmado; Adiar +
   Transferir vão para "Mais ações".
