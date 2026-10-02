# 0006: AI provider abstraction

Status: accepted

## Context

Agents must not be tied to OpenAI or Anthropic; tools need permissioning so a
prompted agent can't exceed the caller's rights.

## Decision

`@crm/ai` defines `ModelRef { provider, modelId }` and resolves it through the
AI SDK (`createOpenAI`/`createAnthropic`) — the only provider switch.
`AgentDefinition` carries required `permissions`; `defineAgentTool` attaches
`requiredPermissions` and `buildToolSet` filters tools by the caller's role.
Agents never receive a DB handle — tools call `@crm/core` services.

## Consequences

- Swapping/adding providers is a config change.
- Tool permissions are enforced before the model ever sees the tool.
- `knowledge`/`memory` are typed placeholders, intentionally unimplemented.

## Alternatives considered

- Per-provider agents: configuration drift — rejected.
- Agents with DB access: un-auditable privilege escalation — rejected.
