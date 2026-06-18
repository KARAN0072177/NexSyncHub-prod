// TaskDetailModal.tsx

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
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

/* ─── design tokens (matches members/settings page) ──────────────────────── */
const T = {
  accent: "#3B82F6",
  accentLo: "rgba(59,130,246,0.12)",
  accentMd: "rgba(59,130,246,0.25)",
  surface: "rgba(15,23,42,0.95)", // slightly more opaque for the modal pop
  border: "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  text: "#F8FAFC",
  muted: "#94A3B8",
};

export default function TaskDetailModal({ taskId, onClose }: any) {
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
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

  // 🚀 AI enhance description

  const enhanceDescription =
    async () => {

      if (
        !editedDescription.trim()
      ) {
        return;
      }

      try {

        setEnhancing(true);

        const res =
          await fetch(
            "/api/ai/enhance-task",
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({

                  taskId,

                  text:
                    editedDescription,

                }),

            }
          );

        const data =
          await res.json();

        if (res.ok) {

          setEditedDescription(
            data.text
          );

        } else {

          alert(
            data.error
          );

        }

      } catch (error) {

        console.error(
          "AI ENHANCE ERROR:",
          error
        );

      } finally {

        setEnhancing(false);

      }

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" style={{ background: "rgba(3,7,18,0.85)", backdropFilter: "blur(10px)" }} onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 p-8 rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.borderHi}` }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ fontFamily: "'DM Sans', sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        style={{ background: "rgba(3,7,18,0.85)", backdropFilter: "blur(10px)" }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]"
        style={{ background: T.surface, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}
      >
        <div className="h-0.5 w-full absolute top-0 left-0" style={{ background: `linear-gradient(90deg, ${T.accent}, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
              <MessageSquare size={18} style={{ color: T.accent }} />
            </div>
            <h2 className="text-xl font-bold truncate text-white" style={{ fontFamily: "'Sora', sans-serif" }}>{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0 hover:bg-white/5"
            style={{ color: T.muted }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

          {/* Description Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: T.muted }}>
                Description
              </label>
              {!isEditingDescription && (
                <button
                  onClick={startEditing}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                  style={{ color: T.muted }}
                  title="Edit description"
                >
                  <Edit size={14} />
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-2">
                <div
                  className="relative rounded-2xl transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.accentMd}`, boxShadow: `0 0 0 3px ${T.accentLo}` }}
                >
                  <AnimatePresence>
                    {enhancing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: "linear-gradient(110deg, transparent 30%, rgba(124,58,237,0.15) 50%, transparent 70%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s linear infinite",
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={4}
                    className="w-full bg-transparent rounded-2xl px-5 py-4 text-sm outline-none resize-none transition-all duration-300 disabled:opacity-70"
                    style={{ color: T.text }}
                    autoFocus
                    disabled={enhancing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveDescription}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 active:scale-95 text-white"
                    style={{ background: `linear-gradient(135deg, ${T.accent}, #1D4ED8)`, boxShadow: `0 4px 20px ${T.accentMd}` }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Save Changes
                      </>
                    )}
                  </button>

                  <button
                    onClick={
                      enhanceDescription
                    }

                    disabled={
                      enhancing ||

                      !editedDescription.trim()
                    }

                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 active:scale-95 text-white"

                    style={{

                      background:
                        "linear-gradient(135deg, #7C3AED, #4F46E5)",

                      boxShadow:
                        "0 4px 20px rgba(124,58,237,0.25)",

                    }}
                  >

                    {enhancing ? (

                      <>

                        <Loader2
                          size={14}
                          className="animate-spin"
                        />

                        Enhancing

                      </>

                    ) : (

                      <>

                        <Sparkles
                          size={14}
                        />

                        Enhance with AI

                      </>

                    )}

                  </button>

                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ color: T.muted, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}` }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.borderHi}` }}>
                {task.description ? (
                  <div className="prose prose-sm prose-invert max-w-none break-words leading-relaxed" style={{ color: "rgba(232,230,240,0.85)" }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {task.description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: T.muted }}>No description yet</p>
                )}
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: T.muted }}>
              Activity
            </label>
            <div
              ref={activitiesContainerRef}
              className="max-h-40 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
              {activities.length === 0 ? (
                <p className="text-sm italic" style={{ color: T.muted }}>No activity yet</p>
              ) : (
                activities.map((a) => (
                  <div key={a._id} className="flex items-start gap-3">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <Activity size={10} style={{ color: T.muted }} />
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
                      <span className="font-semibold" style={{ color: T.text }}>{a.sender?.username}</span>{" "}
                      {a.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: T.muted }}>
              Comments ({comments.length})
            </label>

            <div
              ref={commentsContainerRef}
              className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
              {comments.length === 0 ? (
                <p className="text-sm italic" style={{ color: T.muted }}>No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.borderHi}` }}>
                      <User size={14} style={{ color: T.muted }} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold" style={{ color: T.text }}>
                          {c.sender?.username || "Unknown"}
                        </span>
                        <span className="text-xs" style={{ color: T.muted }}>
                          • {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed break-words" style={{ color: "rgba(232,230,240,0.85)" }}>{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer - Add Comment */}
        <div className="p-5 shrink-0" style={{ borderTop: `1px solid ${T.border}`, background: "rgba(0,0,0,0.2)" }}>
          <div className="flex gap-3 items-end">
            <div
              className="flex-1 relative rounded-2xl transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.accentMd;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentLo}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
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
                className="w-full bg-transparent outline-none px-5 py-3.5 text-sm"
                style={{ color: T.text }}
              />
            </div>
            <button
              onClick={addComment}
              disabled={sending || !content.trim()}
              className="flex items-center justify-center w-12 h-12 rounded-2xl disabled:opacity-50 transition-all active:scale-95 shrink-0 text-white"
              style={{ background: `linear-gradient(135deg, ${T.accent}, #1D4ED8)`, boxShadow: `0 4px 20px ${T.accentMd}` }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
