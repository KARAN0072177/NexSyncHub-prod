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

import { createAuditLog } from "@/lib/audit";

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

        const oldStatus =
            task.status;

        const oldAssignee =
            task.assignee?.toString();

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

        // 🔥 Assignment audit
        if (
            assignee !== undefined &&
            oldAssignee !==
            String(assignee || "")
        ) {

            await createAuditLog({

                workspaceId:
                    String(task.workspace),

                actorId:
                    session.user.id,

                action:
                    assignee
                        ? "task_assigned"
                        : "task_unassigned",

                targetType:
                    "task",

                targetId:
                    String(task._id),

                metadata: {

                    taskTitle:
                        task.title,

                    oldAssignee,

                    newAssignee:
                        assignee || null,

                },

            });

        }

        // 🔥 Assignment audit
        if (
            assignee !== undefined &&
            oldAssignee !==
            String(assignee || "")
        ) {

            await createAuditLog({

                workspaceId:
                    String(task.workspace),

                actorId:
                    session.user.id,

                action:
                    assignee
                        ? "task_assigned"
                        : "task_unassigned",

                targetType:
                    "task",

                targetId:
                    String(task._id),

                metadata: {

                    taskTitle:
                        task.title,

                    oldAssignee,

                    newAssignee:
                        assignee || null,

                },

            });

        }

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

        // 🔥 ASSIGNMENT MESSAGE
        if (assignee && assigneeUser) {
            actionText = `${session.user.username} assigned "${task.title}" to ${assigneeUser.username}`;
        }

        // 🔥 DEBUG LOGS
        console.log("========== TASK ASSIGN DEBUG ==========");
        console.log("ASSIGNEE:", assignee);
        console.log("ASSIGNEE USER:", assigneeUser);
        console.log("TASK TITLE:", task.title);
        console.log("SOCKET URL:", process.env.SOCKET_SERVER_URL);
        console.log("APP URL:", process.env.NEXT_PUBLIC_APP_URL);
        console.log("======================================");

        // 🔥 NOTIFICATION + SOCKET + EMAIL
        if (assignee && assigneeUser) {

            // ===============================
            // NOTIFICATION
            // ===============================
            try {

                console.log("STEP 1: BEFORE CREATE NOTIFICATION");

                await createNotification({
                    user: assigneeUser._id,
                    type: "task_assigned",
                    content: `${session.user.username} assigned you "${task.title}"`,
                    link: `/workspace/${task.workspace}/tasks`,
                    task: task._id,
                    workspace: task.workspace,
                });

                console.log("STEP 2: NOTIFICATION CREATED");

            } catch (err) {

                console.error("NOTIFICATION ERROR:", err);

            }

            // ===============================
            // SOCKET EMIT
            // ===============================
            try {

                console.log("STEP 3: BEFORE SOCKET EMIT");

                const socketRes = await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        channelId: assigneeUser._id.toString(),
                        event: "new_notification",
                        data: {
                            _id: new Date().toISOString(),
                            content: `${session.user.username} assigned you "${task.title}"`,
                            link: `/workspace/${task.workspace}/tasks?taskId=${task._id}`,
                            isRead: false,
                            createdAt: new Date(),
                        },
                    }),
                });

                console.log("STEP 4: SOCKET STATUS:", socketRes.status);

            } catch (err) {

                console.error("SOCKET ERROR:", err);

            }

            // ===============================
            // EMAIL
            // ===============================
            try {

                console.log("STEP 5: BEFORE EMAIL");

                await sendTaskAssignedEmail({
                    to: assigneeUser.email,
                    username: assigneeUser.username,
                    taskTitle: task.title,
                    assignedBy: session.user.username,
                    link: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${task.workspace}/tasks`,
                });

                console.log("STEP 6: EMAIL SENT");

            } catch (err) {

                console.error("EMAIL ERROR:", err);

            }

        }

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