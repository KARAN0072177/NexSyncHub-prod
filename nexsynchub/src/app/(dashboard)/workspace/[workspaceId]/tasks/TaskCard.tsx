// TaskCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, Flag, ExternalLink, MoreHorizontal, GripVertical } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";
import { useState } from "react";

export default function TaskCard({
  task,
  updateTask,
  members,
  workspaceId,
  currentUserId,
  currentUserRole,
  onOpenTask,
  isOverlay = false,
}: any) {
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

  const priorityConfig = {
    low: { color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
    medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    high: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  };

  const isCreator = task.createdBy?._id === currentUserId;
  const isAssignee = task.assignee?._id === currentUserId;
  const isAdmin =
    currentUserRole === "ADMIN" || currentUserRole === "OWNER";

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
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTask?.(task._id); // 🔥 IMPORTANT
        }}
        className={`group relative bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-700 p-4 
        shadow-lg hover:shadow-xl hover:border-gray-600 transition-all duration-200
        ${isOverlay ? "shadow-2xl ring-2 ring-indigo-500/50" : ""}`}
      >
        {/* Drag Handle (visible on hover/focus) */}
        <div
          {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300"
          aria-label="Drag to reorder"
        >
          <GripVertical size={18} />
        </div>

        {/* Priority indicator bar */}
        <div
          className={`absolute top-0 left-0 w-1 h-full rounded-l-xl bg-gradient-to-b 
          ${task.priority === "high"
              ? "from-red-500 to-red-600"
              : task.priority === "medium"
                ? "from-yellow-500 to-yellow-600"
                : "from-gray-500 to-gray-600"
            }`}
        />

        <div className="pl-6 space-y-3">
          {/* Header: Title and menu */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-200 text-sm leading-tight">
              {task.title}
            </h3>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300">
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Assignee Selector */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
              <User size={12} />
            </div>
            <select
              disabled={!isCreator && !isAdmin}
              onPointerDown={handleInteractivePointerDown}
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-900/50 border border-gray-700 rounded-lg
              text-gray-300 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50
              hover:bg-gray-800 transition-colors cursor-pointer"
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
          </div>

          {/* Linked message button */}
          {task.linkedMessage && task.channel && (
            <button
              onClick={() =>
                router.push(
                  `/dashboard/${workspaceId}?channel=${task.channel}&message=${task.linkedMessage}`
                )
              }
              onPointerDown={handleInteractivePointerDown}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 
              transition-colors group/link"
            >
              <ExternalLink size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
              <span>View linked message</span>
            </button>
          )}

          {/* Status quick actions */}
          <div className="flex gap-1.5 pt-1">
            <button
              disabled={!canUpdate}
              onClick={() => updateTask(task._id, { status: "todo" })}
              onPointerDown={handleInteractivePointerDown}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all
              ${task.status === "todo"
                  ? "bg-gray-700/50 text-gray-200 border-gray-600"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-300"
                }`}
            >
              Todo
            </button>
            <button
              disabled={!canUpdate}
              onClick={() => updateTask(task._id, { status: "in-progress" })}
              onPointerDown={handleInteractivePointerDown}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all
              ${task.status === "in-progress"
                  ? "bg-blue-900/30 text-blue-300 border-blue-700/50"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-300"
                }`}
            >
              Progress
            </button>
            <button
              disabled={!canUpdate}
              onClick={() => updateTask(task._id, { status: "done" })}
              onPointerDown={handleInteractivePointerDown}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all
              ${task.status === "done"
                  ? "bg-green-900/30 text-green-300 border-green-700/50"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-300"
                }`}
            >
              Done
            </button>
          </div>

          {/* Footer: Priority and metadata */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-700/50">
            <div className="flex items-center gap-1.5">
              <Flag
                size={12}
                className={
                  task.priority === "high"
                    ? "text-red-400"
                    : task.priority === "medium"
                      ? "text-yellow-400"
                      : "text-gray-400"
                }
              />
              <span
                className={`text-xs font-medium capitalize ${priorityConfig[task.priority as keyof typeof priorityConfig].color
                  }`}
              >
                {task.priority}
              </span>
            </div>
            {task.createdBy && (
              <span className="text-xs text-gray-500">@{task.createdBy.username}</span>
            )}
          </div>
        </div>
      </div>
      
    </>
  );
}