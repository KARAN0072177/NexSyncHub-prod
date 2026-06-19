// TaskCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, Flag, ExternalLink, MoreHorizontal, GripVertical } from "lucide-react";

/* ─── design tokens (matches members/settings page) ──────────────────────── */
const T = {
  accent:   "#3B82F6",
  accentLo: "rgba(59,130,246,0.12)",
  accentMd: "rgba(59,130,246,0.25)",
  surface:  "rgba(15,23,42,0.60)",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  text:     "#F8FAFC",
  muted:    "#94A3B8",
  high:     "#EF4444",
  medium:   "#F59E0B",
  low:      "#94A3B8",
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

type TaskCardProps = {
  task: Task;
  updateTask: (
    taskId: string,
    updates: {
      status?: Task["status"];
      assignee?: string;
    }
  ) => void | Promise<void>;
  members: Member[];
  workspaceId: string;
  currentUserId?: string;
  currentUserRole?: string;
  onOpenTask?: (taskId: string) => void;
  isOverlay?: boolean;
};

export default function TaskCard({
  task,
  updateTask,
  members,
  workspaceId,
  currentUserId,
  currentUserRole,
  onOpenTask,
  isOverlay = false,
}: TaskCardProps) {
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = task.priority === "high" ? T.high : task.priority === "medium" ? T.medium : T.low;

  const isCreator = task.createdBy?._id === currentUserId;
  const isAssignee = task.assignee?._id === currentUserId;
  const normalizedRole =
    String(currentUserRole || "").toLowerCase();
  const isAdmin =
    normalizedRole === "admin" || normalizedRole === "owner";

  const canUpdate = isCreator || isAssignee || isAdmin;


  // Stop propagation on interactive elements to prevent drag initiation
  const handleInteractivePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        style={{
          ...style,
          background: T.surface,
          border: `1px solid ${isOverlay ? T.accentMd : "rgba(255,255,255,0.04)"}`,
          boxShadow: isOverlay ? `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${T.accentMd}` : "0 4px 20px rgba(0,0,0,0.2)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTask?.(task._id); // 🔥 IMPORTANT
        }}
        className={`group relative rounded-2xl p-5 hover:border-white/10 transition-all duration-300 overflow-hidden ${isOverlay ? "scale-105 z-50" : ""}`}
      >
        {/* Drag Handle (visible on hover/focus) */}
        <div
          {...listeners}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-500 hover:text-white"
          aria-label="Drag to reorder"
        >
          <GripVertical size={15} />
        </div>

        {/* Priority indicator bar */}
        <div
          className="absolute top-0 left-0 w-1 h-full opacity-80"
          style={{ background: `linear-gradient(to bottom, ${priorityColor}, transparent)` }}
        />

        <div className="pl-5">
          {/* Header: Title and menu */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <h3 className="font-bold text-sm leading-snug pr-4" style={{ color: T.text, fontFamily: "'Sora', sans-serif" }}>
              {task.title}
            </h3>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.muted }}>
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Assignee Selector */}
          <div className="relative mb-3">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }}>
              <User size={13} />
            </div>
            <select
              disabled={!isCreator && !isAdmin}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl outline-none appearance-none transition-all duration-200 cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${T.border}`,
                color: T.text,
                fontFamily: "'DM Sans', sans-serif"
              }}
              value={task.assignee?._id || ""}
              onChange={(e) => {
                updateTask(task._id, {
                  assignee: e.target.value,
                });
              }}
            >
              <option value="" className="bg-gray-900">Unassigned</option>
              {members.map((m) => (
                <option key={m.user._id} value={m.user._id} className="bg-gray-900">
                  {m.user.username}
                </option>
              ))}
            </select>
          </div>

          {/* Linked message button */}
          {task.linkedMessage && task.channel && (
            <button
              onClick={() =>
                router.push(
                  `/workspace/${workspaceId}?channel=${task.channel}&message=${task.linkedMessage}`
                )
              }
              onPointerDown={handleInteractivePointerDown}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors group/link mb-3 w-fit px-2.5 py-1.5 rounded-lg"
              style={{ color: T.accent, background: T.accentLo }}
            >
              <ExternalLink size={11} className="group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 transition-transform" />
              <span>Linked Message</span>
            </button>
          )}

          {/* Status quick actions */}
          <div className="flex gap-2">
            <button
              disabled={!canUpdate}
              onClick={() => updateTask(task._id, { status: "todo" })}
              onPointerDown={handleInteractivePointerDown}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all disabled:cursor-not-allowed"
              style={{
                background: task.status === "todo" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                color: task.status === "todo" ? T.text : T.muted,
                border: `1px solid ${task.status === "todo" ? T.borderHi : "transparent"}`
              }}
            >
              Todo
            </button>
            <button
              disabled={!canUpdate}
              onClick={() => updateTask(task._id, { status: "in-progress" })}
              onPointerDown={handleInteractivePointerDown}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all disabled:cursor-not-allowed"
              style={{
                background: task.status === "in-progress" ? T.accentLo : "rgba(255,255,255,0.02)",
                color: task.status === "in-progress" ? T.accent : T.muted,
                border: `1px solid ${task.status === "in-progress" ? T.accentMd : "transparent"}`
              }}
            >
              Doing
            </button>
            <button
              disabled={!canUpdate}
              onClick={() => updateTask(task._id, { status: "done" })}
              onPointerDown={handleInteractivePointerDown}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all disabled:cursor-not-allowed"
              style={{
                background: task.status === "done" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.02)",
                color: task.status === "done" ? "#10B981" : T.muted,
                border: `1px solid ${task.status === "done" ? "rgba(16,185,129,0.3)" : "transparent"}`
              }}
            >
              Done
            </button>
          </div>

          {/* Footer: Priority and metadata */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: T.border }}>
            <div className="flex items-center gap-1.5">
              <Flag size={11} style={{ color: priorityColor }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: priorityColor }}>
                {task.priority}
              </span>
            </div>
            {task.createdBy && (
              <span className="text-[10px] font-medium" style={{ color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
                By @{task.createdBy.username}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
