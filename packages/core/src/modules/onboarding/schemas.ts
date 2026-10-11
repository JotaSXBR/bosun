import { z } from "zod";

/**
 * Ordered activation steps for the "Primeiros passos" card. `org_created`
 * is written at organization creation, so the checklist starts endowed at
 * 1/5 (goal-gradient research, docs/product/ux-7-leis.md).
 */
export const ONBOARDING_STEP_IDS = [
  "org_created",
  "connect_channel",
  "create_team",
  "create_funnel",
  "first_conversation",
] as const;

export const onboardingStepId = z.enum(ONBOARDING_STEP_IDS);
export type OnboardingStepId = z.infer<typeof onboardingStepId>;
