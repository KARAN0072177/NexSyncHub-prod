import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import { handleApiError } from "@/lib/api-error";

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
      .populate("sender", "username" , "email", "avatar")
      .lean();

    return NextResponse.json({ activities });
  } catch (err) {

    return handleApiError(
      err
    );
  }
}