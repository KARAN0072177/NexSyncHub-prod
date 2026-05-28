// API Route: POST /api/message/send

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import { createNotification } from "@/lib/notification";
import "@/models/Workspace";
import "@/models/User";
import { sendMessageSchema } from "@/lib/validators/message";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

const extractMentionedUsernames = (content: string) => {
    const matches = content.match(/@([a-zA-Z0-9_]+)/g) || [];

    return [
        ...new Set(
            matches.map((mention) =>
                mention.slice(1).toLowerCase()
            )
        ),
    ];
};

const createMessagePreview = (content: string) => {
    const compact = content.replace(/\s+/g, " ").trim();

    if (compact.length <= 90) return compact;

    return `${compact.slice(0, 87)}...`;
};

export async function POST(req: Request) {
    try {
        await connectDB();

        const session =
            await requireAuth();

        const body = await req.json();

        const parsed = sendMessageSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { content, attachments = [], channelId } = parsed.data;

        // 🔍 Check channel
        const channel = await Channel.findById(channelId);

        if (!channel) {
            return NextResponse.json(
                { error: "Channel not found" },
                { status: 404 }
            );
        }

        // 🔐 Check membership via workspace
        if (channel.isSystem) {
            return NextResponse.json(
                { error: "Messages cannot be sent in system channels" },
                { status: 403 }
            );
        }

        const membership = await Membership.findOne({
            user: session.user.id,
            workspace: channel.workspace,
        });

        if (!membership) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // 📝 Create message
        const message = await Message.create({
            content,
            attachments,
            channel: channelId,
            sender: session.user.id,
        });

        // 🔥 Populate sender BEFORE returning
        const populatedMessage = await message.populate(
            "sender",
            "username email avatar"
        );

        console.log(populatedMessage.attachments); // ✅ Check attachments in logs

        const plainMessage = JSON.parse(JSON.stringify(populatedMessage));

        const messageWithUrls = {
            ...plainMessage,
            attachments: await Promise.all(
                (plainMessage.attachments || []).map(async (att: any) => {
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

        if (mentionedUsernames.length > 0) {
            const mentionedMembers = await Membership.find({
                workspace: channel.workspace,
                user: { $ne: session.user.id },
            })
                .populate("user", "username")
                .lean();

            const mentionedRecipients = mentionedMembers.filter((member: any) =>
                Boolean(member.user?.username) &&
                mentionedUsernames.includes(member.user.username.toLowerCase())
            );

            const senderName =
                plainMessage.sender?.username ||
                session.user.username ||
                "Someone";
            const notificationContent =
                `${senderName} mentioned you in #${channel.name}: "${createMessagePreview(messageContent)}"`;
            const notificationLink =
                `/workspace/${channel.workspace}?channel=${channelId}&message=${message._id}`;

            await Promise.all(
                mentionedRecipients.map(async (member: any) => {
                    const notification = await createNotification({
                        user: member.user._id,
                        type: "mention",
                        content: notificationContent,
                        link: notificationLink,
                        workspace: channel.workspace,
                    });

                    if (!notification) return;

                    try {
                        await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                channelId: member.user._id.toString(),
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
                            }),
                        });
                    } catch (err) {
                        console.error("Mention notification socket failed:", err);
                    }
                })
            );
        }

        // 🔥 CALL SOCKET SERVER (IMPORTANT)
        try {
            await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    channelId,
                    message: messageWithUrls, // ✅ Send message with URLs
                }),
            });
        } catch (err) {
            console.error("Socket emit failed:", err);
            // ❗ Don't break API if socket fails
        }

        return NextResponse.json(
            {
                message: "Message sent",
                data: messageWithUrls, // ✅ Return message with URLs
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);

        return handleApiError(
            error
        );
    }
}
