import type { TenantContext } from "@crm/core";
import type { PermissionCheck } from "@crm/permissions";
import { hasPermission } from "@crm/permissions";
import type { ToolSet } from "ai";
import { tool } from "ai";
import type { z } from "zod";

import type { AgentDefinition } from "./agent";

/**
 * A tool an agent may call. `execute` receives the TenantContext bound in a
 * closure — tools NEVER receive a database handle; they call @crm/core
 * services so tenant isolation and authorization stay enforced.
 */
export type AgentToolDefinition<Input = unknown, Output = unknown> = {
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  /** Permissions the caller's role must hold for this tool to be available. */
  requiredPermissions: PermissionCheck;
  execute: (ctx: TenantContext, input: Input) => Promise<Output>;
};

export function defineAgentTool<Input, Output>(
  definition: AgentToolDefinition<Input, Output>,
): AgentToolDefinition<Input, Output> {
  return definition;
}

/**
 * Type-erased tool stored in the registry. `input` is `never` so concrete
 * tools (whose execute takes a specific parsed input) remain assignable, and
 * the AI SDK re-validates inputs against the zod schema before execute runs.
 */
export type RegisteredAgentTool = {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  requiredPermissions: PermissionCheck;
  execute: (ctx: TenantContext, input: never) => Promise<unknown>;
};

export type AgentToolRegistry = Readonly<Record<string, RegisteredAgentTool>>;

/**
 * Builds the AI SDK toolset for an agent run: only tools the agent lists AND
 * the caller's role is allowed to use. Anything filtered out is invisible to
 * the model (it can't even name it).
 */
export function buildToolSet(
  ctx: TenantContext,
  registry: AgentToolRegistry,
  agent: AgentDefinition,
): ToolSet {
  const toolSet: ToolSet = {};
  for (const name of agent.tools) {
    const definition = registry[name];
    if (!definition) continue;
    if (!ctx.isPlatformAdmin && !hasPermission(ctx.role, definition.requiredPermissions)) {
      continue;
    }
    toolSet[name] = tool({
      description: definition.description,
      inputSchema: definition.inputSchema,
      execute: (input) => definition.execute(ctx, input as never),
    });
  }
  return toolSet;
}
