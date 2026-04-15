import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import Message from "@/models/Message";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      title,
      description,
      workspaceId,
      channelId,
      assignee,
      priority,
      dueDate,
      linkedMessage,
    } = await req.json();

    if (!title || !workspaceId) {
      return NextResponse.json(
        { error: "Title and workspaceId required" },
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

    // 🔍 Validate channel (if provided)
    let channel = null;
    if (channelId) {
      channel = await Channel.findById(channelId);
      if (!channel) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 }
        );
      }
    }

    // 📝 Create Task
    const task = await Task.create({
      title,
      description,
      workspace: workspaceId,
      channel: channelId || undefined,
      createdBy: session.user.id,
      assignee: assignee || null,
      priority,
      dueDate,
      linkedMessage,
    });


    let systemMessage = null;

    if (assignee) {
      const target = await Membership.findOne({
        user: assignee,
        workspace: workspaceId,
      }).populate("user");

      const actionText = `${session.user.username} created and assigned "${title}" to ${target?.user?.username}`;

      systemMessage = await Message.create({
        content: actionText,
        channel: channelId,
        sender: session.user.id,
        type: "task_activity", // ✅ new type for task-related system messages
        task: task._id,
      });
    }

    // 🔥 Convert to plain object (IMPORTANT)
    const plainMessage = systemMessage ? JSON.parse(JSON.stringify(systemMessage)) : null;

    // 🔥 Emit socket
    try {
      await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel?._id || channelId,
          message: plainMessage,
        }),
      });

      await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: task._id,
          event: "task_activity",
          data: systemMessage,
        }),
      });

    } catch (err) {
      console.error("Socket emit failed:", err);
    }

    return NextResponse.json(
      {
        message: "Task created",
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}