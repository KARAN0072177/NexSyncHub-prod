"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import {
  X,
  Send,
  Loader2,
  MessageSquare,
  User,
  Calendar,
  Edit,
  Check,
  Activity,
} from "lucide-react";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function TaskDetailModal({ taskId, onClose }: any) {
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const activitiesContainerRef = useRef<HTMLDivElement>(null);

  // 📩 fetch task
  useEffect(() => {
    const fetchData = async () => {
      try {

        console.log("📦 FRONTEND SENDING TASK ID:", taskId);

        const res = await fetch(`/api/task/${taskId}`);
        const data = await res.json();
        if (res.ok && data.task) {
          setTask(data.task);
          setComments(data.comments || []);
          setEditedDescription(data.task.description || "");
        } else {
          console.error("Failed to fetch task");
          onClose();
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        onClose();
      }
    };
    fetchData();
  }, [taskId, onClose]);

  // 📩 fetch activities
  useEffect(() => {
    if (!taskId) return;
    const fetchActivities = async () => {
      const res = await fetch(`/api/task/activity/${taskId}`);
      const data = await res.json();
      if (res.ok) {
        setActivities(data.activities || []);
      }
    };
    fetchActivities();
  }, [taskId]);

  // 🔔 join socket room
  useEffect(() => {
    if (!taskId) return;
    socket.emit("join_channel", taskId);
    return () => {
      socket.off("task_comment");
      socket.off("task_activity");
    };
  }, [taskId]);

  // 💬 add comment
  const addComment = async () => {
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch("/api/task/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, content }),
    });
    const data = await res.json();
    if (res.ok) {
      setComments((prev) => {
        if (prev.some((c) => c._id === data.comment._id)) return prev;
        return [...prev, data.comment];
      });
      setContent("");
      setTimeout(() => {
        commentsContainerRef.current?.scrollTo({
          top: commentsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
    setSending(false);
  };

  // Listen for new comments
  useEffect(() => {
    const handleNewComment = (newComment: any) => {
      setComments((prev) => {
        if (prev.some((c) => c._id === newComment._id)) return prev;
        return [...prev, newComment];
      });
    };
    socket.on("task_comment", handleNewComment);
    return () => {
      socket.off("task_comment", handleNewComment);
    };
  }, []);

  // Listen for new activities
  useEffect(() => {
    const handleNewActivity = (activity: any) => {
      setActivities((prev) => {
        if (prev.some((a) => a._id === activity._id)) return prev;
        return [activity, ...prev];
      });
    };
    socket.on("task_activity", handleNewActivity);
    return () => {
      socket.off("task_activity", handleNewActivity);
    };
  }, []);

  const saveDescription = async () => {
    setSaving(true);
    const res = await fetch("/api/task/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        description: editedDescription,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setTask({ ...task, description: editedDescription });
      setIsEditingDescription(false);
    } else {
      alert(data.error);
    }
    setSaving(false);
  };

  const startEditing = () => {
    setEditedDescription(task?.description || "");
    setIsEditingDescription(true);
  };

  const cancelEditing = () => {
    setEditedDescription(task?.description || "");
    setIsEditingDescription(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white truncate">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Description
              </label>
              {!isEditingDescription && (
                <button
                  onClick={startEditing}
                  className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200"
                  title="Edit description"
                >
                  <Edit size={14} />
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3
                    text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveDescription}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30
                      transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 
                      hover:bg-gray-800 hover:text-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-3">
                {task.description ? (
                  <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm italic">No description yet</p>
                )}
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Activity
            </label>
            <div
              ref={activitiesContainerRef}
              className="max-h-32 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
              {activities.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No activity yet</p>
              ) : (
                activities.map((a) => (
                  <div key={a._id} className="flex items-start gap-2">
                    <Activity className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">
                      <span className="font-medium text-gray-300">{a.sender?.username}</span>{" "}
                      {a.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Comments ({comments.length})
            </label>

            <div
              ref={commentsContainerRef}
              className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-2">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-200">
                          {c.sender?.username || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 break-words mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer - Add Comment */}
        <div className="p-5 border-t border-gray-800/50">
          <div className="flex gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addComment();
                }
              }}
              placeholder="Write a comment..."
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5
                text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
            <button
              onClick={addComment}
              disabled={sending || !content.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 
                disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center gap-2
                shadow-lg shadow-indigo-600/20"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}