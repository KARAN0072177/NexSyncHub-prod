"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function TaskDetailModal({
    taskId,
    onClose,
}: any) {
    const [task, setTask] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [content, setContent] = useState("");

    // 📩 fetch task
    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(`/api/task/${taskId}`);
            const data = await res.json();

            if (res.ok) {
                setTask(data.task);
                setComments(data.comments);
            }
        };

        fetchData();
    }, [taskId]);

    // 🔔 listen for new comments

    useEffect(() => {
        if (!taskId) return;

        socket.emit("join_channel", taskId);

        return () => {
            socket.off("task_comment");
        };
    }, [taskId]);

    // 💬 add comment
    const addComment = async () => {
        if (!content.trim()) return;

        const res = await fetch("/api/task/comment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ taskId, content }),
        });

        const data = await res.json();

        if (res.ok) {
            setComments((prev) => {
                if (prev.some((c) => c._id === data.comment._id)) return prev;
                return [...prev, data.comment];
            });
            setContent("");
        }
    };

    // Listen for new comments in real-time and update the comments state

    useEffect(() => {
        socket.on("task_comment", (newComment) => {
            setComments((prev) => {
                if (prev.some((c) => c._id === newComment._id)) return prev;
                return [...prev, newComment];
            });
        });

        return () => {
            socket.off("task_comment");
        };
    }, []);

    const saveDescription = async () => {
        const res = await fetch("/api/task/update", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                taskId,
                description: task.description,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
        }
    };

    if (!task) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
            <div className="bg-gray-900 p-6 rounded w-[500px] space-y-4">

                <h2 className="text-xl font-semibold">{task.title}</h2>

                {/* Description */}
                <textarea
                    value={task.description || ""}
                    onChange={(e) =>
                        setTask({ ...task, description: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                />

                <button
                    onClick={saveDescription}
                    className="bg-indigo-600 px-3 py-1 rounded text-sm"
                >
                    Save Description
                </button>

                {/* Comments */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.map((c) => (
                        <div key={c._id} className="text-sm">
                            <b>{c.sender.username}:</b> {c.content}
                        </div>
                    ))}
                </div>

                {/* Add comment */}
                <div className="flex gap-2">
                    <input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 border p-2 rounded"
                        placeholder="Add comment..."
                    />
                    <button
                        onClick={addComment}
                        className="bg-indigo-600 px-3 py-1 rounded"
                    >
                        Send
                    </button>
                </div>

                <button onClick={onClose} className="text-red-400">
                    Close
                </button>
            </div>
        </div>
    );
}