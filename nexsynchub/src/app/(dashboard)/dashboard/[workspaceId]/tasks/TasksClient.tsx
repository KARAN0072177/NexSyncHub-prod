"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskCard from "./TaskCard";

type Member = {
    user: {
        _id: string;
        username: string;
    };
};

type Task = {
    _id: string;
    title: string;
    status: "todo" | "in-progress" | "done";
    priority: "low" | "medium" | "high";
    createdBy?: { username: string };
    assignee?: { _id: string; username: string };
    linkedMessage?: string;
    channel?: string;
};

export default function TasksClient({ workspaceId }: { workspaceId: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    // 📩 Fetch tasks
    useEffect(() => {
        const fetchTasks = async () => {
            const res = await fetch(
                `/api/task/list?workspaceId=${workspaceId}`
            );
            const data = await res.json();

            if (res.ok) {
                setTasks(data.tasks);
            }

            setLoading(false);
        };

        fetchTasks();
    }, [workspaceId]);

    // 👥 Fetch members
    useEffect(() => {
        const fetchMembers = async () => {
            const res = await fetch(
                `/api/workspace/members?workspaceId=${workspaceId}`
            );
            const data = await res.json();

            if (res.ok) {
                setMembers(data.members);
            }
        };

        fetchMembers();
    }, [workspaceId]);

    // 🔥 UNIVERSAL UPDATE FUNCTION
    const updateTask = async (
        taskId: string,
        updates: {
            status?: "todo" | "in-progress" | "done";
            assignee?: string;
        }
    ) => {
        const res = await fetch("/api/task/status", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                taskId,
                ...updates,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        // 🔥 Smart UI update
        setTasks((prev) =>
            prev.map((t) => {
                if (t._id !== taskId) return t;

                return {
                    ...t,
                    ...(updates.status && { status: updates.status }),
                    ...(updates.assignee && {
                        assignee: members
                            .map((m) => m.user)
                            .find((u) => u._id === updates.assignee),
                    }),
                };
            })
        );
    };

    const groupedTasks = {
        todo: tasks.filter((t) => t.status === "todo"),
        "in-progress": tasks.filter((t) => t.status === "in-progress"),
        done: tasks.filter((t) => t.status === "done"),
    };

    if (loading) return <div className="p-6">Loading tasks...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Tasks</h1>

            {tasks.length === 0 && (
                <div className="text-gray-500">No tasks yet</div>
            )}

            <div className="grid grid-cols-3 gap-4">

                {/* TODO */}
                <div className="bg-gray-50 p-3 rounded">
                    <h2 className="font-semibold mb-2">Todo</h2>

                    {groupedTasks.todo.map((task) => (
                        <TaskCard key={task._id} task={task} updateTask={updateTask} />
                    ))}
                </div>

                {/* IN PROGRESS */}
                <div className="bg-blue-50 p-3 rounded">
                    <h2 className="font-semibold mb-2">In Progress</h2>

                    {groupedTasks["in-progress"].map((task) => (
                        <TaskCard key={task._id} task={task} updateTask={updateTask} />
                    ))}
                </div>

                {/* DONE */}
                <div className="bg-green-50 p-3 rounded">
                    <h2 className="font-semibold mb-2">Done</h2>

                    {groupedTasks.done.map((task) => (
                        <TaskCard key={task._id} task={task} updateTask={updateTask} />
                    ))}
                </div>

            </div>
        </div>
    );
}