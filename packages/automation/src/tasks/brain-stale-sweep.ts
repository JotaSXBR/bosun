import { sweepStaleBrainEntries } from "@crm/core/brain";
import { getDb } from "@crm/db";
import { createLogger } from "@crm/observability";
import { z } from "zod";

const logger = createLogger({ bindings: { component: "brain-stale-sweep" } });

/** Global sweep — no tenant payload; the handler is platform-scoped. */
export const brainStaleSweepPayload = z.object({}).strict();
export type BrainStaleSweepPayload = z.infer<typeof brainStaleSweepPayload>;

/**
 * Daily second-brain sweep — canon `memory_entries` past `stale_after`
 * become `stale` and surface in the settings stale queue for a human to
 * renew or archive. Freshness is never decided by the system alone: the
 * sweep only flags, humans decide.
 */
export async function brainStaleSweepHandler(payload: unknown): Promise<{ marked: number }> {
  brainStaleSweepPayload.parse(payload);
  const marked = await sweepStaleBrainEntries(getDb());
  if (marked > 0) logger.info("brain stale sweep", { marked });
  return { marked };
}
