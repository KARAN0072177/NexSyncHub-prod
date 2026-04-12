import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import "@/models/Workspace";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendMessageSchema } from "@/lib/validators/message";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export async function POST(req: Request) {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

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
            "username email"
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

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}