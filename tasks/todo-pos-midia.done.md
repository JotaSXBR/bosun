# TODO — pendências pós-mídia (vitest isolate + unsupportedMedia auto-reply)

- [x] 1. `vitest.config.ts` → `isolate: false` — verify: `pnpm test`
      verde sem poluição entre arquivos
- [x] 2. Migration `unsupported_media_message text` nullable em
      `organization_settings` — verify: `pnpm db:generate` + SQL revisado
- [x] 3. `unsupportedMediaMessage` em `updateOrgSettingsInput` /
      `upsertSettings` + leitura — verify: `pnpm --filter @crm/core test`
- [x] 4. `maybeSendUnsupportedMediaReply` (template org, flag na msg,
      dedup 1×/ticket, send de sistema) — verify: unit + int tests
- [x] 5. Wire no `process-channel-event` — verify: typecheck +
      `pnpm --filter @crm/automation test`
- [x] 6. Textarea em `/app/settings/service/hours` + i18n pt-BR —
      verify: typecheck + lint
- [x] 7. TODO.md: fechar notas (sendVoice/avatarUrl ✅, unsupportedMedia
      entregue, vitest) — verify: `pnpm verify` + `test:integration` + `build`
- [x] 8. Marker content no retry (offhours + unsupported-media): update
      de sucesso grava `content` com o texto corrente — verify: int tests
      asserem o template atualizado
- [x] 9. Precedência off-hours: `process-channel-event` só chama
      `maybeSendUnsupportedMediaReply` quando `!offHours.sent` — verify:
      unit test novo (3 casos)
- [x] 10. Vitest nos pacotes: `vitest.unit.shared.ts` + stub
      `vitest.config.ts` por pacote (CI `turbo run test`) — verify:
      `turbo run test` verde
