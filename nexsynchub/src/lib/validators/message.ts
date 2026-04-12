import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().optional(),
  channelId: z.string(),

  attachments: z.array(
    z.object({
      key: z.string(),
      type: z.enum(["image", "video", "file"]),
      name: z.string().optional(),
      size: z.number().optional(),
    })
  ).optional(),
}).refine(
  (data) => data.content || (data.attachments && data.attachments.length > 0),
  {
    message: "Message cannot be empty",
  }
);