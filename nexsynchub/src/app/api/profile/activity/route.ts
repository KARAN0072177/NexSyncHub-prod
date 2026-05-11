import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";

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

    // 🔥 Recent tasks
    const recentTasks = await Task.find({
      $or: [
        { createdBy: userId },
        { assignee: userId },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select(
        "title status updatedAt"
      )
      .lean();

    // 🔥 Recent messages
    const recentMessages =
      await Message.find({
        sender: userId,
        type: "user",
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "content channel createdAt"
        )
        .lean();

    // 🔥 Normalize tasks
    const taskActivities =
      recentTasks.map((task: any) => ({

        type: "task",

        title:
          task.status === "done"
            ? `Completed task "${task.title}"`
            : `Updated task "${task.title}"`,

        createdAt: task.updatedAt,

      }));

    // 🔥 Normalize messages
    const messageActivities =
      recentMessages.map((msg: any) => ({

        type: "message",

        title:
          msg.content?.slice(0, 80) ||
          "Sent a message",

        createdAt: msg.createdAt,

      }));

    // 🔥 Merge + sort
    const activity = [
      ...taskActivities,
      ...messageActivities,
    ]
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      activity,
    });

  } catch (error) {

    console.error(
      "PROFILE ACTIVITY ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );

  }

}