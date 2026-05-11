import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";

import Membership from "@/models/Membership";
import Task from "@/models/Task";
import Message from "@/models/Message";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Auth check
    const session = await getServerSession(
      authOptions
    );

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 🔥 Run queries in parallel
    const [
      workspaceCount,
      tasksCompleted,
      tasksAssigned,
      messagesSent,
    ] = await Promise.all([

      // Workspace memberships
      Membership.countDocuments({
        user: userId,
      }),

      // Completed tasks
      Task.countDocuments({
        assignee: userId,
        status: "done",
      }),

      // Assigned tasks
      Task.countDocuments({
        assignee: userId,
      }),

      // User messages only
      Message.countDocuments({
        sender: userId,
        type: "user",
      }),

    ]);

    return NextResponse.json({
      stats: {
        workspaceCount,
        tasksCompleted,
        tasksAssigned,
        messagesSent,
      },
    });

  } catch (error) {

    console.error(
      "PROFILE STATS ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );

  }

}