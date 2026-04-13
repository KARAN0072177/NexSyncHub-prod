"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskCard from "./TaskCard";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    useDroppable,
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

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

//////////////////////////////////////////////////////
// 🔥 DROPPABLE COLUMN COMPONENT
//////////////////////////////////////////////////////

function Column({
    id,
    title,
    children,
    color,
}: any) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`p-3 rounded min-h-[300px] transition-all ${isOver ? "scale-[1.02] bg-opacity-70" : ""
                } ${color}`}
        >
            <h2 className="font-semibold mb-2">{title}</h2>
            <SortableContext
                items={children.map((child: any) => child.key)}
                strategy={verticalListSortingStrategy}
            >
                {children}
            </SortableContext>
        </div>
    );
}

//////////////////////////////////////////////////////

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

    // 🔥 DRAG END HANDLER
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // 🔥 Find tasks
        const activeTask = tasks.find((t) => t._id === activeId);
        const overTask = tasks.find((t) => t._id === overId);

        // 🧠 CASE 1: DROP ON COLUMN
        if (!overTask) {
            const newStatus = overId as "todo" | "in-progress" | "done";
            updateTask(activeId, { status: newStatus });
            return;
        }

        // 🧠 CASE 2: REORDER INSIDE SAME COLUMN
        if (activeTask?.status === overTask?.status) {
            const columnTasks = tasks.filter(
                (t) => t.status === activeTask.status
            );

            const oldIndex = columnTasks.findIndex(
                (t) => t._id === activeId
            );

            const newIndex = columnTasks.findIndex(
                (t) => t._id === overId
            );

            const newColumnTasks = arrayMove(
                columnTasks,
                oldIndex,
                newIndex
            );

            // 🔥 Merge back into global list
            const updatedTasks = tasks.map((t) => {
                const found = newColumnTasks.find((nt) => nt._id === t._id);
                return found || t;
            });

            setTasks(updatedTasks);
        }

        // 🧠 CASE 3: MOVE BETWEEN COLUMNS
        else if (activeTask && overTask) {
            updateTask(activeId, { status: overTask.status });
        }
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

            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-3 gap-4">

                    {/* TODO */}
                    <Column id="todo" title="Todo" color="bg-gray-50">
                        {groupedTasks.todo.map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                updateTask={updateTask}
                                members={members}
                                workspaceId={workspaceId}
                            />
                        ))}
                    </Column>

                    {/* IN PROGRESS */}
                    <Column
                        id="in-progress"
                        title="In Progress"
                        color="bg-blue-50"
                    >
                        {groupedTasks["in-progress"].map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                updateTask={updateTask}
                                members={members}
                                workspaceId={workspaceId}
                            />
                        ))}
                    </Column>

                    {/* DONE */}
                    <Column id="done" title="Done" color="bg-green-50">
                        {groupedTasks.done.map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                updateTask={updateTask}
                                members={members}
                                workspaceId={workspaceId}
                            />
                        ))}
                    </Column>

                </div>
            </DndContext>
        </div>
    );
}