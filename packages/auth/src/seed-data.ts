// Demo dataset for seed-content.ts — pure data, no logic. The Demo org
// pretends to SELL BOSUN through its own channels: prospects ask about
// pricing, WhatsApp integration, multi-tenancy and the trial.

export const DEMO_CONTACTS = [
  {
    key: "marina",
    channelUserId: "5511912340001@c.us",
    displayName: "Marina Souza · Padaria Broma",
  },
  { key: "carlos", channelUserId: "5511912340002@c.us", displayName: "Carlos Tech · CT Telecom" },
  {
    key: "fernanda",
    channelUserId: "5511912340003@c.us",
    displayName: "Fernanda Lima · Studio Flor",
  },
  {
    key: "ricardo",
    channelUserId: "5511912340004@c.us",
    displayName: "Ricardo Alves · Grupo Vetor",
  },
  {
    key: "juliana",
    channelUserId: "5511912340005@c.us",
    displayName: "Juliana Prado · JP Imóveis",
  },
  { key: "paulo", channelUserId: "5511912340006@c.us", displayName: "Paulo Reis · Academia Move" },
  { key: "ana", channelUserId: "5511912340007@c.us", displayName: "Ana Beatriz · AnaDoces" },
  { key: "beto", channelUserId: "5511912340008@c.us", displayName: "Beto Campos · Motos Beto" },
  { key: "luisa", channelUserId: "5511912340009@c.us", displayName: "Luísa Ferraz · LF Contábil" },
  {
    key: "tiago",
    channelUserId: "5511912340010@c.us",
    displayName: "Tiago Nunes · Nunes Advocacia",
  },
] as const;

export const WIDGET_VISITORS = [
  { key: "larissa", email: "larissa@vivafit.com.br", displayName: "Larissa Melo · VivaFit" },
  { key: "diego", email: "diego@ortoclin.com.br", displayName: "Diego Ramos · Ortoclin" },
] as const;

export type ThreadSpec = {
  contactKey: string;
  externalSuffix: string;
  conn: "waha" | "site";
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  sector?: "vendas" | "suporte";
  assigneeRole?: "agent" | "manager" | "owner";
  labels?: Array<"Prioridade" | "Recorrente">;
  snoozedUntil?: Date;
  precededByKey?: string;
  msgs: Array<{
    dir: "inbound" | "outbound";
    text: string;
    daysAgo: number;
    hour?: number;
    status?: "received" | "sent" | "delivered" | "read";
    private?: boolean;
    authorRole?: "agent" | "manager" | "owner";
  }>;
};

export const THREADS: ThreadSpec[] = [
  {
    contactKey: "marina",
    externalSuffix: "marina",
    conn: "waha",
    status: "waiting_customer",
    sector: "vendas",
    assigneeRole: "agent",
    labels: ["Recorrente"],
    msgs: [
      {
        dir: "inbound",
        text: "Oi! Vi o Bosun no Instagram. Vocês têm plano para padaria pequena? Somos 3 pessoas no atendimento.",
        daysAgo: 2,
        hour: 9,
      },
      {
        dir: "outbound",
        text: "Oi Marina! Sim — o plano Starter cobre até 5 atendentes com WhatsApp e funil inclusos. Posso te mandar a tabela de preços?",
        daysAgo: 2,
        hour: 9,
        status: "read",
        authorRole: "agent",
      },
      { dir: "inbound", text: "Pode sim! E o site chat entra nesse plano?", daysAgo: 2, hour: 10 },
      {
        dir: "outbound",
        text: "Entra! Widget do site já vem no Starter sem custo extra. A tabela: Starter R$149/mês, Pro R$299/mês com IA e automações.",
        daysAgo: 2,
        hour: 10,
        status: "read",
        authorRole: "agent",
      },
      {
        dir: "outbound",
        text: "Cliente pediu 15 min pra pensar — aguardar retorno amanhã cedo.",
        daysAgo: 2,
        hour: 10,
        status: "sent",
        private: true,
        authorRole: "agent",
      },
      {
        dir: "inbound",
        text: "Vou conversar com meu sócio e te retorno amanhã, tá?",
        daysAgo: 2,
        hour: 11,
      },
    ],
  },
  {
    contactKey: "carlos",
    externalSuffix: "carlos",
    conn: "waha",
    status: "in_progress",
    sector: "vendas",
    assigneeRole: "agent",
    labels: ["Prioridade"],
    msgs: [
      {
        dir: "inbound",
        text: "Bom dia! A integração com WhatsApp do Bosun é via QR code ou API oficial da Meta?",
        daysAgo: 1,
        hour: 8,
      },
      {
        dir: "outbound",
        text: "Bom dia Carlos! As duas: WAHA (QR, não oficial) para começar rápido e Meta Cloud API oficial para escala. Você pluga as duas ao mesmo tempo se quiser.",
        daysAgo: 1,
        hour: 8,
        status: "read",
        authorRole: "agent",
      },
      {
        dir: "inbound",
        text: "Ótimo. E dá pra ter 2 números conectados? Um comercial e um de suporte.",
        daysAgo: 1,
        hour: 9,
      },
      {
        dir: "outbound",
        text: "Dá sim — cada conexão vira um canal separado e você roteia por setor: comercial → time Vendas, suporte → time Suporte.",
        daysAgo: 1,
        hour: 9,
        status: "delivered",
        authorRole: "agent",
      },
      {
        dir: "inbound",
        text: "Show. Quero agendar uma demo quinta de manhã, tem como?",
        daysAgo: 1,
        hour: 9,
      },
    ],
  },
  {
    contactKey: "fernanda",
    externalSuffix: "fernanda",
    conn: "waha",
    status: "open",
    msgs: [
      {
        dir: "inbound",
        text: "Olá! O trial de 14 dias precisa de cartão de crédito?",
        daysAgo: 0,
        hour: 11,
      },
    ],
  },
  {
    contactKey: "ricardo",
    externalSuffix: "ricardo",
    conn: "waha",
    status: "in_progress",
    sector: "vendas",
    assigneeRole: "manager",
    labels: ["Prioridade"],
    msgs: [
      {
        dir: "inbound",
        text: "Temos 3 unidades. O Bosun separa os dados de cada filial? Preciso de isolamento real entre franquias.",
        daysAgo: 3,
        hour: 14,
      },
      {
        dir: "outbound",
        text: "Oi Ricardo! Separa sim — multi-tenant com isolamento por organization no Postgres (RLS em todas as tabelas). Cada franquia pode ser uma organização ou um setor dentro da mesma org, depende do seu modelo.",
        daysAgo: 3,
        hour: 14,
        status: "read",
        authorRole: "manager",
      },
      {
        dir: "inbound",
        text: "E relatórios? Consigo ver funil por unidade?",
        daysAgo: 3,
        hour: 15,
      },
      {
        dir: "outbound",
        text: "Funis são por organização — se cada unidade for uma org, cada uma tem seu pipeline. Se for um grupo só, dá pra segmentar por setor e labels.",
        daysAgo: 3,
        hour: 15,
        status: "read",
        authorRole: "manager",
      },
      {
        dir: "inbound",
        text: "Faz sentido. Manda a proposta Enterprise pra 3 unidades?",
        daysAgo: 2,
        hour: 8,
      },
    ],
  },
  {
    contactKey: "juliana",
    externalSuffix: "juliana",
    conn: "waha",
    status: "waiting_customer",
    sector: "vendas",
    assigneeRole: "owner",
    labels: ["Recorrente"],
    msgs: [
      {
        dir: "inbound",
        text: "Oi! Passando pra lembrar da proposta do plano Pro anual. Tem desconto no anual?",
        daysAgo: 1,
        hour: 16,
      },
      {
        dir: "outbound",
        text: "Oi Ju! Tem sim — anual fica 2 meses grátis (R$2990/ano no Pro). Te mando o link de checkout?",
        daysAgo: 1,
        hour: 16,
        status: "read",
        authorRole: "owner",
      },
      { dir: "inbound", text: "Manda! Vou apresentar pra diretoria sexta.", daysAgo: 1, hour: 17 },
    ],
  },
  {
    contactKey: "paulo",
    externalSuffix: "paulo",
    conn: "waha",
    status: "resolved",
    sector: "suporte",
    assigneeRole: "agent",
    msgs: [
      {
        dir: "inbound",
        text: "Conectei o WhatsApp mas as mensagens não estão chegando na inbox 😕",
        daysAgo: 5,
        hour: 10,
      },
      {
        dir: "outbound",
        text: "Oi Paulo! Vamos verificar: sua sessão WAHA aparece como 'conectado' em Configurações → Canais? Se sim, me diz se o webhook responde 200.",
        daysAgo: 5,
        hour: 10,
        status: "read",
        authorRole: "agent",
      },
      {
        dir: "inbound",
        text: "Era isso! O webhook estava com a URL antiga. Ajustei e já chegou tudo. Obrigado!",
        daysAgo: 5,
        hour: 11,
      },
      {
        dir: "outbound",
        text: "Perfeito! Qualquer coisa chama. Vou resolver o ticket por aqui 🙌",
        daysAgo: 5,
        hour: 11,
        status: "read",
        authorRole: "agent",
      },
    ],
  },
  {
    contactKey: "ana",
    externalSuffix: "ana-1",
    conn: "waha",
    status: "closed",
    sector: "suporte",
    assigneeRole: "agent",
    msgs: [
      {
        dir: "inbound",
        text: "Como faço pra adicionar uma nova pessoa na minha conta?",
        daysAgo: 12,
        hour: 15,
      },
      {
        dir: "outbound",
        text: "Oi Ana! Configurações → Membros → Convidar — você manda o convite por e-mail e escolhe o papel (owner/admin/manager/agent/viewer).",
        daysAgo: 12,
        hour: 15,
        status: "read",
        authorRole: "agent",
      },
      { dir: "inbound", text: "Achei! Obrigada 🙏", daysAgo: 12, hour: 16 },
    ],
  },
  {
    contactKey: "ana",
    externalSuffix: "ana-2",
    conn: "waha",
    status: "open",
    sector: "suporte",
    assigneeRole: "agent",
    precededByKey: "ana-1",
    msgs: [
      {
        dir: "inbound",
        text: "Oi, sou eu de novo! Agora o site chat parou de mostrar o histórico do visitante, é normal?",
        daysAgo: 0,
        hour: 13,
      },
    ],
  },
  {
    contactKey: "beto",
    externalSuffix: "beto",
    conn: "waha",
    status: "open",
    snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    msgs: [
      {
        dir: "inbound",
        text: "O Bosun emite nota fiscal? Preciso pra contabilidade.",
        daysAgo: 1,
        hour: 19,
      },
      {
        dir: "outbound",
        text: "Boa pergunta, Beto — vou confirmar com o financeiro e te retorno. Deixo o ticket adiado até amanhã.",
        daysAgo: 1,
        hour: 19,
        status: "delivered",
        authorRole: "agent",
      },
    ],
  },
  {
    contactKey: "larissa",
    externalSuffix: "larissa",
    conn: "site",
    status: "open",
    sector: "vendas",
    msgs: [
      {
        dir: "inbound",
        text: "Oi! Estou no site de vocês. O widget que estou usando agora já é o Bosun?",
        daysAgo: 0,
        hour: 10,
      },
      {
        dir: "outbound",
        text: "É sim, Larissa! Esse chat é o site chat do próprio Bosun — o mesmo que você instalaria no seu site com um snippet.",
        daysAgo: 0,
        hour: 10,
        status: "delivered",
        authorRole: "agent",
      },
      {
        dir: "inbound",
        text: "Que legal! E o visitante precisa criar conta pra conversar?",
        daysAgo: 0,
        hour: 10,
      },
    ],
  },
  {
    contactKey: "diego",
    externalSuffix: "diego",
    conn: "site",
    status: "open",
    msgs: [
      {
        dir: "inbound",
        text: "Boa tarde, vocês têm API pública pra integrar o Bosun com meu ERP?",
        daysAgo: 1,
        hour: 15,
      },
    ],
  },
  {
    contactKey: "luisa",
    externalSuffix: "luisa",
    conn: "waha",
    status: "resolved",
    sector: "vendas",
    assigneeRole: "agent",
    msgs: [
      {
        dir: "inbound",
        text: "O Bosun tem IA que responde sozinha? Quero algo que qualifique o lead antes de passar pro humano.",
        daysAgo: 4,
        hour: 9,
      },
      {
        dir: "outbound",
        text: "Tem sim — no Pro você configura agentes com prompt, regras de negócio e base de conhecimento. Ele sugere ou responde conforme a sua política.",
        daysAgo: 4,
        hour: 9,
        status: "read",
        authorRole: "agent",
      },
      {
        dir: "inbound",
        text: "E eu controlo quando ele fala? Não quero robô falando com cliente VIP.",
        daysAgo: 4,
        hour: 10,
      },
      {
        dir: "outbound",
        text: "Total — modo sugestão: o humano aprova cada resposta. E você limita por horário, setor e até por contato.",
        daysAgo: 4,
        hour: 10,
        status: "read",
        authorRole: "agent",
      },
      {
        dir: "inbound",
        text: "Perfeito, era o que eu precisava ouvir. Vou assinar o trial hoje!",
        daysAgo: 4,
        hour: 10,
      },
    ],
  },
  {
    contactKey: "tiago",
    externalSuffix: "tiago",
    conn: "waha",
    status: "open",
    msgs: [
      {
        dir: "inbound",
        text: "Os dados dos meus clientes ficam no Brasil? LGPD é crítico pro escritório.",
        daysAgo: 0,
        hour: 8,
      },
    ],
  },
];

export const DEMO_DEALS = [
  {
    title: "Bosun Starter · Padaria Broma",
    contactKey: "marina",
    stage: "Qualificação",
    valueCents: 14900,
    position: 0,
    conv: "marina",
  },
  {
    title: "Bosun Pro · CT Telecom (2 números)",
    contactKey: "carlos",
    stage: "Proposta",
    valueCents: 29900,
    position: 0,
    labels: ["Prioridade"],
    conv: "carlos",
  },
  {
    title: "Bosun Starter · Studio Flor",
    contactKey: "fernanda",
    stage: "Prospecção",
    valueCents: 14900,
    position: 0,
  },
  {
    title: "Bosun Enterprise · Grupo Vetor (3 un.)",
    contactKey: "ricardo",
    stage: "Proposta",
    valueCents: 89700,
    position: 1,
    labels: ["Prioridade"],
    conv: "ricardo",
  },
  {
    title: "Bosun Pro anual · JP Imóveis",
    contactKey: "juliana",
    stage: "Em execução",
    valueCents: 299000,
    position: 0,
    labels: ["Recorrente"],
    conv: "juliana",
  },
  {
    title: "Bosun Starter · Academia Move",
    contactKey: "paulo",
    stage: "Concluído",
    valueCents: 14900,
    position: 0,
    conv: "paulo",
  },
  {
    title: "Bosun Pro · AnaDoces",
    contactKey: "ana",
    stage: "Em execução",
    valueCents: 29900,
    position: 1,
  },
  {
    title: "Bosun Starter · LF Contábil",
    contactKey: "luisa",
    stage: "Qualificação",
    valueCents: 14900,
    position: 1,
  },
] as const;

export const DEMO_AGENTS = [
  {
    name: "SDR Bosun",
    specialty: "Qualificação de leads inbound",
    status: "active",
    systemPrompt:
      "Você é o SDR do Bosun. Qualifique o prospect: porte da empresa, canal principal (WhatsApp/site), volume de atendimentos e dor atual. Responda em pt-BR, frases curtas, tom consultivo. Nunca prometa desconto — encaminhe pro humano.",
    businessRules:
      "Planos: Starter R$149/mês (até 5 atendentes), Pro R$299/mês (IA + automações), Enterprise sob consulta. Trial 14 dias sem cartão.",
    signatureLine: "Equipe Bosun",
  },
  {
    name: "Suporte N1",
    specialty: "Dúvidas de configuração e canais",
    status: "draft",
    systemPrompt:
      "Você é o suporte N1 do Bosun. Ajude com conexão de canais (WAHA, Meta Cloud, site chat), convites de membros e permissões. Escale para humano quando envolver cobrança ou dado sensível.",
  },
] as const;

export const DEMO_KNOWLEDGE = [
  {
    title: "Planos e preços do Bosun",
    content:
      "Starter — R$149/mês: até 5 atendentes, WhatsApp + site chat, funil de vendas. Pro — R$299/mês: tudo do Starter + agentes de IA, automações e integrações ilimitadas. Enterprise — sob consulta: multi-unidade, SLA e onboarding dedicado. Anual: 2 meses grátis.",
  },
  {
    title: "Trial de 14 dias",
    content:
      "Todo plano tem 14 dias grátis sem cartão de crédito. Ao final do trial, os dados ficam preservados por 30 dias — basta assinar para continuar de onde parou.",
  },
  {
    title: "Integração WhatsApp",
    content:
      "O Bosun conecta WhatsApp por WAHA (QR code, ideal para começar) ou Meta Cloud API (oficial, para escala). Várias conexões coexistem e podem ser roteadas por setor.",
  },
  {
    title: "Isolamento de dados (multi-tenant)",
    content:
      "Cada organização tem isolamento de dados em camada de aplicação + Row Level Security no Postgres. Membros só veem a org ativa; admins de plataforma não veem conteúdo de conversas.",
  },
] as const;

export const DEMO_MEMORY = [
  {
    type: "faq_gap",
    content:
      "Prospects perguntam recorrentemente sobre NF-e — hoje não emitimos nota fiscal; resposta padrão é encaminhar ao financeiro.",
    confidence: "medium",
    staleAfterDays: 90,
  },
  {
    type: "persona",
    content:
      "Leads pequenos (1-5 pessoas) perguntam primeiro de preço e depois de trial; responder nessa ordem converte melhor.",
    confidence: "high",
    staleAfterDays: 120,
  },
] as const;

export const DEMO_USAGE = [
  {
    callKind: "observer_scan",
    provider: "openrouter",
    model: "openai/gpt-5-mini",
    tokensIn: 4200,
    tokensOut: 640,
    latencyMs: 3100,
    daysAgo: 1,
  },
  {
    callKind: "reply_suggestion",
    provider: "openrouter",
    model: "openai/gpt-5-mini",
    tokensIn: 1800,
    tokensOut: 220,
    latencyMs: 1400,
    daysAgo: 1,
  },
  {
    callKind: "reply_suggestion",
    provider: "openrouter",
    model: "openai/gpt-5-mini",
    tokensIn: 1650,
    tokensOut: 190,
    latencyMs: 1250,
    daysAgo: 2,
  },
  {
    callKind: "observer_scan",
    provider: "openrouter",
    model: "openai/gpt-5-mini",
    tokensIn: 3900,
    tokensOut: 700,
    latencyMs: 2900,
    daysAgo: 3,
  },
  {
    callKind: "draft_review",
    provider: "openrouter",
    model: "openai/gpt-5-mini",
    tokensIn: 2100,
    tokensOut: 310,
    latencyMs: 1600,
    daysAgo: 4,
  },
  {
    callKind: "reply_suggestion",
    provider: "openrouter",
    model: "openai/gpt-5-mini",
    tokensIn: 1500,
    tokensOut: 0,
    latencyMs: 800,
    status: "error",
    daysAgo: 5,
  },
] as const;
