// TaskClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskCard from "./TaskCard";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Loader2, LayoutGrid, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import TaskDetailModal from "./TaskDetailModal";

type Member = {
  user: {
    _id: string;
    username: string;
  };
  role?: string;
};

type Task = {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdBy?: { _id: string; username: string };
  assignee?: { _id: string; username: string };
  linkedMessage?: string;
  channel?: string;
};

//////////////////////////////////////////////////////
// 🔥 DROPPABLE COLUMN COMPONENT (Dark Theme)
//////////////////////////////////////////////////////

function Column({
  id,
  title,
  taskIds,
  children,
  count = 0,
  accentColor,
}: {
  id: string;
  title: string;
  taskIds: string[];
  children: React.ReactNode;
  count?: number;
  accentColor: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border backdrop-blur-sm transition-all duration-200
        bg-gray-900/80 border-gray-800 shadow-xl
        ${isOver ? `ring-2 ring-${accentColor}-500/50 scale-[1.01]` : ""}`}
    >
      {/* Column Header */}
      <div className="p-4 pb-2 flex items-center justify-between border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${accentColor}-500`} />
          <h2 className="font-semibold text-gray-200 tracking-tight">
            {title}
          </h2>
          <span className="ml-1 text-xs font-medium text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {/* Task List Container */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-240px)] min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">{children}</div>
        </SortableContext>

        {/* Empty state hint */}
        {taskIds.length === 0 && (
          <div className="h-24 flex items-center justify-center">
            <p className="text-xs text-gray-600 italic">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// MAIN CLIENT COMPONENT
//////////////////////////////////////////////////////

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function TasksClient({ workspaceId }: { workspaceId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get("taskId");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: session } = useSession();

  const currentUser = members.find(
    (m) => m.user._id === session?.user?.id
  );

  const currentUserRole = currentUser?.role;

  const router = useRouter();

  // 📩 Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const res = await fetch(`/api/task/list?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (res.ok) setTasks(data.tasks);
      setLoading(false);
    };
    fetchTasks();
  }, [workspaceId]);

  // 👥 Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch(`/api/workspace/members?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (res.ok) setMembers(data.members);
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, ...updates }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMessage(data.error); // Use themed popup instead of alert
      return;
    }
  };

  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("join_channel", workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    socket.on("task_updated", (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === updatedTask._id
            ? { ...t, ...updatedTask }
            : t
        )
      );
    });

    return () => {
      socket.off("task_updated");
    };
  }, []);

  // 🔥 DRAG END HANDLER
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t._id === activeId);
    const overTask = tasks.find((t) => t._id === overId);

    // Drop on column
    if (!overTask) {
      const newStatus = overId as "todo" | "in-progress" | "done";
      updateTask(activeId, { status: newStatus });
      return;
    }

    // Reorder inside same column
    if (activeTask?.status === overTask?.status) {
      const columnTasks = tasks.filter((t) => t.status === activeTask.status);
      const oldIndex = columnTasks.findIndex((t) => t._id === activeId);
      const newIndex = columnTasks.findIndex((t) => t._id === overId);
      const newColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
      const updatedTasks = tasks.map((t) => {
        const found = newColumnTasks.find((nt) => nt._id === t._id);
        return found || t;
      });
      setTasks(updatedTasks);
    }
    // Move between columns
    else if (activeTask && overTask) {
      updateTask(activeId, { status: overTask.status });
    }
  };

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
    }
  }, [initialTaskId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gray-800 animate-pulse" />
            <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900/50 rounded-2xl p-4 h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800/50 rounded-xl border border-gray-700">
              <LayoutGrid className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Tasks
              <span className="ml-3 text-sm font-normal text-gray-500">
                {tasks.length} total
              </span>
            </h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-500/30 transition-all text-sm font-medium">
            <Plus size={16} />
            New Task
          </button>
        </div>

        {/* Empty state for whole board */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 border border-gray-700">
              <LayoutGrid className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">No tasks yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first task to get started
            </p>
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
              Create Task
            </button>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={(event) => setActiveId(event.active.id as string)}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Column
                id="todo"
                title="To Do"
                accentColor="gray"
                count={groupedTasks.todo.length}
                taskIds={groupedTasks.todo.map(t => t._id)}
              >
                {groupedTasks.todo.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    updateTask={updateTask}
                    members={members}
                    workspaceId={workspaceId}
                    currentUserId={session?.user?.id}
                    currentUserRole={currentUserRole}
                    onOpenTask={(taskId: string) => setSelectedTaskId(taskId)}
                  />
                ))}
              </Column>

              <Column
                id="in-progress"
                title="In Progress"
                accentColor="blue"
                count={groupedTasks["in-progress"].length}
                taskIds={groupedTasks["in-progress"].map(t => t._id)}
              >
                {groupedTasks["in-progress"].map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    updateTask={updateTask}
                    members={members}
                    workspaceId={workspaceId}
                    currentUserId={session?.user?.id}
                    currentUserRole={currentUserRole}
                    onOpenTask={(taskId: string) => setSelectedTaskId(taskId)}
                  />
                ))}
              </Column>

              <Column
                id="done"
                title="Done"
                accentColor="green"
                count={groupedTasks.done.length}
                taskIds={groupedTasks.done.map(t => t._id)}
              >
                {groupedTasks.done.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    updateTask={updateTask}
                    members={members}
                    workspaceId={workspaceId}
                    currentUserId={session?.user?.id}
                    currentUserRole={currentUserRole}
                    onOpenTask={(taskId: string) => setSelectedTaskId(taskId)}
                  />
                ))}
              </Column>
            </div>

            {/* Drag overlay for smoother experience */}
            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90 scale-105 shadow-2xl">
                  <TaskCard
                    task={activeTask}
                    updateTask={updateTask}
                    members={members}
                    workspaceId={workspaceId}
                    currentUserId={session?.user?.id}
                    currentUserRole={currentUserRole}
                    onOpenTask={(taskId: string) => setSelectedTaskId(taskId)}
                    isOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Themed Error Popup */}
        {errorMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-400">Permission Error</h3>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-300 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

    </div>
  );
}