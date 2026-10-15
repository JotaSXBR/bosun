# Checklist das 7 Leis de UX — gate do review

Toda tela nova ou alterada passa por este checklist no review, junto do
`code-review-and-quality`. Se uma tela reprovar, ela volta para o build
antes do ship.

Fundamento e decisões: `docs/product/ux-7-leis.md`.

## As 6 perguntas (aceitação)

- [ ] Consigo clicar no CTA principal em <1s?
- [ ] Tem no máximo 1 ação principal?
- [ ] Mostra progresso se for fluxo?
- [ ] Usa padrões que já vi em Google, Notion, Linear, WhatsApp Web,
      Chatwoot, Outlook, ClickUp?
- [ ] Tem hierarquia visual clara?
- [ ] Não preciso memorizar nada pra usar?

## Lei → regra verificável

| Lei           | Regra concreta                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fitts         | CTA primário ≥ 44px de altura (`control-md`/`lg`), acima da dobra, contraste alto; nunca escondido em `...` ou canto inferior. Secundários ≥ 24px + espaço. |
| Hick          | Máx. 3 opções por **decisão crítica** (não conta scan de lista ordenada nem tabs de navegação); opções extras agrupadas sob "Avançado"/"Mais ações".        |
| Zeigarnik     | Fluxo multi-etapas: `Steps` com barra, "X de Y concluídos", check visual; checklist fica **visível** enquanto incompleto; progresso endowed (nunca 0%).     |
| Jakob         | Lupa = busca, engrenagem = config, avatar canto sup. direito = conta, dropdown abre pra baixo, fluxo linear; redirects preservam deep links.                |
| Goal-gradient | ≥70% ou falta 1 → copy motivacional com número ("Quase lá — falta 1"), mostra o que falta, não o que fez.                                                   |
| Von Restorff  | 1 `variant="primary"` por tela/região; todos os secundários no mesmo estilo (ghost/outline); danger não rouba atenção (vai pro menu).                       |
| Miller        | Chunks agrupados com rótulos (seções/abas/subpaths), não elementos individuais; config densa vira tabs.                                                     |

## Como revisar

1. Rode o checklist por tela tocada no diff (use o smoke do
   `browser-testing-with-devtools` quando a mudança afetar UI real).
2. Reprovou em qualquer pergunta → a tela volta para o build; registre o
   achado no relatório do review.
3. Exceções (ex.: uma segunda ação primária justificada por domínio) são
   documentadas no review — nunca silenciadas.
