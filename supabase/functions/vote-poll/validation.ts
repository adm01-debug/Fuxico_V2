import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const votePollSchema = z.object({
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
  voter_email: z.string().email().optional(),
  voter_ip: z.string().ip().optional(),
});

export type VotePollRequest = z.infer<typeof votePollSchema>;

export function validateVotePoll(data: unknown) {
  return votePollSchema.safeParse(data);
}
