# Plan — Slice 7: telas PARCIAL/NOVO (Minha conta, Membros, Horário)

## Contexto

Último slice do ciclo de navegação (`docs/product/ia-navegacao.md` §8.7).
Três superfícies: `/app/account/{profile,security,preferences,notifications}`
(NOVO), `/app/settings/organization/members` (stub→real) e
`/app/settings/service/hours` (horário sem tela — `business_hours` já existe
no schema/service).

Decisões aprovadas pelo usuário:

- **Tema**: toggle real claro/escuro — cookie `bosun-theme` lido no root
  layout (`data-theme`), escuro default. Tokens light já existem.
- **Foto**: upload real — `/api/avatar` POST + chave user-scoped
  (`userAvatarKey` novo em `@crm/storage/keys.ts`; avatar é dado do usuário,
  não do tenant — exceção justificada à regra tenantObjectKey) e serve via
  `/api/avatar/[userId]` (GET, sessão requerida).
- **Convite**: completo + **link copiável sempre exibido** (não depende de
  e-mail de plataforma); `sendInvitationEmail` wired no plugin org (usa o
  `sendEmail` injetável já existente — falha de provider loga, não quebra
  o convite). Página pública `/accept-invitation/[id]` + `?next=` no
  sign-in/sign-up. Equipe opcional via coluna `team_id` nova em
  `organization_invitations`; no aceite o membro entra na equipe.
- **Prefs de usuário**: coluna `users.preferences` jsonb (zod-validada,
  merge-on-write) — sem tabela nova, sem RLS (mesmo padrão das tabelas auth;
  service só opera `session.user.id`, nunca do client).
- **Membros gate**: página = `member:create` OU `invitation:create`
  (§6: manager convida); item do hub segue §4 (`member:create`, manager
  não vê o grupo Organização). Papel convidado/atribuído nunca acima do
  próprio; owner não é removível nem rebaixável por não-owner.
- **Horário**: até 2 janelas/dia (schema permite 4 — UI enxuta),
  timezone somente-leitura com link p/ Geral (spec §6).
- **Notificações**: toggles que gateiam os 3 toasts reais do InboxLive
  (drafts, nudges, suggestions) — `prefs.toasts.{drafts,nudges,suggestions}`.

## Escopo

packages/db/src/schema/auth.ts
packages/db/migrations/**
packages/db/src/index.ts
packages/core/src/modules/organizations/**
packages/core/src/modules/users/**
packages/core/src/modules/teams/**
packages/core/src/index.ts
packages/core/package.json
packages/core/src/modules/messaging/repository.ts
packages/storage/src/keys.ts
packages/auth/src/auth.ts
apps/web/src/app/layout.tsx
apps/web/src/app/app/account/**
apps/web/src/app/app/settings/organization/members/**
apps/web/src/app/app/settings/service/hours/**
apps/web/src/app/app/layout.tsx
apps/web/src/app/accept-invitation/**
apps/web/src/app/sign-in/**
apps/web/src/app/sign-up/**
apps/web/src/app/api/avatar/**
apps/web/src/server/actions/account.ts
apps/web/src/server/actions/members.ts
apps/web/src/server/services.ts
apps/web/src/server/account.ts
apps/web/src/server/members.ts
apps/web/src/components/inbox-live.tsx
apps/web/messages/pt-BR.json
apps/web/e2e/account.spec.ts
apps/web/e2e/members.spec.ts
apps/web/e2e/settings.spec.ts

## Tasks

1. **DB+core**: `users.preferences` jsonb (+migration); `team_id` em
   `organization_invitations` (+migration); service `get/setUserPreferences`
   (escopo session); service `addTeamMemberById` se inexistente; exports.
2. **Minha conta**: `/app/account`→profile + tabs; Perfil (nome + foto
   upload via `/api/avatar`); Segurança (troca de senha + sessões
   listar/revogar); Preferências (tema cookie + sendSeen); Notificações
   (3 toggles de toast). Actions `account.ts` via `auth.api.*` c/ headers.
3. **Membros**: lista (nome/e-mail/papel) + convites pendentes (cancelar +
   copiar link) + dialog convite (e-mail, papel capado, equipe opcional) +
   menu do membro (mudar papel capado, remover — owner protegido).
   `sendInvitationEmail` no plugin; `/accept-invitation/[id]` público;
   `?next=` em sign-in/sign-up.
4. **Horário**: editor semanal (7 dias × toggle + até 2 janelas) +
   offHoursMessage (já existe) + timezone readonly→link Geral.
5. **i18n + e2e + gate** (`format:check`, typecheck, lint, testes focados,
   e2e specs novos) + verificação Chrome (tema claro!, convite→aceite→org,
   horário persiste, foto).

## Fora de escopo

Etiquetas/Campos (PREV), Plano e uso real (stub fica), email obrigatório
pra convite (link cobre), edição de idioma (escondido: só pt-BR),
sendSeen consumer no canal (a pref existe; o efeito chega com E3).
