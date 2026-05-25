"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {

  ShieldAlert,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
  Shield,
  Image as ImageIcon,
} from "lucide-react";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg: "#03060F",
  surface: "rgba(8,16,40,0.70)",
  surfaceHi: "rgba(10,22,52,0.85)",
  border: "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent: "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  gold: "#F59E0B",
  goldLo: "rgba(245,158,11,0.12)",
  goldMd: "rgba(245,158,11,0.25)",
  rose: "#FF4D6D",
  roseLo: "rgba(255,77,109,0.12)",
  roseMd: "rgba(255,77,109,0.25)",
  emerald: "#10B981",
  violet: "#7C3AED",
  text: "#E2E8F8",
  muted: "#4A5578",
};

interface UnsafeLog {

  _id: string;

  action: string;

  metadata: {

    filename?: string;

    evidenceUrl?: string;

    evidenceKey?: string;

    evidenceExpiresAt?: string;

    moderationLabels?: {

      name: string;

      confidence: number;

      parentName?: string;

    }[];

  };

  user?: {

    username?: string;

    email: string;

    avatar?: string;

    role: string;

  };

  createdAt: string;

}

function getSourceLabel(action: string) {
  switch (action) {
    case "unsafe_avatar_upload":
      return "Avatar";
    case "unsafe_workspace_avatar_upload":
      return "Workspace Avatar";
    case "unsafe_support_attachment":
      return "Support Attachment";
    case "unsafe_chat_attachment":
      return "Chat Attachment";
    default:
      return "Unknown";
  }
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function SkeletonCard({ idx }: { idx: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
      className="rounded-3xl overflow-hidden animate-pulse"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="h-56 w-full" style={{ background: "rgba(255,77,109,0.08)" }} />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl" style={{ background: "rgba(255,77,109,0.08)" }} />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-1/2 rounded-lg" style={{ background: "rgba(255,77,109,0.08)" }} />
            <div className="h-3 w-1/3 rounded-lg" style={{ background: "rgba(255,77,109,0.05)" }} />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-10 w-full rounded-xl" style={{ background: "rgba(255,77,109,0.06)" }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function UnsafeMediaPage() {
  const [logs, setLogs] = useState<UnsafeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleImages, setVisibleImages] = useState<Record<string, boolean>>({});

  // 🔥 Fetch logs
  useEffect(() => {

    const fetchLogs =
      async () => {
        try {
          const res = await fetch("/api/admin/unsafe-media");
          const data = await res.json();
          if (res.ok) {
            setLogs(data.logs);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
    fetchLogs();
  }, []);

  // 🔥 Toggle visibility
  const toggleImage = (id: string) => {
    setVisibleImages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 🔥 Delete evidence
  const handleDelete = async (logId: string) => {
    const confirmed = confirm("Delete this evidence permanently?");
    if (!confirmed) return;
      try {
      const res = await fetch(`/api/admin/unsafe-media/${logId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }

      // 🔥 Remove locally
      setLogs((prev) => prev.filter((log) => log._id !== logId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
      `}</style>

      {/* Ambient background — rose-tinted for danger feel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -180, left: -140, width: 640, height: 640, borderRadius: "50%", background: "rgba(255,77,109,0.06)", filter: "blur(130px)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -100, width: 520, height: 520, borderRadius: "50%", background: "rgba(249,115,22,0.05)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,77,109,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,77,109,0.02) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF4D6D,#F97316)", boxShadow: "0 4px 20px rgba(255,77,109,0.30)" }}>
              <ShieldAlert size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
                Unsafe Media Review
              </h1>
              <p className="text-sm mt-1" style={{ color: T.muted }}>
                Review moderation evidence and unsafe uploads
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonCard key={idx} idx={idx} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center rounded-3xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.roseLo, border: `1px solid ${T.roseMd}` }}>
              <Shield size={22} style={{ color: T.rose }} />
            </div>
            <p className="text-base font-semibold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>All clear</p>
            <p className="text-sm" style={{ color: T.muted }}>
              No unsafe media evidence currently needs reviewing.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {logs.map((log, idx) => {
                const visible = visibleImages[log._id];
                return (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: idx < 12 ? idx * 0.05 : 0 } }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                    className="group rounded-3xl overflow-hidden shadow-2xl transition-all duration-300"
                    style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.roseMd; e.currentTarget.style.transform = "translateY(-4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {/* Image Area */}
                    <div className="relative w-full h-56 overflow-hidden bg-black/50">
                      {log.metadata?.evidenceUrl ? (
                        <img
                          src={log.metadata.evidenceUrl}
                          alt="Evidence"
                          className="w-full h-full object-cover transition-all duration-500 ease-out"
                          style={{ filter: visible ? "none" : "blur(24px)", transform: visible ? "scale(1)" : "scale(1.15)" }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                          <ImageIcon size={32} style={{ color: T.muted }} />
                          <p className="text-xs font-semibold" style={{ color: T.muted }}>Media unavailable</p>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className={`absolute inset-0 flex items-center justify-center gap-4 transition-all duration-300 z-20 backdrop-blur-sm ${visible ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100 bg-black/20'}`}>
                        <button onClick={() => toggleImage(log._id)}
                          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 active:scale-95"
                          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button onClick={() => handleDelete(log._id)}
                          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 active:scale-95"
                          style={{ background: T.rose, border: `1px solid #fff`, color: "#fff", boxShadow: `0 4px 20px ${T.roseLo}` }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                          style={{ background: T.roseLo, color: T.rose, border: `1px solid ${T.roseMd}` }}>
                          {getSourceLabel(log.action)}
                        </span>
                        <span className="text-xs font-medium" style={{ color: T.muted }}>
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* User Info */}
                      {log.user && (
                        <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                          {log.user.avatar ? (
                            <img src={log.user.avatar} alt="Avatar" className="w-10 h-10 rounded-xl object-cover shrink-0" style={{ border: `1px solid ${T.borderHi}` }} />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0"
                              style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, fontFamily: "'Sora',sans-serif" }}>
                              {(log.user.username || log.user.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'DM Sans',sans-serif" }}>
                              {log.user.username || "Unnamed"}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: T.muted }}>
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* AI Labels */}
                      <div className="space-y-2">
                        {log.metadata?.moderationLabels?.slice(0, 3).map((label, index) => (
                          <div key={index} className="relative overflow-hidden flex items-center justify-between px-3 py-2 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                            {/* Confidence background bar */}
                            <div className="absolute left-0 top-0 bottom-0 opacity-20 pointer-events-none"
                              style={{ width: `${label.confidence}%`, background: T.rose }} />
                            
                            <div className="relative z-10 min-w-0 pr-3">
                              <p className="text-[13px] font-semibold text-white truncate">{label.name}</p>
                              {label.parentName && (
                                <p className="text-[10px] truncate" style={{ color: T.muted }}>{label.parentName}</p>
                              )}
                            </div>
                            <span className="relative z-10 text-xs font-bold shrink-0" style={{ color: T.rose }}>
                              {Math.round(label.confidence)}%
                            </span>
                          </div>
                        ))}
                        {(log.metadata?.moderationLabels?.length ?? 0) > 3 && (
                          <p className="text-xs text-center mt-2" style={{ color: T.muted }}>
                            + {(log.metadata!.moderationLabels!.length) - 3} more labels
                          </p>
                        )}
                      </div>

                      {/* Expiry */}
                      {log.metadata?.evidenceExpiresAt && (
                        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium py-2 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.02)", color: T.muted }}>
                          <Calendar size={12} />
                          Auto-deletes on {new Date(log.metadata.evidenceExpiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}