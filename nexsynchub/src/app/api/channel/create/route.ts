import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import "@/models/Workspace";

import { createChannelSchema } from "@/lib/validators/channel";

import { requireAuth } from "@/lib/auth-guard";

import { createAuditLog } from "@/lib/audit";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        await connectDB();

        const session =
            await requireAuth();

        const body = await req.json();

        const parsed = createChannelSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, workspaceId } = parsed.data;

        // 🔐 Check membership
        const membership = await Membership.findOne({
            user: session.user.id,
            workspace: workspaceId,
        });

        if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
            return NextResponse.json(
                { error: "Not allowed to create channels" },
                { status: 403 }
            );
        }

        // 🏗️ Create channel
        const channel = await Channel.create({
            name,
            workspace: workspaceId,
        });

        await createAuditLog({

            workspaceId,

            actorId:
                session.user.id,

            action:
                "channel_created",

            targetType:
                "channel",

            targetId:
                String(channel._id),

            metadata: {

                channelName:
                    channel.name,

            },

        });

        return NextResponse.json(
            {
                message: "Channel created",
                channel,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("CREATE CHANNEL ERROR:", error);

        // ⚠️ Duplicate channel error
        if (error.code === 11000) {
            return NextResponse.json(
                { error: "Channel already exists" },
                { status: 400 }
            );
        }

        return handleApiError(
            error
        );
    }
}