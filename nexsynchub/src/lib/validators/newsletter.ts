import { z } from "zod";

export const newsletterSubscribeSchema =
  z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address"),
    source: z
      .enum([
        "public_site",
        "workspace",
        "admin_import",
        "api",
        "unknown",
      ])
      .default("public_site")
      .optional(),
    tags: z
      .array(
        z
          .string()
          .trim()
          .toLowerCase()
          .min(1)
          .max(40)
      )
      .max(10)
      .default([])
      .optional(),
  });

export const newsletterTokenSchema =
  z.object({
    token: z.string().min(32, "Invalid token"),
  });

export const newsletterStatusSchema =
  z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address"),
  });
