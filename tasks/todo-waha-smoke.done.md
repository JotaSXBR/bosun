# Todo — Smoke WAHA staging (ver tasks/plan.md)

- [x] **1. fetchMedia re-root** — `waha.ts`: URL absoluta com origem
      diferente e `pathname` começando em `/api/files/` → busca em
      `${baseUrl}${pathname}${search}`; relativo continua igual; outra
      origem sem `/api/files/` continua lançando.
      _Verify_: `pnpm --filter @crm/channels test` — casos novos:
      `http://localhost:3000/api/files/x.webp` → chamada em
      `https://waha.example.com/api/files/x.webp` com `X-Api-Key`;
      `http://169.254.169.254/meta` segue recusado sem chamada.
- [x] **2. next.config** — `Permissions-Policy` com `microphone=(self)`;
      `experimental.serverActions.bodySizeLimit` e
      `experimental.proxyClientMaxBodySize` = `"65mb"`.
      _Verify_: `pnpm typecheck` + `pnpm build`.
- [x] **3. Composer/gravador resilientes** — `sendFile` e `send` do
      gravador: rejeição da action → toast `uploadFailed` + reset do
      estado; arquivo > `MAX_UPLOAD_BYTES` → toast `uploadTooLarge` sem
      chamar a action (input já é limpo após a escolha).
      _Verify_: `pnpm --filter @crm/web typecheck` + lint.
- [x] **4. Gate + docs** — `pnpm verify` ✅ (202 unit), `pnpm build` ✅;
      `waha-setup.md` (trap do `media.url` com host do WAHA), `TODO.md`.
      Re-smoke em staging **pende deploy**.
