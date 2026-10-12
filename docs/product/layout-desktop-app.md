# Layout de desktop e formato de app

**Status:** aprovado pelo fundador em 2026-10-12. Complementa `DESIGN.md` (tokens e visual) e `ia-navegacao.md` (estrutura). Os tokens marcados "proposta" entram no `DESIGN.md` e em `design-system/src/styles/tokens/*.css` no Slice 1, junto com o teste de drift.

## 1. Telas que o produto garante

| Cenário           | Escala do Windows                | Área útil da página (CSS, estimada) | Compromisso                                                       |
| ----------------- | -------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| **Referência**    | 100%                             | ~1920 × 930 px                      | Desenho principal                                                 |
| **Piso**          | 125% (padrão em notebooks 1080p) | ~1536 × 740 px                      | **Obrigatório**: tudo funciona sem rolagem horizontal e sem corte |
| Abaixo de 1536 px | —                                | —                                   | Utilizável, sem compromisso de layout neste ciclo                 |

Navegador padrão: Chrome. Os números consideram barra de tarefas (48 px) e a interface do Chrome com favoritos (~100 px); confirmar com `window.innerWidth/innerHeight` nos dois cenários antes de fechar o Slice 1.

## 2. Orçamento de altura

| Faixa                        | Hoje                             | Módulos de trabalho (Atendimento, Negócios)                                  |
| ---------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| Barra superior               | 76 px (`nav-height`)             | 76 px                                                                        |
| Cabeçalho da página          | ~88 px (título 40 px + respiros) | **56 px** (`page-header-compact`): título `h3` (24 px) e abas na mesma linha |
| Área de trabalho, referência | ~766 px                          | ~798 px                                                                      |
| Área de trabalho, piso       | ~576 px                          | ~608 px                                                                      |

Páginas de leitura e configuração (Início, Configurações, Minha conta, Plataforma, Inteligência) mantêm o cabeçalho de 40 px e rolam normalmente.

## 3. Largura: duas famílias de página

| Família                | Páginas                                                      | Regra                                                                            |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Trabalho               | Atendimento, Negócios                                        | Largura fluida, margem `page-pad` (32 px). Não usar `container-max`              |
| Leitura e configuração | Início, Configurações, Minha conta, Plataforma, Inteligência | `container-max` (1440 px) centralizado; formulários em `container-text` (680 px) |

**Atendimento (três painéis)**

| Painel         | Referência                                               | Piso                    |
| -------------- | -------------------------------------------------------- | ----------------------- |
| Lista          | `inbox-list` 360 px                                      | `inbox-list-sm` 320 px  |
| Conversa       | fluida (~1100 px); mensagens até `thread-measure` 760 px | fluida (~800 px)        |
| Painel direito | `inbox-aside` 360 px                                     | `inbox-aside-sm` 320 px |

**Negócios:** colunas de `kanban-column` (296 px) com 16 px de espaço; cerca de 6 visíveis na referência e 4 a 5 no piso; rolagem horizontal só do quadro.

## 4. Formato de app

O produto deve se comportar como app no navegador, para que empacotar depois (PWA instalável no computador e app de celular, os dois desejados) não exija redesenho.

1. **Shell em altura fixa** (`100dvh`): barra superior e cabeçalho fixos; só os painéis rolam; composer preso à base da conversa.
2. **Toda tela tem URL** (já é regra: `?c=`, abas por URL).
3. **Voltar dentro do app**: páginas de segundo nível têm `IconButton` `arrow-left` à esquerda do título (`PageHeader` prop `back`), porque app instalado não tem o voltar do navegador. Substitui os links "Voltar" em texto.
4. **Nada só no hover**: ação visível só no hover ganha alternativa em menu.
5. **Alvos de 44 px** (`control-md`).
6. **Estado da conexão em tempo real visível**: quando o SSE cai, mostrar "Reconectando…" (usar `Badge` `warning`; volta ao normal sem aviso).
7. **Atalhos**: ⌘K, `j`/`k`, `Enter` já existem; novos atalhos seguem a mesma convenção.
8. **Avisos nativos** dependem da funcionalidade de notificações (sino hoje vazio).
9. **Instalação (PWA)**: manifest com `display: standalone`, `theme_color` = `bg-page` (#0B1726), ícones. **Bloqueado**: não existe símbolo oficial, só o `Wordmark`.

### Celular (reservado, não implementar agora)

- `ModuleNav` ganha variante de **barra inferior de discos** (referência visual: estudo de caso Stockify no design system antigo).
- Avatar no topo à direita; abas viram seletor em pílula ("Fila ⌄"), como o filtro "Ver".
- Atendimento alterna lista e conversa pelo `?c=` (já previsto no `inbox.md` abaixo de `lg`).

## 5. Tokens propostos (família "Layout")

| Token                            | Valor         | Uso                                          |
| -------------------------------- | ------------- | -------------------------------------------- |
| `viewport-ref`                   | 1920px        | Largura de referência                        |
| `viewport-floor`                 | 1536px        | Largura mínima garantida                     |
| `page-pad`                       | 32px          | Margem lateral das páginas de trabalho       |
| `page-header-compact`            | 56px          | Cabeçalho compacto de Atendimento e Negócios |
| `inbox-list` / `inbox-list-sm`   | 360px / 320px | Lista do Atendimento                         |
| `inbox-aside` / `inbox-aside-sm` | 360px / 320px | Painel direito do Atendimento                |
| `thread-measure`                 | 760px         | Medida máxima das mensagens                  |
| `kanban-column`                  | 296px         | Coluna do quadro                             |

O ponto de troca entre referência e piso: largura útil abaixo de 1700 px usa as variantes `-sm` (`HIP`; validar no Slice 1).

## 6. Mudanças no design system

| Mudança                                                                       | Tipo                                           | Slice                      |
| ----------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------- |
| Tokens da seção 5                                                             | Tokens novos                                   | 1                          |
| `PageHeader`: variante compacta (56 px) e prop `back`                         | Template existente                             | 1                          |
| `AppShell`: grade de altura fixa com regiões de rolagem independentes         | Template novo                                  | 1                          |
| Filtro "Ver" com `Select` em pílula                                           | Reuso                                          | 4                          |
| Indicador de conexão em tempo real                                            | Regra nova sobre `Badge`                       | 2                          |
| Perigo recolhido em menu e confirmação com `Dialog` (fim do `window.confirm`) | Regra existente no `DESIGN.md`, aplicar        | 3 e 5                      |
| `ModuleNav` barra inferior                                                    | Variante nova                                  | Reservado                  |
| Ícone de app                                                                  | Ativo de marca                                 | Bloqueado até existir logo |
| Navegação lateral, migalhas de pão, seletor de organização                    | Não entram; hub usa índice em cartões + `Tabs` | —                          |

## 7. Como validar

Todo wireframe e toda tela entregue são conferidos nos dois tamanhos (1920 × 930 e 1536 × 740) no Chrome, com DevTools em modo responsivo, além do checklist das 7 leis (`docs/development/ux-7-leis-checklist.md`).
