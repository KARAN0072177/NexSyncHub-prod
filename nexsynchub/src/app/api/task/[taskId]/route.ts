import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import TaskComment from "@/models/TaskComment";
import mongoose from "mongoose";
import "@/models/Channel";

export async function GET(
    req: Request,
    context: { params: Promise<{ taskId: string }> }
) {
    try {
        await connectDB();

        const { taskId } = await context.params;

        console.log("🔍 API RECEIVED TASK ID:", taskId);

        // ✅ VALIDATION
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return NextResponse.json(
                { error: "Invalid taskId" },
                { status: 400 }
            );
        }

        const task = await Task.findById(taskId)
            .populate("assignee", "username")
            .populate("createdBy", "username")
            .populate("channel", "name");

        if (!task) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        const comments = await TaskComment.find({
            task: taskId,
        })
            .sort({ createdAt: 1 })
            .populate("sender", "username");

        return NextResponse.json({ task, comments });

    } catch (err) {
        console.error("TASK DETAIL ERROR:", err); // 🔥 ADD THIS

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}