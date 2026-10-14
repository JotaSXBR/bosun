# UI de atendimento — proposta de corte

Auditoria do workbench `/app/inbox` contra os padrões de mercado
(`omnichannel-research.md`) e o contrato visual (`DESIGN.md`).

**Status: aprovado em entrevista (2026-10-13).** Todas as propostas
abaixo foram aceitas; B3 e B9 foram refinadas na conversa (ver notas).
Os itens viram revisão de `inbox.md` e `tasks/plan.md` quando os planos
correspondentes forem criados — o spec `inbox.md` permanece como está
até lá.

Inventário atual: lista (abas Fila/Minhas/Adiados/Fechadas + filtro Ver +
busca/setor/canal/aguardando + seções por setor) · thread (header,
timeline com notas/eventos/divisor, actions, cards de IA, composer) ·
aside (card de lead + etiquetas; escondido abaixo de `xl`).

## A. Lista de conversas (painel esquerdo)

**Merece (adicionar/ajustar)**

- [x] **A1. Badge de não-lido por row** (count + preview em bold).
      Baseline universal de inbox; depende do cursor do plano WAHA (§7 do
      spec de canal). Vem junto porque a mesma query alimenta.
- [x] **A2. Avatar do contato na row** (foto do WhatsApp; fallback
      iniciais). Depende do avatar pull (plano WAHA §6).
- [x] **A3. Indicador de espera** — "aguardando há 2h" na row quando
      `awaitingReply` (SLA-lite; hoje o filtro existe mas a row não mostra
      há quanto tempo).
- [x] **A4. Ícone de mídia no preview** — "🎤 áudio" / "📎 doc" quando a
      última mensagem é mídia (hoje `last_message_preview` já gera texto;
      só renderizar com ícone).

**Não merece (cortar)**

- [x] **A5. Cortar: nada estrutural** — a lista está enxuta e as regras
      de badge discriminante ("só mostra se distingue") estão certas.

## B. Thread + composer (painel central)

**Merece**

- [x] **B1. Busca dentro do thread** (E3) — campo discreto no header com
      highlight/jump; sem isso thread longa é ilegível.
- [x] **B2. Menu de contexto nativo** (botão direito) nas mensagens (E3)
      — estende o `MessageMenu` atual (hoje só via botão/hover).
- [x] **B3. Macros `/`** no composer (E3) — respostas rápidas **por org**;
      admin/manager criam direto em `/app/settings`; agente propõe e fica
      pendente até aprovação de manager/admin/owner (reusa staging de
      `agent_suggestions` + toast SSE — entra nas notificações).
- [x] **B4. Ação "Reenviar" em mensagem `failed`** — hoje a falha é
      silenciosa no thread; mercado sempre expõe retry. (Bosqueja o gap
      send-ok/write-fail do v1.)
- [x] **B5. Player de áudio com velocidade** (1×/1.5×/2×) + duração —
      padrão WhatsApp; hoje é `<audio controls>` cru.
- [x] **B6. Transcrição sob o player** quando `metadata.transcript`
      existir (vem do STT no plano WAHA).
- [x] **B7. Consumer do toggle `sendSeen`** — a preferência já existe em
      /app/account; ligar no comportamento de seen ao assumir.
- [x] **B8. Atalhos de ação** (assumir/resolver/adiar) — E3 já previa;
      `j`/`k` existem.

**Não merece (cortar/mover)**

- [x] **B9. Remover "Ensinar a IA" do thread** — `TeachAiDialog` sai
      inteiro: aprendizado é função do observer na conversa; o mecanismo
      `proposeMemoryEntry` permanece para o observer.
- [x] **B10. Manter meta do header como está** — a linha meta
      (`seq + data + assignee + setor`) já é compacta; não adicionar
      mais meta aqui (presença fica só no indicador).
- [x] **B11. Não adicionar emoji picker nativo de plataforma** além do
      atual — manter o grid simples (suficiente).

## C. Aside direito (ficha)

**Merece**

- [x] **C1. Ficha de contato real (E2)** — avatar, nome, telefone, e-mail,
      tags de contato, nota livre, edição inline estilo Google People
      (local, sem sync). O card "Etiquetas" **mergeia** na ficha.
- [x] **C2. Histórico do contato** — lista de tickets anteriores do mesmo
      contato (o `preceded_by` já modela isso; hoje só há o link "Ticket
      anterior" no thread). Market: timeline por pessoa (Sellio).
- [x] **C3. Toggle de painel** — aberto por padrão em `xl+`, botão "info"
      no header colapsa; em `<xl` abre como overlay/drawer. Padrão
      Chatwoot.
- [x] **C4. Card de deal** — manter; adicionar valor editável inline
      (E2). Sem mudança de conceito.

**Não merece**

- [x] **C5. Não mover IA para o aside** — Draft/Nudge ficam no fluxo do
      thread (está certo; não virar segunda coluna de notificações).
- [x] **C6. Não criar abas no aside** (ficha/deal/atividade separadas)
      — scroll único é mais simples no volume atual; abas só se o aside
      passar de ~3 cards.

## D. Transversal

- [x] **D1. Novo ticket "Novo atendimento"** já existe — manter.
- [x] **D2. Sem banner/badge duplicado de status** — status aparece 1×
      (header); não replicar no thread.
- [x] **D3. Mobile**: manter list↔thread; o aside vira sheet/drawer via
      C3 em vez de nunca existir.

## Fora de escopo (confirmado na entrevista)

SLA / tempo de primeira resposta, CSAT pós-atendimento, broadcast/
campanha, atribuição automática round-robin, fila por prioridade —
posteriores ao v1 ("produto omnichannel funcional primeiro"). IA não
cresce além do que já existe.
