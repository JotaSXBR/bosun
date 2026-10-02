import type { TriggerConfig } from "@trigger.dev/core/v3";

export default {
  // Set TRIGGER_PROJECT_REF — create a project at cloud.trigger.dev (or a
  // self-hosted instance, see docker/trigger).
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_replace_me",
  dirs: ["./src/tasks"],
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10_000,
      factor: 2,
    },
  },
} satisfies TriggerConfig;
