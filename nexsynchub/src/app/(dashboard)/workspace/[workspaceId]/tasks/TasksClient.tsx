// TaskClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
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
import { Plus, LayoutGrid, AlertTriangle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import TaskDetailModal from "./TaskDetailModal";
import { motion, AnimatePresence } from "framer-motion";

/* ─── design tokens (matches members/settings/tasks page) ──────────────── */
const T = {
  accent:   "#3B82F6", // electric blue
  accentLo: "rgba(59,130,246,0.12)",
  accentMd: "rgba(59,130,246,0.25)",
  surface:  "rgba(15,23,42,0.50)", // deep darkblue glass
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  text:     "#F8FAFC",
  muted:    "#94A3B8",
  red:      "#EF4444",
  redLo:    "rgba(239,68,68,0.10)",
};

const COL = {
  todo: { color: T.muted, bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.22)" },
  "in-progress": { color: T.accent, bg: T.accentLo, border: T.accentMd },
  done: { color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.22)" },
};

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

type TaskUpdate = {
  status?: Task["status"];
  assignee?: string;
};

type TaskStatusResponse = {
  error?: string;
  task?: Task;
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
  status,
}: {
  id: string;
  title: string;
  taskIds: string[];
  children: React.ReactNode;
  count?: number;
  status: "todo" | "in-progress" | "done";
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const cfg = COL[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-3xl transition-all duration-300 ${isOver ? "scale-[1.02]" : ""}`}
      style={{
        background: T.surface,
        border: `1px solid ${isOver ? cfg.color : T.border}`,
        boxShadow: isOver ? `0 0 0 1px ${cfg.color}40, 0 12px 40px rgba(0,0,0,0.4)` : "none",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)"
      }}
    >
      {/* Column Header */}
      <div className="p-5 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderHi}` }}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: cfg.color, boxShadow: `0 0 10px ${cfg.color}` }} />
          <h2 className="font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            {title}
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {count}
          </span>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-xl transition-colors hover:bg-white/5" style={{ color: T.muted }}>
          <Plus size={15} />
        </button>
      </div>

      {/* Task List Container */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-240px)] min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">{children}</div>
        </SortableContext>

        {/* Empty state hint */}
        {taskIds.length === 0 && (
          <div className="h-24 flex items-center justify-center">
            <p className="text-xs italic" style={{ color: T.muted }}>Drop tasks here</p>
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
  const pendingTaskUpdateRef = useRef<Map<string, symbol>>(new Map());
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get("taskId");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: session } = useSession();

  const currentUser = members.find(
    (m) => m.user._id === session?.user?.id
  );

  const currentUserRole = currentUser?.role;

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
    updates: TaskUpdate
  ) => {
    const requestId = Symbol(taskId);
    let rollbackTask: Task | null = null;

    pendingTaskUpdateRef.current.set(taskId, requestId);
    setErrorMessage(null);

    setTasks((prev) =>
      prev.map((task) => {
        if (task._id !== taskId) {
          return task;
        }

        rollbackTask = task;

        const nextAssignee =
          updates.assignee !== undefined
            ? members.find((member) => member.user._id === updates.assignee)
              ?.user
            : task.assignee;

        return {
          ...task,
          ...(updates.status ? { status: updates.status } : {}),
          ...(updates.assignee !== undefined
            ? { assignee: nextAssignee || undefined }
            : {}),
        };
      })
    );

    try {
      const res = await fetch("/api/task/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...updates }),
      });
      const data = (await res.json()) as TaskStatusResponse;

      if (!res.ok) {
        throw new Error(data.error || "Task update failed");
      }

      if (data.task && pendingTaskUpdateRef.current.get(taskId) === requestId) {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId ? { ...task, ...data.task } : task
          )
        );
      }
    } catch (error) {
      if (
        rollbackTask &&
        pendingTaskUpdateRef.current.get(taskId) === requestId
      ) {
        setTasks((prev) =>
          prev.map((task) => (task._id === taskId ? rollbackTask! : task))
        );
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Task update failed"
      );
    } finally {
      if (pendingTaskUpdateRef.current.get(taskId) === requestId) {
        pendingTaskUpdateRef.current.delete(taskId);
      }
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

      if (!activeTask || activeTask.status === newStatus) {
        return;
      }

      updateTask(activeId, { status: newStatus });
      return;
    }

    // Reorder inside same column
    if (activeTask?.status === overTask?.status) {
      const oldIndex = tasks.findIndex((t) => t._id === activeId);
      const newIndex = tasks.findIndex((t) => t._id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        setTasks((prev) => arrayMove(prev, oldIndex, newIndex));
      }
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
      <div className="h-full overflow-y-auto p-6" style={{ background: "linear-gradient(135deg, #030712 0%, #080C17 100%)" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="max-w-[1600px] mx-auto pb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-6 w-32 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {/* Column Header Skeleton */}
                <div className="p-5 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderHi}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <div className="h-5 w-24 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="h-4 w-6 rounded-md animate-pulse ml-1" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>
                  <div className="h-4 w-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                {/* Column Body Skeleton */}
                <div className="p-3 space-y-2.5 min-h-[300px]">
                  {[1, 2].map((j) => (
                    <div key={j} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.04)` }}>
                      <div className="h-4 w-3/4 rounded animate-pulse mb-4" style={{ background: "rgba(255,255,255,0.08)" }} />
                      <div className="h-8 w-full rounded-xl animate-pulse mb-4" style={{ background: "rgba(255,255,255,0.04)" }} />
                      <div className="flex gap-1.5 mb-3">
                        <div className="h-5 w-12 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                        <div className="h-5 w-16 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                        <div className="h-5 w-12 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: T.border }}>
                        <div className="h-3 w-16 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <div className="h-3 w-20 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(135deg, #030712 0%, #080C17 100%)", color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      {/* ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-100, left:-80, width:420, height:420, borderRadius:"50%", background:"rgba(59,130,246,0.12)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", bottom:-60, right:-40, width:320, height:320, borderRadius:"50%", background:"rgba(14,165,233,0.08)", filter:"blur(100px)" }} />
      </div>

      <div className="relative z-10 p-6 pb-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
              <LayoutGrid size={18} style={{ color: T.accent }} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              Tasks
              <span className="ml-3 text-xs font-bold px-3 py-1.5 rounded-xl align-middle" style={{ background: "rgba(255,255,255,0.05)", color: T.muted, border: `1px solid ${T.borderHi}`, fontFamily: "'DM Sans', sans-serif" }}>
                {tasks.length} total
              </span>
            </h1>
          </div>
        </div>

        {/* Empty state for whole board */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.borderHi}` }}>
              <LayoutGrid size={32} style={{ color: T.muted }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>No tasks yet</h3>
            <p className="text-sm mb-7" style={{ color: T.muted }}>
              Create your first task to get started
            </p>
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 text-white" style={{ background: `linear-gradient(135deg, ${T.accent}, #1D4ED8)`, boxShadow: `0 4px 20px ${T.accentMd}` }}>
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
                status="todo"
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
                status="in-progress"
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
                status="done"
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
        <AnimatePresence>
          {errorMessage && (
            <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setErrorMessage(null)}
                className="absolute inset-0"
                style={{ background: "rgba(3,7,18,0.85)", backdropFilter: "blur(10px)" }}
              />
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22,1,0.36,1] } }}
                exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } }}
                className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                style={{ background: "rgba(15,23,42,0.95)", border: `1px solid ${T.red}30`, backdropFilter: "blur(40px)" }}
              >
                <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,${T.red},transparent)` }} />
                <div className="p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: T.redLo, border: `1px solid ${T.red}30` }}>
                        <AlertTriangle size={16} style={{ color: T.red }} />
                      </div>
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>Permission Error</h3>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-7" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>
                    {errorMessage}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setErrorMessage(null)} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95" style={{ background: `linear-gradient(135deg,${T.red},#FF6B35)`, boxShadow: `0 4px 20px ${T.red}40`, fontFamily: "'DM Sans',sans-serif" }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
