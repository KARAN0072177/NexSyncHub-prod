import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import "@/models/Workspace";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendMessageSchema } from "@/lib/validators/message";

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

        return NextResponse.json(
            {
                message: "Message sent",
                data: populatedMessage,
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