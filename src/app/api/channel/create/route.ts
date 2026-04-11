import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import "@/models/Workspace";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createChannelSchema } from "@/lib/validators/channel";

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

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}