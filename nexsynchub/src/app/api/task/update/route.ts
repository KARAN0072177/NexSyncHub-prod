import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Membership from "@/models/Membership";

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

    const { taskId, description } = await req.json();

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID required" },
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

    // 🔥 PERMISSION CHECK (same as before)
    const userId = session.user.id;

    const isCreator =
      task.createdBy?.toString() === userId;

    const isAssignee =
      task.assignee?.toString() === userId;

    const isAdmin =
      membership.role === "ADMIN" || membership.role === "OWNER";

    if (!isCreator && !isAssignee && !isAdmin) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // ✅ UPDATE DESCRIPTION
    task.description = description || "";
    await task.save();

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}