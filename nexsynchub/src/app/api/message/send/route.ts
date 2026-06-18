import { after, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { connectDB } from "@/lib/db";
import { createNotification } from "@/lib/notification";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";
import { sendMessageSchema } from "@/lib/validators/message";

import Message from "@/models/Message";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import "@/models/Workspace";
import "@/models/User";

type MessageAttachment = {
  key?: string;
  url?: string;
  type?: string;
  name?: string;
  size?: number;
  [key: string]: unknown;
};

type PlainMessage = {
  _id: unknown;
  attachments?: MessageAttachment[];
  sender?: {
    username?: string;
    email?: string;
    avatar?: string;
  };
  [key: string]: unknown;
};

type MentionedMember = {
  user?: {
    _id?: unknown;
    username?: string;
  } | null;
};

type MentionedRecipient = {
  user: {
    _id: unknown;
    username: string;
  };
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const extractMentionedUsernames = (content: string) => {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g) || [];

  return [...new Set(matches.map((mention) => mention.slice(1).toLowerCase()))];
};

const createMessagePreview = (content: string) => {
  const compact = content.replace(/\s+/g, " ").trim();

  if (compact.length <= 90) return compact;

  return `${compact.slice(0, 87)}...`;
};

async function emitSocketEvent(body: unknown) {
  if (!process.env.SOCKET_SERVER_URL) return;

  await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await requireAuth();
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, attachments = [], channelId } = parsed.data;
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.isSystem) {
      return NextResponse.json(
        { error: "Messages cannot be sent in system channels" },
        { status: 403 }
      );
    }

    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: channel.workspace,
    }).select("_id");

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const message = await Message.create({
      content,
      attachments,
      channel: channelId,
      sender: session.user.id,
    });

    const populatedMessage = await message.populate(
      "sender",
      "username email avatar"
    );
    const plainMessage = populatedMessage.toObject() as PlainMessage;

    const messageWithUrls = {
      ...plainMessage,
      attachments: await Promise.all(
        (plainMessage.attachments || []).map(async (att) => {
          if (!att.key) return att;

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: att.key,
          });

          const signedUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600,
          });

          return {
            ...att,
            url: signedUrl,
          };
        })
      ),
    };

    const messageContent = content || "";
    const mentionedUsernames = extractMentionedUsernames(messageContent);

    after(async () => {
      if (mentionedUsernames.length > 0) {
        try {
          const mentionedMembers = await Membership.find({
            workspace: channel.workspace,
            user: { $ne: session.user.id },
          })
            .populate("user", "username")
            .lean<MentionedMember[]>();

          const mentionedRecipients = mentionedMembers.filter(
            (member): member is MentionedRecipient => {
              const user = member.user;

              if (!user?._id || !user.username) {
                return false;
              }

              return mentionedUsernames.includes(user.username.toLowerCase());
            }
          );

          const senderName =
            plainMessage.sender?.username || session.user.username || "Someone";
          const notificationContent = `${senderName} mentioned you in #${
            channel.name
          }: "${createMessagePreview(messageContent)}"`;
          const notificationLink = `/workspace/${channel.workspace}?channel=${channelId}&message=${message._id}`;

          await Promise.all(
            mentionedRecipients.map(async (member) => {
              const recipientId = String(member.user._id);

              const notification = await createNotification({
                user: recipientId,
                type: "mention",
                content: notificationContent,
                link: notificationLink,
                workspace: channel.workspace,
              });

              if (!notification) return;

              try {
                await emitSocketEvent({
                  channelId: recipientId,
                  event: "new_notification",
                  data: {
                    _id: notification._id,
                    type: notification.type,
                    content: notification.content,
                    link: notification.link,
                    workspace: notification.workspace,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt,
                  },
                });
              } catch (error) {
                console.error("Mention notification socket failed:", error);
              }
            })
          );
        } catch (error) {
          console.error("Mention notification failed:", error);
        }
      }

      try {
        await emitSocketEvent({
          channelId,
          message: messageWithUrls,
        });
      } catch (error) {
        console.error("Socket emit failed:", error);
      }
    });

    return NextResponse.json(
      {
        message: "Message sent",
        data: messageWithUrls,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return handleApiError(error);
  }
}
