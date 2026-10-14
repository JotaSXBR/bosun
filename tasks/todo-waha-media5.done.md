# TODO — waha-media5

- [x] 1. Adapter: presign http fetchável anonimamente + origin no erro de recusa — verify: `pnpm --filter @crm/channels test` ✅ 63/63
- [x] 2. `apps/web/src/lib/audio-peaks.ts` + teste da função pura — verify: `pnpm --filter web test` ✅ 25/25
- [x] 3. `AudioPlayer` com waveform (fill + seek click/drag/teclado) — verify: typecheck ✅
- [x] 4. `VoiceRecorder` decodifica o blob e passa `peaks` pro preview — verify: typecheck ✅
- [x] 5. Docs (`waha-setup.md`, `TODO.md`) ✅ + `pnpm verify` ✅ (216/216) + `test:integration` ✅ (296/296) + `build` ✅
- [ ] Re-smoke staging: figurinha renderiza; waveform no preview e na bolha; seek funciona
