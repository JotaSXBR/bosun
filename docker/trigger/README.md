# Trigger.dev self-hosting (optional, heavy)

Local development should use **Trigger Cloud** (`pnpm jobs:dev` +
`TRIGGER_SECRET_KEY`/`TRIGGER_PROJECT_REF` in `.env`). Self-hosting is for
production-like environments only — it needs ~6GB+ RAM and is not part of
`docker/compose.yml`.

## Usage

```bash
pnpm infra:trigger:up    # clones trigger.dev v4.7.2 into .trigger-selfhost/,
                         # generates secrets, starts webapp + worker
pnpm infra:trigger:down
docker/trigger/selfhost.sh logs
```

After it is up, point the app at it:

```env
TRIGGER_API_URL=https://<your-trigger-host>
TRIGGER_SECRET_KEY=<from the self-hosted dashboard>
TRIGGER_PROJECT_REF=<project ref>
```

`.trigger-selfhost/` is gitignored. To upgrade, remove the directory and
re-run `up` after bumping `TRIGGER_VERSION` in `selfhost.sh`.
