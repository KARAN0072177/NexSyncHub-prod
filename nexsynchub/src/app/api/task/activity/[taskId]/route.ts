import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";

export async function GET(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectDB();

    const { taskId } = await context.params;

    const activities = await Message.find({
      type: "task_activity",
      task: taskId,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username")
      .lean();

    return NextResponse.json({ activities });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}