import type { PermissionCheck } from "@crm/permissions";

import type { ModelRef } from "./model";

/**
 * Declarative agent definition. `knowledge`/`memory` are typed placeholders —
 * not implemented yet, present so the contract doesn't churn later.
 * `permissions` is the check the CALLER (user ctx) must pass to run the agent.
 */
export type AgentDefinition = {
  id: string;
  name: string;
  instructions: string;
  model: ModelRef;
  /** Names of tools from the registry the agent may use. */
  tools: string[];
  knowledge: { knowledgeBaseIds: string[] };
  memory: { strategy: "none" | "conversation" };
  guardrails: { maxSteps: number; maxOutputTokens?: number };
  permissions: PermissionCheck;
};
