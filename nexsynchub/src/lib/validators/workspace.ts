import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name too short")
    .max(50, "Workspace name too long"),
    isPrivate: z.boolean().optional(),
});