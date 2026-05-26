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
  Maximize,
  X,
  ChevronLeft,
  ChevronRight,
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

  signedEvidenceUrl?: string;

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
      className="rounded-[2rem] overflow-hidden animate-pulse flex flex-col"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="aspect-[4/3] w-full" style={{ background: "rgba(255,77,109,0.08)" }} />
      <div className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: "rgba(255,77,109,0.08)" }} />
          <div className="space-y-2.5 flex-1">
            <div className="h-4 w-1/2 rounded-lg" style={{ background: "rgba(255,77,109,0.08)" }} />
            <div className="h-3 w-1/3 rounded-lg" style={{ background: "rgba(255,77,109,0.05)" }} />
          </div>
        </div>
        <div className="space-y-3 pt-2 mb-auto">
          <div className="h-12 w-full rounded-xl" style={{ background: "rgba(255,77,109,0.06)" }} />
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
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      setLogs((prev) => {
        const newLogs = prev.filter((log) => log._id !== logId);
        const newTotalPages = Math.ceil(newLogs.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        return newLogs;
      });
    } catch (error) {
      console.error(error);
    }
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
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

            {/* Pagination Controls */}
            {!loading && logs.length > 0 && (
              <div className="flex items-center gap-4 px-4 py-2.5 rounded-2xl shrink-0" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.muted }}>Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                  >
                    <option value={5} style={{ background: T.surfaceHi, color: T.text }}>5 / page</option>
                    <option value={10} style={{ background: T.surfaceHi, color: T.text }}>10 / page</option>
                    <option value={50} style={{ background: T.surfaceHi, color: T.text }}>50 / page</option>
                  </select>
                </div>
                <div className="w-px h-6" style={{ background: T.border }} />
                <div className="flex items-center gap-1">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-xl transition-colors"
                    style={{ color: currentPage === 1 ? "rgba(255,255,255,0.2)" : T.text, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (currentPage !== 1) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-bold w-12 text-center" style={{ color: T.text }}>
                    {currentPage} <span className="text-white/30 text-xs font-normal">/</span> {Math.max(1, totalPages)}
                  </span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-xl transition-colors"
                    style={{ color: currentPage === totalPages ? "rgba(255,255,255,0.2)" : T.text, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (currentPage !== totalPages) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: Math.min(itemsPerPage, 6) }).map((_, idx) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {paginatedLogs.map((log, idx) => {
                const visible = visibleImages[log._id];
                return (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: idx < 12 ? idx * 0.05 : 0 } }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                    className="group rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 flex flex-col"
                    style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.roseMd; e.currentTarget.style.transform = "translateY(-4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {/* Image Area */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#03060F]">
                      {log.signedEvidenceUrl ? (
                        <>
                          {/* Ambient background copy of image to fill empty spaces nicely */}
                          <img
                            src={log.signedEvidenceUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                            style={{ filter: "blur(20px)", transform: "scale(1.2)" }}
                          />
                          {/* Main Image properly contained */}
                          <img
                            src={log.signedEvidenceUrl}
                            alt="Evidence"
                            className="relative z-10 w-full h-full object-contain transition-all duration-500 ease-out"
                            style={{ filter: visible ? "none" : "blur(30px)", transform: visible ? "scale(1)" : "scale(1.15)" }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 relative z-10" style={{ background: "rgba(255,255,255,0.02)" }}>
                          <ImageIcon size={32} style={{ color: T.muted }} />
                          <p className="text-xs font-semibold" style={{ color: T.muted }}>Media unavailable</p>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 z-20 ${visible ? 'opacity-100 bg-black/20' : 'opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-md'}`}>
                        <div className="flex items-center gap-4">
                          {log.signedEvidenceUrl && (
                            <>
                              {/* Toggle Blur */}
                              <button onClick={() => toggleImage(log._id)}
                                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xl"
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
                                {visible ? <EyeOff size={22} /> : <Eye size={22} />}
                              </button>
                              
                              {/* Fullscreen Expand */}
                              <button onClick={() => setFullScreenImage(log.signedEvidenceUrl!)}
                                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xl"
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
                                <Maximize size={22} />
                              </button>
                            </>
                          )}

                          {/* Delete Permanently */}
                          <button onClick={() => handleDelete(log._id)}
                            className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95"
                            style={{ background: T.rose, border: `1px solid rgba(255,255,255,0.5)`, color: "#fff", boxShadow: `0 8px 32px ${T.roseMd}` }}>
                            <Trash2 size={22} />
                          </button>
                        </div>
                        {!visible && log.signedEvidenceUrl && (
                          <p className="text-xs font-bold tracking-widest uppercase text-white/70 mt-4">
                            Click Eye Icon To Reveal
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 sm:p-7 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                          style={{ background: T.roseLo, color: T.rose, border: `1px solid ${T.roseMd}` }}>
                          {getSourceLabel(log.action)}
                        </span>
                        <span className="text-xs font-medium" style={{ color: T.muted }}>
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* User Info */}
                      {log.user && (
                        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl transition-colors" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                          {log.user.avatar ? (
                            <img src={log.user.avatar} alt="Avatar" className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-inner" style={{ border: `1px solid ${T.borderHi}` }} />
                          ) : (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-inner text-lg"
                              style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, fontFamily: "'Sora',sans-serif" }}>
                              {(log.user.username || log.user.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-base font-bold text-white truncate mb-0.5" style={{ fontFamily: "'Sora',sans-serif", letterSpacing: "-0.01em" }}>
                              {log.user.username || "Unnamed User"}
                            </p>
                            <p className="text-xs truncate" style={{ color: T.muted }}>
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* AI Labels */}
                      <div className="space-y-3 mb-auto">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.muted }}>Detected Labels</p>
                        {log.metadata?.moderationLabels?.slice(0, 3).map((label, index) => (
                          <div key={index} className="relative overflow-hidden flex items-center justify-between px-4 py-2.5 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                            {/* Confidence background bar */}
                            <div className="absolute left-0 top-0 bottom-0 opacity-20 pointer-events-none transition-all duration-1000"
                              style={{ width: `${label.confidence}%`, background: T.rose }} />

                            <div className="relative z-10 min-w-0 pr-4">
                              <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'DM Sans',sans-serif" }}>{label.name}</p>
                              {label.parentName && (
                                <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label.parentName}</p>
                              )}
                            </div>
                            <span className="relative z-10 text-xs font-bold shrink-0" style={{ color: T.rose }}>
                              {Math.round(label.confidence)}%
                            </span>
                          </div>
                        ))}
                        {(log.metadata?.moderationLabels?.length ?? 0) > 3 && (
                          <p className="text-xs font-medium text-center mt-3" style={{ color: T.muted }}>
                            + {(log.metadata!.moderationLabels!.length) - 3} more tags detected
                          </p>
                        )}
                      </div>

                      {/* Expiry */}
                      {log.metadata?.evidenceExpiresAt && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold py-3 rounded-xl border border-dashed"
                          style={{ background: "rgba(255,255,255,0.01)", borderColor: T.borderHi, color: T.muted }}>
                          <Calendar size={14} />
                          Evidence auto-deletes on {new Date(log.metadata.evidenceExpiresAt).toLocaleDateString()}
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

      {/* Fullscreen Modal Lightbox */}
      <AnimatePresence>
        {fullScreenImage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setFullScreenImage(null)}
            />
            
            {/* Large Image container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full h-full max-h-[90vh] flex items-center justify-center"
            >
              <img src={fullScreenImage} alt="Full screen evidence" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain border border-white/10" />
            </motion.div>

            <button
              onClick={() => setFullScreenImage(null)}
              className="fixed top-6 right-6 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 hover:scale-105 text-white/70 hover:text-white border border-white/10 backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}