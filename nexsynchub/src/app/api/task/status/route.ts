import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Membership from "@/models/Membership";
import Message from "@/models/Message";
import Channel from "@/models/Channel";
import { sendTaskAssignedEmail } from "@/lib/email";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createNotification } from "@/lib/notification";

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

        // 🔐 PERMISSION CHECK

        const userId = session.user.id;

        const isCreator =
            task.createdBy?.toString() === userId;

        const isAssignee =
            task.assignee?.toString() === userId;

        const isAdmin =
            membership.role === "ADMIN" || membership.role === "OWNER";

        // ❌ NOT ALLOWED
        if (!isCreator && !isAssignee && !isAdmin) {
            return NextResponse.json(
                { error: "You are not allowed to update this task" },
                { status: 403 }
            );
        }

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

        // 🔥 Update assignee

        if (assignee !== undefined) {
            task.assignee = assignee || null;
        }

        await task.save();

        // 🔥 POPULATE TASK BEFORE EMIT (CRITICAL FIX)
        const populatedTask = await Task.findById(task._id)
            .populate("assignee", "username")
            .populate("createdBy", "username")
            .lean();

        // 🔥 EMIT TASK UPDATE
        try {
            await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    channelId: task.workspace, // ✅ IMPORTANT
                    event: "task_updated",
                    data: populatedTask, // ✅ Send populated task for real-time updates
                }),
            });
        } catch (err) {
            console.error("Socket emit failed:", err);
        }

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

        await createNotification({
            user: assigneeUser._id,
            type: "task_assigned",
            content: `${session.user.username} assigned you "${task.title}"`,
            link: `/dashboard/${task.workspace}/tasks`,
            task: task._id,
            workspace: task.workspace,
        });

        await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                channelId: assigneeUser._id.toString(), // 🔥 IMPORTANT
                event: "new_notification",
                data: {
                    _id: new Date().toISOString(), // 🔥 temporary unique id
                    content: `${session.user.username} assigned you "${task.title}"`,
                    link: `/dashboard/${task.workspace}/tasks?taskId=${task._id}`,
                    isRead: false,
                    createdAt: new Date(),
                },
            }),
        });

        await sendTaskAssignedEmail({
            to: assigneeUser.email,
            username: assigneeUser.username,
            taskTitle: task.title,
            assignedBy: session.user.username,
            link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${task.workspace}/tasks`,
        });

        // 🔥 CREATE SYSTEM MESSAGE
        const systemMessage = await Message.create({
            content: actionText,
            channel: channel._id,
            sender: session.user.id,
            type: "task_activity", // ✅
            task: task._id,
        });

        // 🔥 POPULATE MESSAGE (IMPORTANT FIX)
        const populatedMessage = await Message.findById(systemMessage._id)
            .populate("sender", "username")
            .populate("task", "title")
            .lean();

        // 🔥 EMIT SOCKET
        await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channelId: channel._id,
                message: populatedMessage,
            }),
        });

        // 🔥 EMIT TASK ACTIVITY (REAL-TIME)
        await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channelId: task._id,   // ✅ IMPORTANT (task room)
                event: "task_activity",
                data: populatedMessage,
            }),
        });

        // 🔥 GLOBAL WORKSPACE ACTIVITY
        await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channelId: task.workspace.toString(), // ✅ workspace room
                event: "workspace_activity",
                data: populatedMessage,
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