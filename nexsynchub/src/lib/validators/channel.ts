import { z } from "zod";

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, "Channel name too short")
    .max(30, "Channel name too long"),
  workspaceId: z.string(),
});