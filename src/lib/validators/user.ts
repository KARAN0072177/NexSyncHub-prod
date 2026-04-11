import { z } from "zod";

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20)
    .regex(/^[a-z0-9._]+$/, "Only lowercase letters, numbers, . and _ allowed"),
});