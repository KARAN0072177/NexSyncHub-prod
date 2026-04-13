import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Membership from "@/models/Membership";
import Message from "@/models/Message";
import Channel from "@/models/Channel";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(req: Request) {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { taskId, status, assignee } = await req.json();

        if (!taskId || (!status && !assignee)) {
            return NextResponse.json(
                { error: "Invalid data" },
                { status: 400 }
            );
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        // 🔐 Check membership
        const membership = await Membership.findOne({
            user: session.user.id,
            workspace: task.workspace,
        });

        if (!membership) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // 🔥 Update status

        if (status) {
            task.status = status;
        }

        if (assignee) {
            task.assignee = assignee;
        }

        await task.save();

        // 🔥 Get default channel
        const channel = await Channel.findOne({
            workspace: task.workspace,
        });

        // 🔥 Build system message
        let actionText = "";

        // Fetch target user (for assignee)
        let assigneeUser: any = null;

        if (assignee) {
            const targetMembership = await Membership.findOne({
                user: assignee,
                workspace: task.workspace,
            }).populate("user");

            assigneeUser = targetMembership?.user;
        }

        // 🔥 STATUS MESSAGE
        if (status) {
            actionText = `${session.user.username} marked "${task.title}" as ${status === "in-progress" ? "In Progress" : status.toUpperCase()
                }`;
        }

        // 🔥 ASSIGNMENT MESSAGE
        if (assignee && assigneeUser) {
            actionText = `${session.user.username} assigned "${task.title}" to ${assigneeUser.username}`;
        }

        // 🔥 CREATE SYSTEM MESSAGE
        const systemMessage = await Message.create({
            content: actionText,
            channel: channel._id,
            sender: session.user.id,
            type: "system",
        });

        // 🔥 EMIT SOCKET
        await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channelId: channel._id,
                message: systemMessage,
            }),
        });

        return NextResponse.json({ success: true, task });
    } catch (error) {
        console.error("UPDATE TASK STATUS ERROR:", error);

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}