import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TaskComment from "@/models/TaskComment";
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

        const { taskId, content } = await req.json();

        if (!taskId || !content) {
            return NextResponse.json(
                { error: "Invalid data" },
                { status: 400 }
            );
        }

        const comment = await TaskComment.create({
            task: taskId,
            content,
            sender: session.user.id,
        });

        const populated = await comment.populate("sender", "username");

        // 🔥 EMIT REAL-TIME COMMENT
        try {
            await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    channelId: populated.task, // ✅ taskId used as room
                    event: "task_comment",
                    data: populated,
                }),
            });
        } catch (err) {
            console.error("Socket emit failed:", err);
        }

        return NextResponse.json({ comment: populated });

    } catch (err) {
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}