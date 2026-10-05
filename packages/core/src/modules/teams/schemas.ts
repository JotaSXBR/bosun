import { z } from "zod";

export const createTeamInput = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().trim().min(1).max(32).optional(),
});
export type CreateTeamInput = z.input<typeof createTeamInput>;

export const updateTeamInput = z.object({
  teamId: z.uuid(),
  name: z.string().trim().min(1).max(100).optional(),
  color: z.string().trim().min(1).max(32).nullish(),
});
export type UpdateTeamInput = z.input<typeof updateTeamInput>;

export const teamMemberInput = z.object({
  teamId: z.uuid(),
  userId: z.uuid(),
});
export type TeamMemberInput = z.input<typeof teamMemberInput>;
