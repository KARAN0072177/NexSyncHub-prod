import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Membership from "@/models/Membership";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get("workspaceId");

        if (!workspaceId || workspaceId === "undefined") {
            return NextResponse.json(
                { error: "Invalid workspaceId" },
                { status: 400 }
            );
        }

        if (!workspaceId) {
            return NextResponse.json(
                { error: "workspaceId required" },
                { status: 400 }
            );
        }

        // 🔐 Check membership
        const membership = await Membership.findOne({
            user: session.user.id,
            workspace: workspaceId,
        });

        if (!membership) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const tasks = await Task.find({ workspace: workspaceId })
            .sort({ createdAt: -1 })
            .populate("createdBy", "username")
            .populate("assignee", "username")
            .lean();

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error("GET TASKS ERROR:", error);

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}