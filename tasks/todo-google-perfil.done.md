# Todo — Google Contacts: perfil do contato

Plano: `tasks/plan.md`.

## Task 1: Core — campos novos no perfil do contato

- [x] `updateContactProfileInput`: `company` (≤120), `jobTitle` (≤120),
      `address` (≤500), `birthday` (`""` ou `YYYY-MM-DD` válido), `urls`
      (lista de URLs `http`/`https`, máx. 5, cada ≤300)
- [x] `updateContactProfileRow` trata as chaves de forma genérica (valor
      vazio ou lista vazia apaga a chave; os demais mesclam no `metadata`)
- [x] Testes unitários do zod (`schemas.test.ts`) e de integração
      (`service.int.test.ts`: grava, atualiza e apaga cada campo)
- **Acceptance**: os cinco campos novos gravam e apagam; `javascript:`/
  `data:`, data inexistente e mais de 5 URLs são rejeitados; campos
  existentes (`email`, `phone`, `notes`) continuam iguais
- **Verify**: `pnpm --filter @crm/core test` · integração do módulo
  (`pnpm exec vitest run --config vitest.integration.config.ts packages/core/src/modules/contacts`)
- **Deps**: nenhuma · **Tamanho**: M

### Checkpoint: após a tarefa 1

- [x] `pnpm verify` e integração do módulo verdes · revisar com o humano

## Task 2: Ficha do inbox — campos novos

- [x] `ContactFicha` exibe e edita inline `company`, `jobTitle`, `address`,
      `birthday` e `urls` (uma por linha)
- [x] `updateContactProfileAction` revalida também `/app/contacts`
- [x] Textos pt-BR em `apps/web/messages/pt-BR.json`
- **Acceptance**: editar um campo na ficha persiste e reaparece após
  recarregar; esvaziar o campo o apaga; só quem tem `messaging:write` edita
- **Verify**: `pnpm typecheck` · `pnpm lint` · checagem com Playwright
  (`site-chat.spec.ts` abre uma conversa com ficha; se não der, cobrir pelo
  e2e da tarefa 3 e registrar)
- **Deps**: 1 · **Tamanho**: M

## Task 3: Dialog "Editar contato" em `/app/contacts`

- [x] `contact-edit-dialog.tsx` com todos os campos (nome, e-mail, telefone
      extra, empresa, cargo, endereço, aniversário, sites, notas)
- [x] Botão "Editar" por linha (só com `messaging:write`) abrindo o dialog
      com os valores atuais
- [x] e2e em `contacts.spec.ts`: criar contato, editar, reabrir e ver os
      valores; URL inválida mostra erro
- **Acceptance**: salvar atualiza a lista e o dialog reabre com os dados;
  erro de validação aparece em toast sem fechar o dialog
- **Verify**: `pnpm --filter @crm/web exec playwright test e2e/contacts.spec.ts --reporter=line`
  (dev server próprio) · `pnpm verify`
- **Deps**: 1 · **Tamanho**: M

### Checkpoint: final

- [x] `pnpm verify:full` verde · critérios de pronto do plan marcados ·
      review (`/review`)
