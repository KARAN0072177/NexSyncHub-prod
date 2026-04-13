"use client";

import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function TaskCard({
    task,
    updateTask,
    members,
    workspaceId,
}: any) {
    const router = useRouter();

    // ✅ SORTABLE (NOT DRAGGABLE)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: task._id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
            className="bg-white p-3 rounded shadow mb-2 space-y-2 cursor-grab active:cursor-grabbing"
        >

            {/* TITLE */}
            <p className="font-medium">{task.title}</p>

            {/* 👤 ASSIGNEE */}
            <select
                className="border p-1 rounded text-xs w-full"
                value={task.assignee?._id || ""}
                onChange={(e) =>
                    updateTask(task._id, {
                        assignee: e.target.value,
                    })
                }
            >
                <option value="">Unassigned</option>

                {members.map((m: any) => (
                    <option key={m.user._id} value={m.user._id}>
                        {m.user.username}
                    </option>
                ))}
            </select>

            {/* 🔗 VIEW MESSAGE */}
            {task.linkedMessage && task.channel && (
                <button
                    onClick={() =>
                        router.push(
                            `/dashboard/${workspaceId}?channel=${task.channel}&message=${task.linkedMessage}`
                        )
                    }
                    className="text-xs text-blue-500 underline"
                >
                    View Message
                </button>
            )}

            {/* 📊 STATUS BUTTONS (fallback if drag not used) */}
            <div className="flex gap-1 flex-wrap">
                <button
                    onClick={() => updateTask(task._id, { status: "todo" })}
                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                    Todo
                </button>

                <button
                    onClick={() =>
                        updateTask(task._id, { status: "in-progress" })
                    }
                    className="text-xs bg-blue-100 px-2 py-1 rounded"
                >
                    In Progress
                </button>

                <button
                    onClick={() => updateTask(task._id, { status: "done" })}
                    className="text-xs bg-green-100 px-2 py-1 rounded"
                >
                    Done
                </button>
            </div>

            {/* ⚡ PRIORITY */}
            <div className="text-xs text-gray-500">
                Priority: {task.priority}
            </div>

        </div>
    );
}