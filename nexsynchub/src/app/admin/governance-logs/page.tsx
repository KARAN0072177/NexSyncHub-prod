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

  Shield,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Crown,
  Bot,
  X,
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
  rose: "#FB7185",
  roseLo: "rgba(251,113,133,0.12)",
  roseMd: "rgba(251,113,133,0.25)",
  gold: "#F59E0B",
  goldLo: "rgba(245,158,11,0.12)",
  goldMd: "rgba(245,158,11,0.25)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  emeraldMd: "rgba(16,185,129,0.25)",
  violet: "#7C3AED",
  text: "#E2E8F8",
  muted: "#4A5578",
};

interface GovernanceLog {
  id: string;
  action: string;
  severity: "danger" | "warning" | "info";
  targetUser: {
    id: string;
    username?: string;
    email: string;
    avatar?: string;
    role: string;
  } | null;
  metadata: any;
  createdAt: string;
}

function formatAction(action: string) {
  return action.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ─── UI Components ──────────────────────────────────────────────────────── */
function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "danger") {
    return (
      <span
        className="px-2.5 py-1 rounded-xl text-xs font-semibold"
        style={{ background: T.roseLo, color: T.rose, border: `1px solid ${T.roseMd}`, fontFamily: "'DM Sans',sans-serif" }}
      >
        Danger
      </span>
    );
  }
  if (severity === "warning") {
    return (
      <span
        className="px-2.5 py-1 rounded-xl text-xs font-semibold"
        style={{ background: T.goldLo, color: T.gold, border: `1px solid ${T.goldMd}`, fontFamily: "'DM Sans',sans-serif" }}
      >
        Warning
      </span>
    );
  }
  return (
    <span
      className="px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, fontFamily: "'DM Sans',sans-serif" }}
    >
      Info
    </span>
  );
}

function SkeletonRow({ idx }: { idx: number }) {
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} style={{ borderBottom: `1px solid ${T.border}` }}>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl animate-pulse shrink-0" style={{ background: "rgba(99,140,255,0.07)" }} />
          <div className="space-y-2">
            <div className="h-3.5 w-32 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.07)" }} />
            <div className="h-3 w-48 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.05)" }} />
          </div>
        </div>
      </td>
      <td className="px-6 py-5"><div className="h-6 w-20 rounded-xl animate-pulse" style={{ background: "rgba(99,140,255,0.07)" }} /></td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl animate-pulse shrink-0" style={{ background: "rgba(99,140,255,0.07)" }} />
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.07)" }} />
            <div className="h-3 w-32 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.05)" }} />
          </div>
        </div>
      </td>
      <td className="px-6 py-5"><div className="space-y-2"><div className="h-3.5 w-full max-w-[200px] rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.07)" }} /></div></td>
      <td className="px-6 py-5">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.05)" }} />
          <div className="h-3 w-16 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.05)" }} />
        </div>
      </td>
    </motion.tr>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function GovernanceLogsPage() {
  const [logs, setLogs] = useState<GovernanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(itemsPerPage), search, type });
      const res = await fetch(`/api/admin/governance-logs?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, search, type, itemsPerPage]);

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -160, left: -120, width: 600, height: 600, borderRadius: "50%", background: "rgba(61,123,255,0.07)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: 300, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        
        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#3D7BFF)", boxShadow: "0 4px 20px rgba(61,123,255,0.30)" }}>
                <Shield size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
                  Governance Logs
                </h1>
                <p className="text-sm" style={{ color: T.muted }}>
                  Platform governance, moderation and security activity
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── CONTROLS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search governance logs..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{
                background: T.surface,
                border: `1px solid ${search ? T.accentMd : T.border}`,
                color: T.text,
                backdropFilter: "blur(20px)",
                boxShadow: search ? `0 0 0 3px ${T.accentLo}` : "none",
                fontFamily: "'DM Sans',sans-serif",
              }}
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" style={{ color: T.muted }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl overflow-x-auto scrollbar-hide" style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            {["all", "security", "moderation", "governance", "ai"].map((item) => {
              const isActive = type === item;
              return (
                <button
                  key={item}
                  onClick={() => { setPage(1); setType(item); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-200 whitespace-nowrap outline-none"
                  style={{
                    background: isActive ? T.accentLo : "transparent",
                    color: isActive ? T.accent : T.muted,
                    border: isActive ? `1px solid ${T.accentMd}` : "1px solid transparent",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── PAGINATION (TOP) ── */}
        {!loading && (logs.length > 0 || page > 1) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
            <div className="flex items-center gap-3">
              <p className="text-sm" style={{ color: T.muted }}>
                Showing <span style={{ color: T.text, fontWeight: 600 }}>{logs.length}</span> results
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="text-sm rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text }}
              >
                <option value={5} style={{ background: T.bg }}>5 per page</option>
                <option value={10} style={{ background: T.bg }}>10 per page</option>
                <option value={15} style={{ background: T.bg }}>15 per page</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                  style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text }}>
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-sm font-semibold text-white">{page}</span>
                  <span className="text-sm text-gray-500">/</span>
                  <span className="text-sm text-gray-500">{totalPages}</span>
                </div>
                <button onClick={() => setPage((p) => Math.max(1, p + 1))} disabled={page === totalPages}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                  style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TABLE ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          {/* Top accent */}
          <div className="h-0.5" style={{ background: `linear-gradient(90deg,${T.accent},${T.violet},transparent)` }} />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Action", "Severity", "Target User", "Metadata", "Time"].map((item) => (
                    <th key={item} className="px-6 py-4 text-left text-xs uppercase tracking-widest"
                      style={{ color: T.muted, background: "rgba(6,12,32,0.60)", fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.07em" }}>
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} idx={idx} />)
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center gap-3 py-20 text-center">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                            <Shield size={20} style={{ color: T.accent }} />
                          </div>
                          <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>No logs found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, idx) => {
                      const isLast = idx === logs.length - 1;
                      return (
                        <motion.tr
                          key={log.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx < 15 ? idx * 0.03 : 0 }}
                          className="group transition-colors duration-150"
                          style={{ borderBottom: isLast ? "none" : `1px solid ${T.border}` }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(61,123,255,0.04)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Action */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{
                                  background: log.severity === "danger" ? T.roseLo : log.severity === "warning" ? T.goldLo : T.accentLo,
                                  border: `1px solid ${log.severity === "danger" ? T.roseMd : log.severity === "warning" ? T.goldMd : T.accentMd}`
                                }}
                              >
                                {log.action.includes("admin") ? (
                                  <Crown size={16} style={{ color: T.gold }} />
                                ) : log.action.includes("ai") ? (
                                  <Bot size={16} style={{ color: T.emerald }} />
                                ) : (
                                  <AlertTriangle size={16} style={{ color: log.severity === "danger" ? T.rose : log.severity === "warning" ? T.gold : T.accent }} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: T.text, fontFamily: "'DM Sans',sans-serif" }}>
                                  {formatAction(log.action)}
                                </p>
                                <p className="text-xs truncate mt-0.5" style={{ color: T.muted }}>
                                  {log.action}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Severity */}
                          <td className="px-6 py-5">
                            <SeverityBadge severity={log.severity} />
                          </td>

                          {/* User */}
                          <td className="px-6 py-5">
                            {log.targetUser ? (
                              <div className="flex items-center gap-3">
                                {log.targetUser.avatar ? (
                                  <img src={log.targetUser.avatar} alt="Avatar" className="w-10 h-10 rounded-2xl object-cover shrink-0" style={{ border: `1px solid ${T.borderHi}` }} />
                                ) : (
                                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}`, color: T.accent, fontFamily: "'Sora',sans-serif" }}>
                                    {(log.targetUser.username || log.targetUser.email)[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: T.text, fontFamily: "'DM Sans',sans-serif" }}>
                                    {log.targetUser.username || "Unnamed"}
                                  </p>
                                  <p className="text-xs truncate mt-0.5" style={{ color: T.muted }}>
                                    {log.targetUser.email}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm italic" style={{ color: T.muted }}>System / Unknown</span>
                            )}
                          </td>

                          {/* Metadata */}
                          <td className="px-6 py-5">
                            <div className="max-w-md">
                              {log.metadata?.reason && (
                                <p className="text-sm" style={{ color: T.text }}>
                                  {log.metadata.reason}
                                </p>
                              )}
                              {log.metadata?.moderationLabels?.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {log.metadata.moderationLabels.slice(0, 2).map((label: any, index: number) => (
                                    <div key={index} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold mr-1.5" style={{ background: T.goldLo, color: T.gold, border: `1px solid ${T.goldMd}` }}>
                                      {label.name} <span className="opacity-75">({Math.round(label.confidence)}%)</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Time */}
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium" style={{ color: T.text }}>
                                {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              <span className="text-xs" style={{ color: T.muted }}>
                                {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Footer stats */}
          {!loading && logs.length > 0 && (
            <div className="px-6 py-4" style={{ borderTop: `1px solid ${T.border}`, background: "rgba(6,12,32,0.40)" }}>
              <p className="text-xs" style={{ color: T.muted }}>
                Displaying <span style={{ color: T.text, fontWeight: 600 }}>{logs.length}</span> results on this page.
              </p>
            </div>
          )}
        </motion.div>

        {/* ── PAGINATION ── */}
        {!loading && totalPages > 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between sm:justify-end gap-4 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 px-3">
                <span className="text-sm font-semibold text-white">{page}</span>
                <span className="text-sm text-gray-500">/</span>
                <span className="text-sm text-gray-500">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage((p) => Math.max(1, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}