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

type WorkspaceMemberDoc = {
  role?: string;
  user?: {
    _id?: unknown;
    username?: string;
  } | null;
};

type MentionReason = "direct" | "admin" | "all";

type ResolvedMentionRecipient = {
  user: {
    _id: unknown;
    username: string;
  };
  reason: MentionReason;
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
    const hasAllMention =
      mentionedUsernames.includes("all") || /(?:^|\s)@all(?:\b|[^\w])/i.test(messageContent);
    const hasAdminMention =
      mentionedUsernames.includes("admin") || /(?:^|\s)@admin(?:\b|[^\w])/i.test(messageContent);
    const specificUsernames = mentionedUsernames.filter(
      (username) => username !== "all" && username !== "admin"
    );
    const hasAnyMention = hasAllMention || hasAdminMention || specificUsernames.length > 0;

    after(async () => {
      if (hasAnyMention) {
        try {
          const workspaceMembers = await Membership.find({
            workspace: channel.workspace,
            user: { $ne: session.user.id },
          })
            .populate("user", "username")
            .lean<WorkspaceMemberDoc[]>();

          const recipientsMap = new Map<string, ResolvedMentionRecipient>();

          for (const member of workspaceMembers) {
            const user = member.user;
            if (!user?._id || !user.username) continue;

            const memberUserId = String(user._id);
            const memberUsername = user.username.toLowerCase();
            const normalizedRole = String(member.role || "").toLowerCase();
            const isAdmin = normalizedRole === "admin" || normalizedRole === "owner";

            if (specificUsernames.includes(memberUsername)) {
              recipientsMap.set(memberUserId, {
                user: {
                  _id: user._id,
                  username: user.username,
                },
                reason: "direct",
              });
            } else if (hasAdminMention && isAdmin) {
              if (!recipientsMap.has(memberUserId)) {
                recipientsMap.set(memberUserId, {
                  user: {
                    _id: user._id,
                    username: user.username,
                  },
                  reason: "admin",
                });
              }
            } else if (hasAllMention) {
              if (!recipientsMap.has(memberUserId)) {
                recipientsMap.set(memberUserId, {
                  user: {
                    _id: user._id,
                    username: user.username,
                  },
                  reason: "all",
                });
              }
            }
          }

          const senderName =
            plainMessage.sender?.username || session.user.username || "Someone";
          const notificationLink = `/workspace/${channel.workspace}?channel=${channelId}&message=${message._id}`;
          const previewText = createMessagePreview(messageContent);

          await Promise.all(
            Array.from(recipientsMap.values()).map(async (recipient) => {
              const recipientId = String(recipient.user._id);

              let notificationTitle = `${senderName} mentioned you in #${channel.name}`;
              let notificationContent = `${senderName} mentioned you in #${channel.name}: "${previewText}"`;

              if (recipient.reason === "all") {
                notificationTitle = `${senderName} mentioned @all in #${channel.name}`;
                notificationContent = `${senderName} mentioned @all in #${channel.name}: "${previewText}"`;
              } else if (recipient.reason === "admin") {
                notificationTitle = `${senderName} mentioned @admin in #${channel.name}`;
                notificationContent = `${senderName} mentioned @admin in #${channel.name}: "${previewText}"`;
              }

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
                    title: notificationTitle,
                    content: notification.content,
                    link: notification.link,
                    workspace: channel.workspace,
                    sender: senderName,
                    channelName: channel.name,
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
