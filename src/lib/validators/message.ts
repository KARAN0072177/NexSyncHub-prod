import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        type: z.enum(["image", "video", "file"]),
        name: z.string().optional(),
        size: z.number().optional(),
      })
    )
    .optional(),
  channelId: z.string(),
});