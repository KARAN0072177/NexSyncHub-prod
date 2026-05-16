"use client";

import { useEffect, useState, useRef } from "react";
import {
  Shield, Activity, Building2, Hash, Users, CheckSquare,
  Crown, ArrowRight, Zap, RefreshCw, Search, X, ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";

/* ─── design tokens ──────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.70)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  cyan:     "#22D3EE",
  violet:   "#7C3AED",
  emerald:  "#10B981",
  gold:     "#F59E0B",
  rose:     "#FB7185",
  amber:    "#F97316",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

interface Audit {
  _id: string;
  action: string;
  targetType: string;
  metadata?: any;
  createdAt: string;
  actor?: { username?: string; email?: string; avatar?: string };
  workspace?: { name?: string };
}

/* ─── action → visual config ─────────────────────────────────────────────── */
const ACTION_CFG: Record<string, { icon: React.ElementType; color: string; lo: string; md: string; category: string }> = {
  workspace_created:    { icon: Building2,   color: T.accent,   lo: T.accentLo,              md: T.accentMd,              category: "Workspace" },
  workspace_deleted:    { icon: Building2,   color: T.rose,     lo: "rgba(251,113,133,0.10)", md: "rgba(251,113,133,0.22)", category: "Workspace" },
  workspace_renamed:    { icon: Building2,   color: T.cyan,     lo: "rgba(34,211,238,0.10)",  md: "rgba(34,211,238,0.22)",  category: "Workspace" },
  channel_created:      { icon: Hash,        color: T.emerald,  lo: "rgba(16,185,129,0.10)",  md: "rgba(16,185,129,0.22)",  category: "Channel"   },
  channel_deleted:      { icon: Hash,        color: T.rose,     lo: "rgba(251,113,133,0.10)", md: "rgba(251,113,133,0.22)", category: "Channel"   },
  channel_renamed:      { icon: Hash,        color: T.cyan,     lo: "rgba(34,211,238,0.10)",  md: "rgba(34,211,238,0.22)",  category: "Channel"   },
  member_joined:        { icon: Users,       color: T.emerald,  lo: "rgba(16,185,129,0.10)",  md: "rgba(16,185,129,0.22)",  category: "Member"    },
  member_left:          { icon: Users,       color: T.muted,    lo: "rgba(74,85,120,0.15)",   md: "rgba(74,85,120,0.28)",   category: "Member"    },
  member_removed:       { icon: Users,       color: T.rose,     lo: "rgba(251,113,133,0.10)", md: "rgba(251,113,133,0.22)", category: "Member"    },
  member_role_updated:  { icon: Shield,      color: T.violet,   lo: "rgba(124,58,237,0.10)",  md: "rgba(124,58,237,0.22)",  category: "Member"    },
  ownership_transferred:{ icon: Crown,       color: T.gold,     lo: "rgba(245,158,11,0.10)",  md: "rgba(245,158,11,0.22)",  category: "Member"    },
  task_created:         { icon: CheckSquare, color: T.accent,   lo: T.accentLo,              md: T.accentMd,              category: "Task"      },
  task_status_changed:  { icon: CheckSquare, color: T.amber,    lo: "rgba(249,115,22,0.10)",  md: "rgba(249,115,22,0.22)",  category: "Task"      },
  task_assigned:        { icon: CheckSquare, color: T.cyan,     lo: "rgba(34,211,238,0.10)",  md: "rgba(34,211,238,0.22)",  category: "Task"      },
  task_unassigned:      { icon: CheckSquare, color: T.muted,    lo: "rgba(74,85,120,0.15)",   md: "rgba(74,85,120,0.28)",   category: "Task"      },
};

const DEFAULT_CFG = { icon: Activity, color: T.accent, lo: T.accentLo, md: T.accentMd, category: "Event" };

function getActionCfg(action: string) {
  return ACTION_CFG[action] ?? DEFAULT_CFG;
}

/* ─── format action text ─────────────────────────────────────────────────── */
function formatAction(audit: Audit): { prefix: string; highlight: string[]; suffix: string } {
  const u = audit.actor?.username || "Unknown";
  const w = audit.workspace?.name || audit.metadata?.workspaceName || "Unknown Workspace";

  switch (audit.action) {
    case "workspace_created":     return { prefix: `${u} created workspace`, highlight: [w], suffix: "" };
    case "workspace_deleted":     return { prefix: `${u} deleted workspace`, highlight: [w], suffix: "" };
    case "workspace_renamed":     return { prefix: `${u} renamed workspace`, highlight: [audit.metadata?.oldName ?? "", audit.metadata?.newName ?? ""], suffix: "" };
    case "channel_created":       return { prefix: `${u} created channel`, highlight: [`#${audit.metadata?.channelName}`], suffix: "" };
    case "channel_deleted":       return { prefix: `${u} deleted channel`, highlight: [`#${audit.metadata?.channelName}`], suffix: "" };
    case "channel_renamed":       return { prefix: `${u} renamed`, highlight: [`#${audit.metadata?.oldName}`, `#${audit.metadata?.newName}`], suffix: "" };
    case "member_joined":         return { prefix: `${u} joined workspace`, highlight: [w], suffix: "" };
    case "member_left":           return { prefix: `${u} left workspace`, highlight: [w], suffix: "" };
    case "member_removed":        return { prefix: `${u} removed`, highlight: [audit.metadata?.targetUsername ?? ""], suffix: "from workspace" };
    case "member_role_updated":   return { prefix: `${u} changed`, highlight: [audit.metadata?.targetUsername ?? ""], suffix: `role to ${audit.metadata?.newRole}` };
    case "ownership_transferred": return { prefix: `${u} transferred ownership to`, highlight: [audit.metadata?.targetUsername ?? ""], suffix: "" };
    case "task_created":          return { prefix: `${u} created task`, highlight: [audit.metadata?.taskTitle ?? ""], suffix: "" };
    case "task_status_changed":   return { prefix: `${u} changed task`, highlight: [audit.metadata?.taskTitle ?? ""], suffix: `to ${audit.metadata?.newStatus}` };
    case "task_assigned":         return { prefix: `${u} assigned`, highlight: [audit.metadata?.targetUsername ?? ""], suffix: `to task "${audit.metadata?.taskTitle}"` };
    case "task_unassigned":       return { prefix: `${u} unassigned`, highlight: [audit.metadata?.targetUsername ?? ""], suffix: `from task "${audit.metadata?.taskTitle}"` };
    default:                      return { prefix: `${u} performed`, highlight: [audit.action], suffix: "" };
  }
}

/* ─── avatar ─────────────────────────────────────────────────────────────── */
function ActorAvatar({ actor, color }: { actor?: Audit["actor"]; color: string }) {
  const initials = (actor?.username?.[0] ?? actor?.email?.[0] ?? "?").toUpperCase();
  return actor?.avatar ? (
    <img src={actor.avatar} alt={actor.username} className="w-8 h-8 rounded-xl object-cover shrink-0" style={{ border: `1px solid ${color}40` }} />
  ) : (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}30`, color, fontFamily: "'Sora',sans-serif" }}>
      {initials}
    </div>
  );
}

/* ─── skeleton ───────────────────────────────────────────────────────────── */
function AuditSkeleton({ idx }: { idx: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 } }}
      exit={{ opacity: 0, x: 20, scale: 0.97, transition: { duration: 0.2 } }}
      className="relative flex items-start gap-4 group"
    >
      <div className="relative z-10 shrink-0 mt-0.5">
        <div className="w-11 h-11 rounded-2xl animate-pulse" style={{ background: "rgba(99,140,255,0.12)", border: `1px solid ${T.borderHi}` }} />
      </div>
      <div className="flex-1 rounded-2xl p-4 sm:p-5 animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl" style={{ background: "rgba(99,140,255,0.12)" }} />
            <div className="h-4 w-32 sm:w-48 rounded-lg" style={{ background: "rgba(99,140,255,0.08)" }} />
          </div>
          <div className="h-5 w-16 rounded-lg" style={{ background: "rgba(99,140,255,0.12)" }} />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="h-3 w-20 sm:w-24 rounded-lg" style={{ background: "rgba(99,140,255,0.08)" }} />
          <div className="h-3 w-16 sm:w-20 rounded-lg ml-auto" style={{ background: "rgba(99,140,255,0.08)" }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── CATEGORIES for filter ──────────────────────────────────────────────── */
const CATEGORIES = ["All", "Workspace", "Channel", "Member", "Task"];

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AdminAuditsPage() {
  const [audits, setAudits]       = useState<Audit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");
  const [liveCount, setLiveCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginating, setIsPaginating] = useState(false);
  
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const res  = await fetch("/api/admin/audits/list");
        const data = await res.json();
        if (res.ok) setAudits(data.audits);
      } catch (error) {
        console.error("FETCH AUDITS ERROR:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  useEffect(() => {
    socket.emit("join_admin_global");
    socket.on("admin_audit_created", (newAudit) => {
      setAudits(prev => [newAudit, ...prev]);
      setLiveCount(c => c + 1);
    });
    return () => { socket.off("admin_audit_created"); };
  }, []);

  // Reset page when filtering or sorting
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, itemsPerPage, sortOrder]);

  const filtered = audits.filter(a => {
    const cfg         = getActionCfg(a.action);
    const matchCat    = category === "All" || cfg.category === category;
    const q           = search.toLowerCase();
    const matchSearch = !q
      || (a.actor?.username ?? "").toLowerCase().includes(q)
      || (a.actor?.email ?? "").toLowerCase().includes(q)
      || (a.workspace?.name ?? "").toLowerCase().includes(q)
      || a.action.toLowerCase().includes(q);
    return matchCat && matchSearch;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  // CSV Export Function
  const exportToCSV = () => {
    const headers = ["Action", "Category", "Actor", "Workspace", "Details", "Date"];
    const rows = filtered.map(a => {
      const cfg = getActionCfg(a.action);
      const w = a.workspace?.name || a.metadata?.workspaceName || "";
      const actor = a.actor?.username || a.actor?.email || "";
      const parts = formatAction(a);
      const details = `${parts.prefix} ${parts.highlight.join(" ")} ${parts.suffix}`.trim();

      // Escape quotes for safe CSV
      const escapeCSV = (str?: string) => `"${(str || "").replace(/"/g, '""')}"`;

      return [
        escapeCSV(a.action),
        escapeCSV(cfg.category),
        escapeCSV(actor),
        escapeCSV(w),
        escapeCSV(details),
        escapeCSV(new Date(a.createdAt).toISOString())
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedAudits = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setIsPaginating(true);
    setCurrentPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setIsPaginating(false), 400); // Wait briefly for skeleton effect
  };

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-160, left:-120, width:600, height:600, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", top:300, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(124,58,237,0.05)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20" ref={topRef}>

        {/* HEADER */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background:"linear-gradient(135deg,#3D7BFF,#7C3AED)", boxShadow:"0 4px 20px rgba(61,123,255,0.30)" }}>
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>Audit Log</h1>
                <p className="text-sm" style={{ color:T.muted }}>Platform-wide activity timeline</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* export */}
              <button onClick={exportToCSV} disabled={filtered.length === 0 || loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)", color:T.text }}>
                <Download size={14} />
                <span className="font-semibold hidden sm:block">Export CSV</span>
              </button>

              {/* live badge */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background:T.emerald }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:T.emerald }} />
                </span>
                <span style={{ color:T.text, fontWeight:600 }}>Live</span>
                {liveCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg text-xs font-bold" style={{ background:T.accentLo, color:T.accent }}>
                    +{liveCount}
                  </span>
                )}
              </div>

              {/* total */}
              <div className="px-3.5 py-2 rounded-2xl text-sm" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
                <span style={{ color:T.text, fontWeight:600 }}>{audits.length}</span>
                <span style={{ color:T.muted }}> events</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CONTROLS */}
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.45, ease:[0.22,1,0.36,1] }} className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:T.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, workspace, or action…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{ background:T.surface, border:`1px solid ${search ? T.accentMd : T.border}`, color:T.text, backdropFilter:"blur(20px)", boxShadow:search ? `0 0 0 3px ${T.accentLo}` : "none", fontFamily:"'DM Sans',sans-serif" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg" style={{ background:"rgba(255,255,255,0.06)", color:T.muted }}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* sort */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              className="text-sm rounded-2xl px-3 py-2 outline-none cursor-pointer transition-colors"
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, backdropFilter: "blur(20px)", fontFamily: "'DM Sans',sans-serif" }}
            >
              <option value="newest" style={{ background: T.bg }}>Newest First</option>
              <option value="oldest" style={{ background: T.bg }}>Oldest First</option>
            </select>

            {/* category tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
              {CATEGORIES.map(cat => {
                const isActive = category === cat;
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      background: isActive ? T.accentLo : "transparent",
                      color: isActive ? T.accent : T.muted,
                      border: isActive ? `1px solid ${T.accentMd}` : "1px solid transparent",
                      fontFamily: "'DM Sans',sans-serif",
                    }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* PAGINATION (TOP) */}
        {!loading && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
            <div className="flex items-center gap-3">
              <p className="text-sm" style={{ color: T.muted }}>
                Showing <span style={{ color: T.text, fontWeight: 600 }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ color: T.text, fontWeight: 600 }}>{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span style={{ color: T.text, fontWeight: 600 }}>{filtered.length}</span> events
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="text-sm rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text }}
              >
                <option value={5} style={{ background: T.bg }}>5 per page</option>
                <option value={10} style={{ background: T.bg }}>10 per page</option>
                <option value={50} style={{ background: T.bg }}>50 per page</option>
              </select>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || isPaginating}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm font-semibold text-white">{currentPage}</span>
                <span className="text-sm text-gray-500">/</span>
                <span className="text-sm text-gray-500">{totalPages}</span>
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || isPaginating}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                <ChevronRight size={16} />
              </button>
            </div>
            )}
          </motion.div>
        )}

        {/* EMPTY STATE */}
        {!loading && !isPaginating && filtered.length === 0 && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            className="flex flex-col items-center gap-4 py-24 text-center rounded-3xl"
            style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
              <Activity size={22} style={{ color:T.accent }} />
            </div>
            <p className="text-base font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>No audit events found</p>
            <p className="text-sm" style={{ color:T.muted }}>Platform activity will appear here in real time.</p>
          </motion.div>
        )}

        {/* TIMELINE */}
        <div className="relative">
          {/* vertical line */}
          {(loading || isPaginating || filtered.length > 0) && (
            <div className="absolute left-[23px] top-0 bottom-0 w-px" style={{ background:`linear-gradient(180deg,${T.accent},${T.violet},transparent)`, opacity:0.20 }} />
          )}

          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {(loading || isPaginating) ? (
                Array.from({ length: paginatedAudits.length || 1 }).map((_, idx) => (
                  <AuditSkeleton key={`skel-${idx}`} idx={idx} />
                ))
              ) : paginatedAudits.map((audit, idx) => {
                const cfg   = getActionCfg(audit.action);
                const Icon  = cfg.icon;
                const parts = formatAction(audit);

                return (
                  <motion.div
                    key={audit._id}
                    layout
                    initial={{ opacity:0, x:-20, scale:0.98 }}
                    animate={{ opacity:1, x:0, scale:1, transition:{ duration:0.35, ease:[0.22,1,0.36,1], delay: idx < 20 ? idx * 0.025 : 0 } }}
                    exit={{ opacity:0, x:20, scale:0.97, transition:{ duration:0.2 } }}
                    className="relative flex items-start gap-4 group"
                  >
                    {/* timeline dot + icon */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300"
                        style={{
                          background: cfg.lo,
                          border: `1px solid ${cfg.md}`,
                          boxShadow: `0 0 0 3px rgba(3,6,15,1)`,
                        }}
                      >
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>
                    </div>

                    {/* card */}
                    <div
                      className="flex-1 rounded-2xl p-4 sm:p-5 transition-all duration-200"
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        backdropFilter: "blur(20px)",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${cfg.md}`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px ${cfg.lo}`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${T.border}`; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                    >
                      {/* top row */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <ActorAvatar actor={audit.actor} color={cfg.color} />
                          {/* formatted text */}
                          <p className="text-sm font-medium leading-relaxed" style={{ color:T.text }}>
                            {parts.prefix}{" "}
                            {parts.highlight.map((h, i) => (
                              <span key={i}>
                                <span className="font-semibold px-1.5 py-0.5 rounded-lg" style={{ background:cfg.lo, color:cfg.color, fontFamily:"'DM Sans',sans-serif" }}>
                                  {h}
                                </span>
                                {i < parts.highlight.length - 1 && <ArrowRight size={12} className="inline mx-1" style={{ color:T.muted }} />}
                              </span>
                            ))}
                            {parts.suffix && <span> {parts.suffix}</span>}
                          </p>
                        </div>

                        {/* category tag */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase shrink-0" style={{ background:cfg.lo, color:cfg.color, border:`1px solid ${cfg.md}`, letterSpacing:"0.06em" }}>
                          {cfg.category}
                        </span>
                      </div>

                      {/* meta row */}
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {(audit.workspace?.name || audit.metadata?.workspaceName) && (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color:T.muted }}>
                            <Building2 size={11} style={{ color:T.muted }} />
                            <span>{audit.workspace?.name || audit.metadata?.workspaceName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color:T.muted }}>
                          <RefreshCw size={10} />
                          {formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {!loading && !isPaginating && filtered.length > 0 && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
            className="text-center text-xs mt-8" style={{ color:T.muted }}>
            Showing <span style={{ color:T.text, fontWeight:600 }}>{paginatedAudits.length}</span> on this page out of <span style={{ color:T.text, fontWeight:600 }}>{filtered.length}</span> total filtered events · Updates in real time
          </motion.p>
        )}
      </div>
    </div>
  );
}