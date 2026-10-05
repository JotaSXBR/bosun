# Deployment — Coolify

Server-side setup for the pipeline in `docs/development/cicd.md`. Staging
and production run on the same VPS (4 CPU / 10 GB RAM / 100 GB disk) — the
machine only pulls images; all building happens in GitHub Actions.

Coolify host: `https://panel.fluxie.com.br` (v4.3.23), single server
`localhost` (`zto0f9qx9d6opovqflr26doe`), Traefik proxy, Let's Encrypt.

Day-to-day operations go through the **Coolify MCP server**
(`https://panel.fluxie.com.br/mcp`, streamable HTTP, bearer token — see
`.devin/mcp_config.json`; the token lives in gitignored
`.devin/mcp_config.local.json` / `COOLIFY_API_TOKEN`). Provisioning used the
REST API (`/api/v1`) — both are documented below.

## Topologia provisionada (recursos nativos)

Two Coolify **projects**, each fully self-contained — every component is a
first-class resource (databases as databases, apps as apps; no umbrella
compose service):

|                 | Bosun Staging                    | Bosun Production              |
| --------------- | -------------------------------- | ----------------------------- |
| Project uuid    | `uhzldqwk1lm8hcba5cf5i5jt`       | `mv3wx7apoqknqzh2ofxmopko`    |
| App uuid        | `7ucigdua3sehorx48uzp1n8s`       | `zayevyus07vncxnl8hebcqur`    |
| Image           | `ghcr.io/jotasxbr/bosun:staging` | `ghcr.io/jotasxbr/bosun:prod` |
| Domain          | `bosun-staging.fluxie.com.br`    | `bosun.fluxie.com.br`         |
| Postgres uuid   | `qt9tftpk1udowzrd1lcd6hwi`       | `ohpx6ijwqc9lsypzksgy5fsq`    |
| Redis uuid      | `j3xzmbrz9hjlun3aq3xx6z9x`       | `x5ei3m5cqbbdpqqu5gb3kggc`    |
| RustFS app uuid | `6ys66aabetrnugqh39xppaka`       | `k2rkhxnht7ikm8opltcv5qk0`    |
| WAHA app uuid   | `24maeacc6kwkl7gkxe0box4c`       | `dfvibxdrdvwpwbkibqmr1voc`    |

| Recurso  | Tipo Coolify        | Imagem                                | Notas                                                            |
| -------- | ------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| postgres | Database (nativo)   | `pgvector/pgvector:0.8.7-pg18-trixie` | DB `bosun`, volume persistido, **não público**                   |
| redis    | Database (nativo)   | `redis:8-alpine`                      | senha gerada pelo Coolify                                        |
| rustfs   | Application (image) | `rustfs/rustfs:1.0.0`                 | volume `/data`, alias `bosun-<env>-rustfs`                       |
| waha     | Application (image) | `devlikeapro/waha:gows`               | volumes `/app/.sessions`+`/app/.media`, alias `bosun-<env>-waha` |
| bosun    | Application (image) | `ghcr.io/jotasxbr/bosun:<tag>`        | porta 3000, health `/api/health`                                 |

### pgvector + Postgres 18 no resource nativo

O resource de banco funciona com pgvector — o único ajuste é obrigatório:
imagens Postgres ≥18 mudaram `PGDATA` para `/var/lib/postgresql/18/docker`
enquanto o volume do Coolify monta `/var/lib/postgresql/data`. Sem o fix o
container entra em crash-loop. Solução (idempotente, já aplicada):

```
POST /databases/{uuid}/envs  { "key": "PGDATA", "value": "/var/lib/postgresql/data" }
```

Vantagens do resource nativo sobre o compose antigo: backups agendados do
Coolify passam a valer, healthcheck próprio, e cada componente aparece
separado no painel (pedido explícito do mantenedor).

### Rede interna

Todos os recursos dividem a rede `coolify`. O DNS interno é o `uuid` do
recurso (databases) ou o `custom_network_aliases` (apps). Aliases
configurados: `bosun-staging-rustfs` / `bosun-prod-rustfs` e
`bosun-staging-waha` / `bosun-prod-waha` — legíveis e sem colisão entre
ambientes na rede compartilhada.

## Bootstrap do banco (roles + migrações)

Sem passo manual. `docker/web/migrate.mjs` (entrypoint) provisiona a role
da aplicação **antes** de migrar:

1. Lê usuário+senha de `DATABASE_URL` (`crm_app`), executa
   `CREATE ROLE ... NOSUPERUSER NOBYPASSRLS` se não existir + grants —
   usando `DATABASE_ADMIN_URL` (owner).
2. Roda as migrações Drizzle (que incluem os grants por tabela + RLS).

Isso replica `docker/postgres/init/01-app-role.sh` para qualquer Postgres —
incluindo os gerenciados (RDS etc.) no futuro. `GRANT CONNECT/USAGE` roda a
cada boot (idempotente, barato).

## Variáveis de ambiente (app bosun)

Setadas via `POST /applications/{uuid}/envs`:

- Core: `NODE_ENV`, `APP_URL`, `DATABASE_URL` (crm_app),
  `DATABASE_ADMIN_URL` (postgres), `BETTER_AUTH_SECRET`,
  `CHANNEL_CREDENTIALS_KEY`, `LOG_LEVEL`
- DB hosts: `postgres://…@<postgres-uuid>:5432/bosun`
- Redis: `REDIS_URL` → `redis://default:<pw>@<redis-uuid>:6379/0`
- S3: `STORAGE_S3_ENDPOINT` → `http://bosun-<env>-rustfs:9000`,
  `STORAGE_S3_REGION`, `STORAGE_S3_BUCKET=bosun`, keys, `FORCE_PATH_STYLE`
- WAHA: `WAHA_BASE_URL` → `http://bosun-<env>-waha:3000`, `WAHA_API_KEY`,
  `WAHA_WEBHOOK_HMAC_KEY`
- `EMAIL_PROVIDER=console` até termos provedor real
- Não setados (no-op seguro por `isConfigured`): `TRIGGER_*`, `SENTRY_*`,
  `OTEL_*`, `META_*`, `ASAAS_*`, `OPENAI/ANTHROPIC_API_KEY`

> **`CHANNEL_CREDENTIALS_KEY` precisa ser 64 hex chars** (32 bytes) —
> `getServerEnv()` valida via Zod e **lança exceção** se qualquer env for
> inválida. Como `/api/health` engole o erro → retorna 503 → o deploy
> inteiro vira `unhealthy` e faz rollback. Gerar:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

> **Nunca duplicar env vars** — o `POST /envs` cria nova linha em vez de
> atualizar quando a chamada repete a mesma key; duplicatas dividem
> migrate/app entre hosts diferentes. Para alterar um valor: `PATCH
/applications/{uuid}/envs` com `{key, value}` (atualiza a existente).

### Healthcheck do app

Configurado via `PATCH /applications/{uuid}`:

- `health_check_host`: **`127.0.0.1`** (não `localhost` — BusyBox `wget`
  resolve `localhost`→`::1` e o server escuta só IPv4 `0.0.0.0`)
- `health_check_path`: `/api/health`, `health_check_method`: `GET`
- `health_check_start_period`: **120** (migrate + Next start no VPS
  compartilhado passa de 60s)
- A imagem runner inclui `curl` (o check gerado pelo Coolify usa
  `curl -fsS ... || wget -qO- ...`)

WAHA recebe `REDIS_URL` apontando para o redis do mesmo ambiente (jobs/apps
do WAHA), `WHATSAPP_DEFAULT_ENGINE=GOWS`, `WAHA_API_KEY`,
dashboard/swagger ligados com credenciais próprias — **sem FQDN** (rede
interna apenas; abrir via proxy do Coolify se precisar da UI).

RustFS recebe `RUSTFS_ACCESS_KEY`/`SECRET_KEY`, `RUSTFS_ADDRESS=:9000`,
`RUSTFS_VOLUMES=/data`, console desabilitado por padrão. Bucket `bosun`
permanece **privado** — sem `anonymous` grants.

Secrets reais vivem **só** no Coolify + `.env` local (gitignored) —
`.coolify-secrets.tmp` local guarda os gerados nesta sessão; migrar para
cofre adequado quando existir (ver roadmap).

## GHCR — pull da imagem privada

A imagem é privada; o servidor precisa de auth para `docker pull`.
**Não existe endpoint de registries na 4.3.23** (`POST
/servers/{uuid}/registries` só existe em versões mais novas — 404 aqui).

Caminho oficial (Coolify docs, "authenticate Docker as the server user"):

1. Coolify UI → **Terminal** (sidebar) → server `localhost`
2. `docker login ghcr.io -u JotaSXBR` → colar o PAT `read:packages`

Isso escreve `/root/.docker/config.json` no host — arquivo que o
coolify-helper monta em todo deploy (verificado no deployment log:
`-v /root/.docker/config.json:/root/.docker/config.json:ro`). One-time por
servidor; cobre staging + prod.

> As chaves mostradas em **Settings → Private Keys** são SSH/deploy keys —
> servem para o Coolify acessar servidores e repositórios git, **não** para
> registry de imagens. Registry auth é o `docker login` acima.

## GitHub side (feito)

- `COOLIFY_DEPLOY_TOKEN` (escopo `deploy`, 51 chars — cuidado com texto
  colado no fim ao copiar) → secret `COOLIFY_TOKEN` no repo.
- Webhooks `.../api/v1/deploy?uuid=<app-uuid>` → secrets
  `COOLIFY_WEBHOOK_STAGING` / `COOLIFY_WEBHOOK_PRODUCTION`.
- `POST /deploy?uuid=<app>&force=false` dispara pull+up; health check:
  `GET /api/health`.

## Notas operacionais

- **MCP**: `get_logs` (resource+uuid), `list_unhealthy_resources`,
  `list_deployments`, `control` (start/stop/restart). Logs de container
  `exited` não são retornados — use `list_deployments` → `get_deployment`
  para o log do deploy.
- **WAHA**: sessões persistem em `/app/.sessions` (volume próprio); Redis é
  para jobs/apps, não session storage.
- **Rollback**: `workflow_dispatch` retagga `:prod` no GHCR (ver `cicd.md`).
- **Sem worker** — enqueue é no-op sem `TRIGGER_*`; decisão pendente:
  pg-boss escolhido sobre BullMQ (enqueue transacional com a escrita no PG),
  migração vira fase de roadmap com ADR próprio.
- **Upgrade do Coolify** (futuro): versões ≥4.4 trazem API/UI de registries
  (`/servers/{uuid}/registries`) — aí o `docker login` vira automável.
- **Sintoma → causa real** (aprendido no bring-up): `https://<domínio>`
  respondendo `404` + cert `TRAEFIK DEFAULT CERT` **não** é problema de
  proxy — é consequência de todo deploy falhar o healthcheck e fazer
  rollback (container removido → labels Traefik somem → router some).
  Investigue o healthcheck do app **antes** de mexer no Traefik: um deploy
  healthy recria o router sozinho. O cert LE real aparece logo depois.
- **503 persistente em `/api/health`**: quase sempre env inválida
  (`getServerEnv` joga; a rota engole → `db:"error"`). Validar o env com o
  schema de `packages/config` antes de suspeitar de banco/rede.
