# Arquitetura da informação e navegação

**Status:** aprovado pelo fundador em 2026-10-12. Fonte da verdade para menus, páginas, abas, configurações e fluxos.
**Precedência:** este documento substitui a tabela "Tabs" de `inbox.md` (abas do Atendimento) e o item de `/app/settings` do Slice 3 de `ux-7-leis.md`. Layout de desktop e formato de app: `layout-desktop-app.md`.
**Origem:** análise de IA registrada no artefato "CRMv2 – Arquitetura da Informação" (diagnóstico com 32 problemas na navegação geral e 21 na área de IA). Aqui fica só o que foi decidido.

Status de cada item: `IMPL` existe · `MOVE` existe em outro endereço · `PARCIAL` backend existe, tela não · `PREV` só previsto · `NOVO` tela nova decorrente desta decisão · `RES` reservado, fora da interface.

## 1. Princípios

1. **Quatro camadas, quatro portas.**
   - **Trabalho**: barra de módulos.
   - **Configurações da organização**: engrenagem no topo, hub agrupado por objeto.
   - **Minha conta**: preferências pessoais, no menu do avatar.
   - **Plataforma**: instância, só `platform_admin`, no menu do avatar.
2. **Uma configuração, um endereço.** Qualquer outro ponto de entrada é um atalho que abre a mesma tela, nunca um segundo formulário.
3. **Pontes contextuais.** Telas de trabalho podem ter "Configurar…" que leva ao hub e volta ao ponto de origem.
4. **Navegação ciente do papel.** Item que a pessoa nunca poderá usar não aparece. A validação continua no servidor.
5. **Só entra no menu o que existe.** Módulos previstos (Tarefas, Indicadores, Automações, Documentos) ficam fora da interface até haver tela.
6. **Tarefas semanais chegam por aviso** (Início e sino), sem depender de a pessoa lembrar onde ficam.
7. **Teto:** três níveis visíveis (porta, grupo, item); no máximo seis itens por grupo.

## 2. Vocabulário da interface

| Conceito                                           | Termo na UI                                    | Evitar                 |
| -------------------------------------------------- | ---------------------------------------------- | ---------------------- |
| Lista de trabalho de conversas                     | Atendimento                                    | Inbox                  |
| Um atendimento numerado                            | Conversa (item), ticket só em contexto técnico | —                      |
| Setor de atendimento                               | Equipe                                         | Setor (na UI)          |
| Card do funil                                      | Negócio                                        | Lead (na UI)           |
| Resposta pronta gerada pela IA na conversa         | **Rascunho**                                   | Sugestão               |
| Alerta de cliente esperando                        | **Aviso** ("Gerar rascunho")                   | Gerar sugestão         |
| Mudança proposta pelo observador ou por uma pessoa | **Proposta**; a fila se chama **Revisões**     | Sugestão               |
| Aprendizado interno da IA                          | **Memória**                                    | Segundo cérebro, canon |
| Conteúdo voltado ao cliente                        | **Conhecimento**                               | —                      |
| Status de agente                                   | em preparo · ativo · pausado                   | rascunho               |
| Módulo de IA                                       | **Inteligência**                               | IA, Assist             |

## 3. Árvore de navegação

```
Barra de módulos (AppTopBar + ModuleNav)
├─ Início ("Hoje")                         /app                                     IMPL, conteúdo muda
│    ├─ Esperando por você: Fila (n), Minhas (n)
│    ├─ Precisa de atenção: conexões com problema [integrations:manage]
│    ├─ Revisões de IA (n) e memórias para revisar (n) [ai:manage]
│    └─ Primeiros passos (checklist, enquanto incompleto)
│    (sai do Início: id do usuário, papel, auditoria crua → Configurações › Organização › Auditoria)
│
├─ Atendimento                             /app/inbox                               IMPL
│    ├─ Fila       ?view=queue               aba com contador
│    ├─ Minhas     ?view=mine                aba com contador
│    ├─ Adiados    ?view=snoozed             aba com contador
│    ├─ Fechadas   ?view=closed              aba com contador
│    ├─ Conversa   ?c=<id>                   painel direito: ticket, negócio, etiquetas; ficha do contato PREV (E2)
│    │    ├─ cartão Rascunho · Aviso; composer: Sugerir resposta · Melhorar resposta
│    │    └─ "Ensinar a IA"                  NOVO (ver 7.3)
│    └─ Filtro "Ver" (Select em pílula ao lado da busca; consulta, não aba; estilo Chatwoot)
│         ├─ Automático ?view=pending        PREV (intake ainda não grava pending)
│         └─ Todas      ?view=all            IMPL
│
├─ Contatos                                /app/contacts                            IMPL
│    └─ Ficha do contato  /app/contacts/<id> PREV (E2)
│
├─ Negócios                                /app/deals?funnel=                       IMPL
│    └─ atalho "Editar funil" → /app/settings/sales/funnels/<id>   [leads:manage]
│
├─ Inteligência                            /app/ai                                  NOVO  [ai:read]
│    ├─ Resumo (faixa no topo): chave ativa · modo do observador · última análise · pendências · gasto PREV
│    │    └─ sem chave: estado vazio "Cadastrar chave" → Configurações › Inteligência › Credenciais e uso
│    ├─ Revisões (n)       /app/ai/reviews   MOVE de /app/settings/ai/suggestions
│    │    ├─ filtro por tipo: Agente · Conhecimento · Memória; Histórico ?view=history
│    │    ├─ proposta legível: campo antes → depois, justificativa, quem propôs, conversa de origem
│    │    ├─ Aprovar · Rejeitar (motivo opcional)
│    │    └─ ação secundária: Analisar agora (diz qual conversa e onde o resultado aparece)
│    ├─ Conhecimento       /app/ai/knowledge MOVE de /app/settings/ai/knowledge
│    └─ Memória (n)        /app/ai/memory    MOVE de /app/settings/ai/brain
│         ├─ Para revisar (vencidas): Ainda vale · Arquivar
│         ├─ Ativas: filtro por tipo e escopo
│         └─ Propor memória [só admin e owner] → Revisões
│
└─ RES  Tarefas · Indicadores · Automações · Documentos

Ações do topo
├─ Buscar (⌘K): módulos, grupos de Configurações, Minha conta, ações
├─ Alertas (sino): revisões de IA, conexão com problema, atribuição      PARCIAL (hoje vazio)
├─ Configurações (engrenagem)              /app/settings   [owner, admin, manager]
│    ├─ Organização
│    │    ├─ Geral: nome, marca, idioma, fuso      /app/settings/organization/general   PARCIAL
│    │    ├─ Membros e convites                    /app/settings/organization/members   PARCIAL
│    │    ├─ Plano e uso                           /app/settings/organization/billing   PARCIAL
│    │    └─ Auditoria                             /app/settings/organization/audit     PARCIAL
│    ├─ Atendimento
│    │    ├─ Equipes                               /app/settings/service/teams          MOVE
│    │    ├─ Horário e mensagens                   /app/settings/service/hours          PARCIAL (horário sem tela)
│    │    └─ Regras de ticket (reabertura)         /app/settings/service/rules          MOVE
│    ├─ Canais                                     /app/settings/channels               MOVE de /app/integrations
│    │    └─ Detalhe da conexão: status, webhook, widget  /app/settings/channels/<id>
│    ├─ Negócios
│    │    ├─ Funis e etapas                        /app/settings/sales/funnels          MOVE (hoje na barra do quadro)
│    │    ├─ Etiquetas                             /app/settings/sales/labels           PREV
│    │    └─ Campos personalizados                 /app/settings/sales/fields           PREV
│    └─ Inteligência (técnico)
│         ├─ Agentes                               /app/settings/ai/agents              IMPL, muda
│         │    ├─ Rascunhador (sistema: pausa, não exclui)
│         │    ├─ Observador (sistema): modo e parâmetros [ai:manage]; prompt e modelo [só owner]   absorve /ai/observer
│         │    └─ Detalhe /app/settings/ai/agents/<id>: Identidade · Comportamento · Modelo · Avançado
│         └─ Credenciais e uso                     /app/settings/ai/credentials         IMPL, muda
│              ├─ chaves da organização em lista ordenada; editar; remover (menu + diálogo); testar PREV
│              ├─ reserva da plataforma (somente leitura, com a ordem escrita)
│              └─ uso do mês PREV
│
└─ Avatar (UserMenu)
     ├─ Minha conta                    /app/account/{profile,security,preferences,notifications}   NOVO
     ├─ Trocar de organização          só com mais de uma                                          PARCIAL
     ├─ Plataforma                     /app/platform/{email,billing,meta,ai}   [platform_admin]    MOVE
     │    (/app/setup continua como entrada guiada do mesmo grupo E-mail)
     └─ Sair
```

## 4. Visibilidade por papel

O servidor continua validando cada página. Esta tabela define só o que aparece.

| Porta                                   | owner | admin | manager  | agent |  viewer   | platform_admin |
| --------------------------------------- | :---: | :---: | :------: | :---: | :-------: | :------------: |
| Início, Atendimento, Contatos, Negócios |   ✓   |   ✓   |    ✓     |   ✓   | ✓ leitura |       ✓        |
| Inteligência (módulo)                   |   ✓   |   ✓   |    ✓     |   —   | ✓ leitura |       ✓        |
| Configurações (engrenagem)              |   ✓   |   ✓   | parcial¹ |   —   |     —     |       ✓        |
| Minha conta                             |   ✓   |   ✓   |    ✓     |   ✓   |     ✓     |       ✓        |
| Plataforma                              |       |       |          |       |           |       ✓        |

¹ `manager` vê Atendimento › Equipes, Canais, Negócios e Inteligência (técnico). Não vê Organização (Geral, Membros, Plano) nem Horário e Regras de ticket (`organization:update`).

## 5. Rotas: mapa e redirecionamentos

Manter todo deep link antigo funcionando (`ux-7-leis.md`, lei de Jakob).

| Hoje                                        | Novo                                                                                       | Tipo                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `/app/integrations`                         | `/app/settings/channels`                                                                   | Redireciona                                        |
| `/app/settings` (formulário da organização) | índice do hub; campos vão para `/organization/general`, `/service/hours`, `/service/rules` | Divide                                             |
| `/app/settings` (seção Plataforma)          | `/app/platform/*`                                                                          | Move                                               |
| `/app/settings/teams`                       | `/app/settings/service/teams`                                                              | Redireciona                                        |
| `/app/settings/ai/suggestions`              | `/app/ai/reviews`                                                                          | Redireciona                                        |
| `/app/settings/ai/knowledge`                | `/app/ai/knowledge`                                                                        | Redireciona                                        |
| `/app/settings/ai/brain`                    | `/app/ai/memory`                                                                           | Redireciona                                        |
| `/app/settings/ai/observer`                 | `/app/settings/ai/agents/<observador>`                                                     | Redireciona                                        |
| `/app/settings/ai`                          | `/app/settings/ai/agents`                                                                  | Redireciona                                        |
| `/app/inbox?view=pending`, `?view=all`      | iguais                                                                                     | Deixam de ser abas e viram valores do filtro "Ver" |
| `/app/inbox/[id]`                           | `?c=<id>`                                                                                  | Já redireciona                                     |

Também mudam: os `href` do checklist do Início (`connect_channel`, `create_team`, `create_funnel`), o destino do toast de nova proposta em `inbox-live.tsx` (`/app/ai/reviews`) e o mapa de `shouldRefreshForEvent` para as rotas novas.

## 6. Matriz de configurações

| Configuração                                                     | Escopo                      | Quem edita                                 | Caminho                                                                     |
| ---------------------------------------------------------------- | --------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| Nome, foto                                                       | usuário                     | a pessoa                                   | Avatar › Minha conta › Perfil                                               |
| Senha, sessões, redefinição                                      | usuário                     | a pessoa                                   | Avatar › Minha conta › Segurança                                            |
| Tema claro ou escuro; marcar mensagens como vistas (`sendSeen`)  | usuário                     | a pessoa                                   | Avatar › Minha conta › Preferências                                         |
| Preferências de aviso                                            | usuário                     | a pessoa                                   | Avatar › Minha conta › Notificações                                         |
| Nome, logo e tema da organização                                 | organização                 | owner, admin                               | Configurações › Organização › Geral                                         |
| Fuso horário                                                     | organização                 | owner, admin                               | Configurações › Organização › Geral (Horário só lê e linka)                 |
| Idioma                                                           | a decidir (pergunta 5)      | owner, admin                               | Esconder enquanto a UI for só pt-BR                                         |
| Membros, papéis, convites                                        | organização                 | owner, admin (`member:*`); manager convida | Configurações › Organização › Membros                                       |
| Plano, cobrança, armazenamento                                   | organização                 | owner altera; admin vê                     | Configurações › Organização › Plano e uso                                   |
| Auditoria                                                        | organização                 | leitura `audit:read`                       | Configurações › Organização › Auditoria                                     |
| Equipes e membros da equipe                                      | recurso (equipe)            | `teams:manage`                             | Configurações › Atendimento › Equipes                                       |
| Horário de atendimento + mensagem fora do horário                | organização                 | owner, admin                               | Configurações › Atendimento › Horário e mensagens                           |
| Janela de reabertura de ticket                                   | organização                 | owner, admin                               | Configurações › Atendimento › Regras de ticket                              |
| Conexões de canal, widget do site, webhook                       | recurso (conexão)           | `integrations:manage`                      | Configurações › Canais › (conexão)                                          |
| Funis, etapas, modelos de nicho                                  | recurso (funil)             | `leads:manage`                             | Configurações › Negócios › Funis e etapas                                   |
| Etiquetas, campos personalizados                                 | organização                 | `leads:manage`                             | Configurações › Negócios                                                    |
| Chaves de LLM, ordem, modelo padrão                              | organização                 | `ai:manage`                                | Configurações › Inteligência › Credenciais e uso                            |
| Modo do observador e parâmetros                                  | organização                 | `ai:manage`                                | Configurações › Inteligência › Agentes › Observador                         |
| Prompt e modelo do observador                                    | recurso (agente de sistema) | só owner                                   | Configurações › Inteligência › Agentes › Observador                         |
| Rascunhador e agentes: tom, regras, modelo, ferramentas, limites | recurso (agente)            | `ai:manage`                                | Configurações › Inteligência › Agentes › (agente)                           |
| Conhecimento: editar direto                                      | organização                 | `ai:manage`                                | Inteligência › Conhecimento                                                 |
| Conhecimento: propor                                             | organização                 | qualquer membro com `messaging:write`      | Atendimento › Conversa › Ensinar a IA; aprovação em Inteligência › Revisões |
| Memória: propor e aprovar                                        | organização                 | **só admin e owner** (e os agentes de IA)  | Inteligência › Memória                                                      |
| E-mail, Asaas, padrões Meta, chaves de IA da instância           | plataforma                  | `platform_admin`                           | Avatar › Plataforma                                                         |

Regras: quem depende de outra configuração mostra o valor e um link "Alterar"; o padrão da plataforma aparece como "usando padrão" na conexão; preferência pessoal nunca é salva no escopo da organização.

## 7. Permissões novas ou corrigidas

A matriz de `packages/permissions` não cobre estas decisões. A implementação precisa decidir a forma (nova ação ou checagem de papel) e cobrir com teste.

1. **Inteligência visível para `ai:read`**; o `agent` não tem e não vê o módulo.
2. **Propor conhecimento** concedido a quem tem `messaging:write` (inclui `agent`). A proposta entra como `agent_suggestions` alvo `knowledge`, pendente, e só `ai:manage` aprova.
3. **"Ensinar a IA"** na conversa: para `agent` e `manager`, abre a proposta de conhecimento com o trecho da conversa pré-preenchido; para admin e owner, oferece conhecimento ou memória.
4. **Memória restrita a owner e admin** para propor e aprovar, apesar de `manager` ter `ai:manage`. Quatro olhos continua (quem propôs não aprova, exceto o owner). `HIP`: aprovação também restrita a admin e owner.
5. **Agentes de sistema não são excluídos**, só pausados (hoje `agents-section.tsx` oferece "Excluir").
6. **Engrenagem** visível só para quem tem alguma permissão de gestão (`organization:update`, `teams:manage`, `integrations:manage`, `leads:manage`, `ai:manage`).
7. **Verificar:** em `integrations/page.tsx`, `canManage = isPlatformAdmin || role !== "agent"` inclui `viewer`, que só tem `integrations:read`. Trocar por `hasPermission`.

## 8. Fluxos principais

| Fluxo                     | Entrada                                                        | Etapas essenciais                                                               | Erros e permissões                                                                   |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Ativar a organização      | `/onboarding` → Início                                         | Nome da organização; checklist leva a Canais, Equipes, Funis e Atendimento      | E-mail da plataforma não configurado; checklist não cobra passos que o papel não faz |
| Conectar canal            | Checklist, Configurações › Canais, estado vazio do Atendimento | Nome → QR (WAHA) ou credenciais (Meta) ou snippet (site)                        | QR expirado, erro de conexão; gerir exige `integrations:manage`                      |
| Atender                   | Atendimento › Fila                                             | Assumir → responder → aguardando → resolver; adiar e transferir em "Mais ações" | `TICKET_ASSIGNED`, `TICKET_RESOLVED`, envio `failed`; viewer só lê                   |
| Conversa vira negócio     | Painel direito, "Virar lead"                                   | Funil e etapa → negócio no quadro                                               | Sem funil: ponte para Funis (`leads:manage`) ou texto pedindo ao gestor              |
| Ligar a Inteligência      | Módulo vazio, composer desabilitado                            | Cadastrar chave → modo do observador → ajustar rascunhador → testar             | Sem chave: observador desligado e o resumo diz isso                                  |
| Revisar propostas         | Sino, Início → Inteligência › Revisões                         | Filtrar, ler antes → depois, aprovar ou rejeitar com motivo                     | Proposta obsoleta; quatro olhos; decidir exige `ai:manage` (memória: admin e owner)  |
| Ensinar a IA              | Conversa                                                       | Selecionar trecho → propor conhecimento (ou memória, admin e owner)             | Proposta vai para Revisões; toast confirma                                           |
| Revisar memórias vencidas | Contador em Inteligência e Início                              | Ainda vale (renova 90 dias) ou Arquivar (diálogo)                               | admin e owner                                                                        |
| Remover a última chave    | Credenciais e uso                                              | Menu → diálogo de impacto                                                       | Avisa que observador e "Sugerir resposta" param                                      |
| Convidar pessoa           | Configurações › Organização › Membros                          | E-mail, papel, equipe opcional                                                  | E-mail da plataforma; papel acima do próprio bloqueado                               |
| Trocar de organização     | Avatar                                                         | Escolher organização; app recarrega com o papel dela                            | Rascunho não salvo                                                                   |

## 9. Fora de escopo deste ciclo

Ficha do contato (E2), macros e busca na conversa (E3), Tarefas, Indicadores, Automações, Documentos, modo tempo real do observador, triagem, agentes autônomos, copiloto, testar chave, uso de IA, Google, LGPD, importação de contatos, marca por organização. Todos já têm endereço reservado acima.

## 10. Perguntas em aberto (com resposta padrão)

| #   | Pergunta                                                 | Padrão até decisão                                                     |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `viewer` vê Configurações em leitura?                    | Não; vê Inteligência em leitura                                        |
| 2   | `manager` edita horário e regras de ticket?              | Não                                                                    |
| 3   | Horário de atendimento por organização, equipe ou canal? | Organização                                                            |
| 4   | Idioma pessoal ou da organização?                        | Esconder enquanto só houver pt-BR                                      |
| 5   | Editar etapas no quadro ou só no hub?                    | Hub, com atalho "Editar funil"                                         |
| 6   | Qual modelo vale, o da chave ou o do agente?             | Agente sobrescreve; padrão é o da chave                                |
| 7   | Chave da plataforma antes ou depois das da organização?  | Depois, como reserva                                                   |
| 8   | Motivo de rejeição alimenta a IA?                        | Registrado agora; alimentar depois                                     |
| 9   | Validade da memória configurável?                        | Fixa em 90 dias                                                        |
| 10  | Quais ferramentas listar no agente?                      | `brain_search`, `memory_propose`, `propose_knowledge`, `request_draft` |

## 11. Ordem sugerida de implementação

Um slice por PR, cada um passando pelo gate (`lint`, `typecheck`, `test`) e pelo checklist das 7 leis.

1. **Design system**: tokens de layout, `PageHeader` compacto com `back`, template `AppShell` (ver `layout-desktop-app.md`).
2. **Shell**: `ModuleNav` por papel (com Inteligência), engrenagem no topo, `UserMenu` com Minha conta, Trocar de organização e Plataforma; ⌘K ampliado.
3. **Hub de Configurações**: índice, grupos, rotas novas, redirecionamentos, Plataforma separada.
4. **Atendimento**: quatro abas, filtro "Ver", larguras por token, vocabulário Rascunho e Aviso.
5. **Inteligência**: módulo com Revisões legíveis, Conhecimento, Memória; Configurações › Inteligência com Agentes (observador unificado, detalhe em seções) e Credenciais ordenáveis; permissões da seção 7; "Ensinar a IA".
6. **Início "Hoje"** e sino com avisos reais.
7. **Telas novas `PARCIAL`/`NOVO`**: Minha conta, Membros e convites, Horário de atendimento.
