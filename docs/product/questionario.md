# Questionário de produto — CRM

> **Respondido 2026-10-03 e consolidado** em `docs/product/{vision,
domain-model, rules, ai-agents, roadmap}.md` + `docs/adr/0014`.
> Este arquivo é o registro bruto; a fonte de verdade são os docs acima.

Preencha este arquivo no seu ritmo, direto aqui embaixo de cada pergunta.
Responda em texto corrido — não precisa ser formal nem completo.

**Regras do jogo:**

- "Não sei ainda" é uma resposta válida. Nesses casos eu proponho um
  default e registro como _decisão provisória_ (revisável depois).
- Prefira a resposta mais simples que representa o que você imagina.
  Detalhes de edge case a gente descobre construindo.
- Quando terminar (mesmo parcial), me avise e eu transformo as respostas
  em `docs/product/*.md` — spec de domínio, glossário e regras de negócio
  que passam a ser fonte de verdade junto com `docs/architecture/`.

---

## Bloco 0 — Visão (contexto rápido)

**0.1** Quem é o cliente típico do SaaS? (tipo de empresa, tamanho, setor)

> Profissionais Liberais/Informais, Empresas do ramo de serviços, vendas, suporte, atendimento.

**0.2** Qual problema ele resolve com a plataforma, em uma frase?

> Ganha tempo na gestão de atendimentos e leads, automatizando tarefas repetitivas e centralizando informações, permitindo que o atendente se concentre em resolver problemas e fechar negócios, aumentando a produtividade e a satisfação do cliente.

**0.3** Existe algum produto que você olha e pensa "quero algo assim, mas ___"?

> selliq.io, synthor.cloud, fazer.ai agents, helena crm.

---

## Bloco 1 — Modelo de negócio (o mais importante)

### 1.1 Multi-atendimento

**a)** A conversa pertence a quem? Marque o modelo:

- [ ] Um agente (responsável)
- [ ] Uma fila/setor (ex.: vendas, suporte, financeiro)
- [x] Fila + agente responsável dentro dela
- [ ] Outro: ___

>

**b)** Como uma conversa nova é atribuída?

- [x] Manual (alguém pega da fila)
- [ ] Round-robin automático entre agentes online
- [ ] Por regras (ex.: WhatsApp 1 → vendas, WhatsApp 2 → suporte)
- [ ] Não sei ainda
- [ ] Outro: ___

>

**c)** Quais status de atendimento você imagina? (ex.: aguardando / em
atendimento / resolvido / aguardando cliente)

> Fila (por ordem de a mais tempo esperando aguardando), Aguardando atendimento (time responsável), Em atendimento (agente responsável), Aguardando cliente (agente responsável), Resolvido (time responsável)

### 1.2 AI agents

**a)** No v1, o que o agente de IA faz? Marque todos que valem:

- [ ] Responde sozinho ao cliente (autônomo)
- [x] Sugere rascunho para o agente humano aprovar
- [x] Faz triagem/qualificação e roteia para humano
- [x] Resume conversas
- [ ] Outro: ___

> Sugere em nota privada para o agente humano aprovar e usar como base para resposta ao cliente, com atalho de responder com o texto sugerido, ou editar e responder com o texto editado, ou recusar e continuar a conversa. Verifica qual setor a conversa deve ser roteada e atribui o atendimento ao setor responsável. Resume conversas para memória do agente com aquele cliente.

**b)** Quando a IA deve passar para um humano? (ex.: palavras-chave,
pedido explícito, falha na resposta, sempre que não souber)

> palavras-chave, pedido explícito, falha na resposta, sempre que não souber.

**c)** É um agente por empresa ou vários com especialidades? (ex.: agente
comercial, agente de suporte, agente de agendamento)

> Vários com especialidades.

### 1.3 Leads e funil

**a)** Conversa nova vira lead automaticamente? Ou o agente decide?

> Agente decide. Como pode ser um profissional liberal, normalmente atuando sozinho, pode haver conversas que não são leads, como por exemplo, clientes que já compraram e estão apenas conversando com o profissional ou até mesmo amigos e familiares.

**b)** O funil de vendas é kanban com etapas? As etapas são fixas ou cada
empresa customiza? Quantos funis por empresa?

> Kanban com etapas. As etapas podem ser customizadas por empresa. Uma empresa pode ter vários funis. Funis e etapas são customizáveis por agente de IA. Exemplo de etapas predefinidas por ramos de atuação pré-configuradas.

**c)** O lead precisa de campos customizáveis por empresa (ex.: "valor
estimado", "origem", campos do nicho) ou campos fixos bastam no início?

> Vamos sincronizar campos do lead com o Google People API e/ou Google Contacts as informacoes mais relevantes para o nicho da empresa. Outros campos podem ser customizados por lead e armazenados na memoria do programa para uso interno.

### 1.4 Conexões e canais

**a)** Quantas conexões WhatsApp por empresa é o caso típico?

- [ ] Uma
- [x] Algumas (2–5, por departamento/unidade)
- [ ] Muitas (por vendedor/agente)
- [ ] Não sei ainda

> _sua resposta_

**b)** Além de WhatsApp, quais canais entram cedo? (Instagram, Facebook,
Telegram, e-mail, chat do site)

> Instagram, faceboook, email, chat do site

### 1.5 White-label

Até onde vai o white-label? Marque todos que valem:

- [x] Logo + nome da empresa
- [x] Cores/tema por empresa
- [x] Domínio customizado (crm.cliente.com.br)
- [x] Empresa pode revender com a marca dela
- [ ] Não é prioridade agora
- [ ] Outro: ___

> _sua resposta_

### 1.6 Billing

**a)** Como você cobra? (por seat/agente, por conexão WhatsApp, plano flat
com limites, tiers de funcionalidade...)

> Plano flat sem limites, apenas de disco vai ser cobrado por GB após espaço free (500MB) e chave de API de LLM fornecida pelo cliente.

**b)** Tem trial gratuito? Quanto tempo? Bloqueia ou degrada no fim?

> Sim, trial gratuito de 7 dias.

### 1.7 Campanhas e automação

**a)** Disparo em massa (broadcast WhatsApp) entra no v1? Lembrete: Meta
oficial exige templates aprovados + cobra por mensagem; WAHA (não-oficial)
é mais livre mas com risco de ban.

> Não entra no v1.

**b)** Que automações você imagina? (ex.: tag automática, mover no funil
quando X acontecer, resposta automática fora do horário)

> tool - consultar_cep - (Consulta endereço completo via BrasilAPI: https://brasilapi.com.br/api/cep/v2/{cep})
> tool - handoff_to_human - (Transfere a conversa para atendente humano, opcionalmente com resumo)
> tool - private_note - (Cria nota interna visível só para a equipe, não para o cliente)
> tool - set_custom_attribute - (Define atributo personalizado na conversa, contato ou card)
> tool - set_labels - (Adiciona/remove etiquetas na conversa, contato ou card)
> tool - resolve_conversation - (Marca a conversa como resolvida)
> tool - kanban_move_card - (Move card do funil para outra etapa)
> tool - kanban_update_card - (Atualiza card do funil)
> tool - kanban_create_card - (Cria card do funil)
> tool - update_kanban_task - (Atualiza título, descrição, prioridade ou datas do card)
> tool - set_voice_preference - (Registra preferência do cliente por áudio ou texto)
> tool - update_contact - (Atualiza dados do contato: nome, e-mail, cidade etc.)
> tool - react_to_message - (Reage à última mensagem do cliente com emoji)
> tool - send_image - (Envia imagem ao cliente a partir de URL permitida)
> tool - open_case_in_inbox - (Abre o caso em outra caixa/inbox com notas de ligação)
> tool - skip_reply - (Decide não responder e deixa a conversa aberta para a equipe)
> tool - calculator - (Avalia expressões aritméticas com precisão)
> tool - get_current_time - (Retorna data e hora atuais no fuso do agente)
> tool - google_calendar_find_slots - (Consulta horários livres na agenda Google)
> tool - google_calendar_create_event - (Cria evento na agenda com link de reunião)
> tool - gmail_send - (Envia e-mail pela conta conectada)
> tool - move_deal_stage - (Move o negócio/card para outra etapa do funil)
> tool - handoff_to_human - (Transfere a conversa para atendente humano)
> tool - create_lead - (Cria novo lead no CRM)
> tool - send_link - (Envia link ao cliente)
> tool - inventory_lookup - (Consulta preço, estoque ou produto no catálogo real)
> tool - faq_lookup - (Busca resposta oficial em base de perguntas frequentes)
> tool - knowledge_base - (Consulta documentos/manuais anexados da empresa)
> tool - custom_tool - (Ferramenta personalizada configurável pelo usuário)

Entre outras funcionalidades. Só listei tools, falta memoria rag, observer, memoria de conversa, entre outras. Estou aberto a responder sobre qualquer outra funcionalidade para finalizar o produto.
---

## Bloco 2 — Referências de produto e layout

**2.1** Liste 2–4 produtos que você quer imitar (total ou parcialmente).
Ex.: Chatwoot, Kommo, Intercom, Huggy, Zenvia, RD Station, Pipedrive,
Notion, Linear.

| Produto                                                                                                                                                                                                                                                                                                                          | O que imitar dele (ex.: inbox, kanban, simplicidade) |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| selliq.io                                                                                                                                                                                                                                                                                                                        | Passo 01                                             |
| Onboarding guiado, do zero ao agente pronto                                                                                                                                                                                                                                                                                      |
| Você não começa sozinho na tela em branco. Onboarding guiado pra desenhar seu agente: tom, script, regras de negócio, base de conhecimento, tabela de preço. A gente entrega infraestrutura e inteligência. Você entra com o contexto da sua operação. Acompanhamento humano dedicado disponível mediante consulta de condições. |

Passo 02
Observa em modo passivo (opcional)
Pode ligar a plataforma com a IA desativada. Seu time atende como sempre e a Selliq monitora em segundo plano: tempo de resposta, score do time, agenda, follow-up, relatório por lead. Você captura valor antes mesmo de confiar uma conversa à IA.

Passo 03
Ativa com o multi-agente já calibrado
Quando decidir, liga. Ela já estudou seu time no monitoramento e entra com o DNA do seu negócio, nada genérica. SDR, agendamento, follow-up, closer e CS, cada um na função certa, com revisores supervisionando agentes e humanos.

Passo 04
Melhora contínua por feedback real
Marcou uma resposta como ruim? Explica o contexto e pronto. A IA internaliza na hora, pra todos os atendimentos seguintes. Sem prompt, sem deploy, sem ticket. Resultado: uma IA mais robusta a cada semana, calibrada na sua operação real, e não na config inicial congelada que o mercado vende como "treinamento". Pontuação do lead. E do seu time também.
A maioria dos sistemas mede a IA, mas a Selliq mede os dois lados da conversa.

Multi-agente de verdade. Pra operação comercial de verdade.
99% das plataformas que se dizem "com IA" rodam um agente único com prompt inflado tentando dar conta de qualificar, agendar, remarcar, fazer follow-up e atender CS no mesmo lugar. Falha mesmo, não tem como dar certo.

Selliq tem classificador de intenção na entrada e agentes especializados por função. Cada agente faz uma coisa, faz bem, e tem agente revisor supervisionando o trabalho dele e do seu time humano.

✓
Agente de qualificação, agendamento, remarcação, follow-up, lembrete, closer, CS
✓
Agentes revisores supervisionam agentes e humanos
✓
Hand-off automático pra humano quando complexidade exige
✓
Você não configura fluxo. Já vem orquestrado.

Follow-up Inteligente
O lead que sumiu volta a ser trabalhado. Sem você lembrar, sem ninguém digitar.
Follow-up é o que mais separa operação que vende de operação que vaza. A maioria do mercado depende da memória do SDR, ou de planilha, ou de lembrete no celular do dono, e por isso esquece. A Selliq não.

Você desenha cadências, tom da mensagem, canal e horário. Quando o lead para de responder, a Selliq dispara no momento certo, no canal certo, com a mensagem certa pra aquele contexto, 100% personalizada. E quando o lead responde, a cadência para sozinha.

→
Mensagem adaptada ao contexto, não template robotizado
→
Para automaticamente quando o lead volta a interagir
→
Número dedicado pra envio, protege seu principal de ban
→
Rastreamento completo: o que saiu, pra quem, quando, com qual resultado

Agendamento Inteligente
Agenda lotada sem depender da memória da recepção.
Lead chegou, qualificou, está pronto pra agendar. A Selliq agenda direto com quem está disponível no time, distribui horários de forma justa entre vendedores, e ainda manda lembrete antes do compromisso pra reduzir no-show.

O lead não precisa esperar a recepcionista responder, não precisa entrar em fila de WhatsApp, não precisa ligar. Agenda direto pelo WhatsApp, e o sistema confirma. Pronto.

→
Rodízio automático entre o time, sem favoritismo nem conflito
→
Página pública de agendamento pro lead reservar sozinho
→
Catálogo de serviços com duração e janelas de disponibilidade
→
Integração com Google Calendar, sem duplicidade
→
Lembrete automático antes do compromisso pra reduzir no-show
→
Cada agendamento já chega vinculado ao perfil do lead

|
| Synthor.cloud | Gosto do layot da inbox, da coluna lateral direita com os dados do lead. pode ser que tenha funcionalidades interessantes de prospecção |
| fazer.ai agents | Integraçoes com plataformas. Bases de conhecimento Quando ativado, o agente pode propor novas entradas na base de conhecimento para sua aprovação. Nada é adicionado sem revisão.
Disponibilidade
Quando o agente está ativo e respondendo. Fora desse horário ele fica em silêncio, avisa o operador por nota privada e, se você ligar a opção abaixo, avisa o cliente também.
Agrupamento de mensagens (debounce)
Espera o cliente parar de digitar e responde tudo de uma vez, em vez de balão por balão.
Transcrição de voz (áudio)
Transcreve os áudios do cliente para o agente ler e responder.
Leitura de imagens e documentos
Extrai o conteúdo de imagens e PDFs que o cliente envia para que o agente possa lê-los.
Respostas em áudio (text-to-speech)
Opcionalmente responde com mensagem de áudio.
Resposta em várias mensagens
Divide respostas longas em mensagens menores, com uma pausa de digitação entre elas (parece mais humano).
Assinatura
Uma linha que você escreve uma vez e entra nas mensagens do agente. Pedida no prompt, ela sai diferente a cada vez e nunca sai numa transferência.
Dados no contexto
Esta seleção define quais valores atuais dos atributos do Chatwoot o agente recebe sempre que responde.
Escolha apenas os dados necessários para o atendimento. O agente usa esses valores para saber o que já foi coletado e o que ainda falta.
Sem a ferramenta "Definir atributo", o agente consegue ler esses valores, mas não alterá-los.
Quando um agente humano responde
Esta opção usa a resposta de uma pessoa como sinal para assumir o atendimento.
Memoria - tem que ter teto de tokens configurável
A memória reúne os atendimentos deste contato neste canal para o agente usar nas próximas conversas.
Quando um atendimento termina, o agente troca as mensagens por um resumo do que importa, como dados do contato, acordos e pendências. O atendimento atual permanece completo.
A redação exata se perde, então desligue se o agente precisar citar conversas antigas. Cada atendimento encerrado gera um resumo, inclusive os conduzidos pela equipe, mas isso acontece depois da resposta ao cliente.
Limite de execucao de tools configurável
Mensagens proativas
Política de follow-up
Janela de 24h do WhatsApp - Ativar para respeitar a política do WhatsApp
guardrails - entrada e saida - filtros de toxicidade, abuso, spam, mençao a concorrentes, aderencia as instrucoes do agente, responder com template, nao responder, responsta do agente de guardrails, transferir para time, politicas personalizadas, concorrentes.
Trilha de auditoria
Cada mudança de configuração, quem fez e por qual porta se autenticou. Os valores são gravados no momento da mudança e nunca relidos do registro atual.
Logs
Fluxo de execução passo a passo de cada turno do agente: transcrição, geração, áudio, entrega e transferências.
Teto de gasto
Para de gastar quando o mês corrente atinge um orçamento em dólares, como o Langfuse precifica as chamadas do mês. As conversas com clientes e o playground são contados separadamente, então testar nunca silencia o agente para os clientes.
Orçamentos, propostas e recibos que seus agentes emitem e anexam à resposta.
Servidores MCP externos que seus agentes podem usar.
Cofre - Chaves de API e tokens que seus agentes e integrações usam.
Mensagem fora do horário
Estamos fora do horário de atendimento. Voltamos {proximo_atendimento}.

Enviada uma vez ao dia por conversa; use {proximo_atendimento} para mostrar a próxima abertura. |

**2.2** Tem screenshots de telas de referência? Se sim, cole na pasta
`docs/product/referencias/` (crie a pasta) e liste aqui qual tela é cada
arquivo:

> nao vou fazer isso, prefiro entregar um design system e depois definir junto com agente, ou fornecer no momento oportuno quando questionado telas de referencia

**2.3** Idioma da UI: PT-BR, inglês, ou multi-idioma desde o início?

> PT-BR de inicio, possibilidade de ser multi-idioma desde o inicio

**2.4** Estilo visual: mais denso/funcional (tipo Intercom/Zendesk) ou
mais limpo/minimalista (tipo Linear/Notion)?

> LImpo, tenho design system preparado para fornecer

---

## Bloco 3 — Regras operacionais

**3.1** Papéis — hoje existem owner / admin / manager / agent. Precisa de
mais algum? Exemplos: agente que só vê a fila X, atendente financeiro,
viewer somente-leitura, supervisor que escuta conversas.

> owner, admin, manager, agent, viewer

**3.2** O que acontece quando chega mensagem e não tem agente disponível
(horário, fila vazia)? Opções: fica na fila, resposta automática, bot
assume, notifica alguém.

> 1 resposta automatica informando proxima disponibilidade. Agente responde no retorno apenas.

**3.3** Horário de atendimento da empresa existe como conceito? (afeta
resposta automática, roteamento, SLA)

> Horario de atendimento personalizavel.

**3.4** Tem algo sobre **compliance/limites** que eu deva saber? (ex.:
LGPD — dados de clientes, retenção de mensagens, exportar/excluir dados
do contato a pedido)

> Usar LGPD e normas brasileiras de proteção de dados.

---

## Bloco 4 — Escopo do esqueleto

**4.1** Concorda com esta definição de "esqueleto pronto"?

> Uma mensagem WhatsApp real entra via webhook → aparece na inbox em
> tempo real → um agente assume/responde → a resposta sai pelo canal →
> a conversa pode virar lead no funil → a empresa vê sua assinatura/
> billing básico.

- [x] Sim, esse é o marco
- [ ] Quero ajustar: ___

> Parece correto, mas acho que depois de todas as informacoes aqui presentes vai querer fazer nova rodada de perguntas.

**4.2** Tem alguma funcionalidade "faz ou quebra" que precisa estar nesse
esqueleto e não está na lista acima?

> por enquanto nao.

---

## Espaço livre

Qualquer coisa que não coube acima — ideias, medos, restrições,
funcionalidade dos sonhos, o que NÃO fazer:

> A dos sonhos é ter skills e mcp que configuram tudo automaticamente. do servidor ao onboarding. e tambem o modo monitoramento que vai sugerindo configuracoes com o agente desligado e vai configurando o sistema baseado no que os humanos conversam nos leads.
