"use client";

import { useEffect, useState, useRef } from "react";
import {
  ShieldAlert, ShieldCheck, UserPlus, LogOut,
  Activity, Search, X, Monitor, Globe, RefreshCw, Wifi, ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.70)",
  surfaceHi:"rgba(12,22,52,0.85)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  emerald:  "#10B981",
  rose:     "#FF4D6D",
  amber:    "#F97316",
  violet:   "#7C3AED",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

/* ─── action config ──────────────────────────────────────────────────────── */
const ACTION = {
  auth_login: {
    label:    "Successful Login",
    icon:     ShieldCheck,
    color:    T.emerald,
    lo:       "rgba(16,185,129,0.10)",
    md:       "rgba(16,185,129,0.22)",
    gradient: "linear-gradient(135deg,#10B981,#059669)",
    tag:      "SUCCESS",
  },
  auth_login_failed: {
    label:    "Failed Login",
    icon:     ShieldAlert,
    color:    T.rose,
    lo:       "rgba(255,77,109,0.10)",
    md:       "rgba(255,77,109,0.22)",
    gradient: "linear-gradient(135deg,#FF4D6D,#FF6B35)",
    tag:      "FAILED",
  },
  auth_register: {
    label:    "New Registration",
    icon:     UserPlus,
    color:    T.accent,
    lo:       T.accentLo,
    md:       T.accentMd,
    gradient: `linear-gradient(135deg,${T.accent},#7C3AED)`,
    tag:      "REGISTER",
  },
  auth_logout: {
    label:    "Logout",
    icon:     LogOut,
    color:    T.amber,
    lo:       "rgba(249,115,22,0.10)",
    md:       "rgba(249,115,22,0.22)",
    gradient: "linear-gradient(135deg,#F97316,#D97706)",
    tag:      "LOGOUT",
  },
} as const;

type ActionKey = keyof typeof ACTION;

const DEFAULT_ACTION = {
  label: "Unknown Event", icon: Activity,
  color: T.muted, lo: "rgba(74,85,120,0.15)", md: "rgba(74,85,120,0.28)",
  gradient: "linear-gradient(135deg,#4A5578,#374162)", tag: "EVENT",
};

function getCfg(action: string) {
  return ACTION[action as ActionKey] ?? DEFAULT_ACTION;
}

/* ─── types ──────────────────────────────────────────────────────────────── */
interface SecurityLog {
  _id: string;
  action: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  metadata?: any;
  user?: { username?: string; email?: string; avatar?: string; role?: string };
}

/* ─── parse UA minimally ─────────────────────────────────────────────────── */
function parseUA(ua?: string): { browser: string; os: string } {
  if (!ua) return { browser: "Unknown", os: "Unknown" };
  const browser =
    ua.includes("Chrome") && !ua.includes("Edg") ? "Chrome" :
    ua.includes("Firefox") ? "Firefox" :
    ua.includes("Safari") && !ua.includes("Chrome") ? "Safari" :
    ua.includes("Edg") ? "Edge" : "Browser";
  const os =
    ua.includes("Windows") ? "Windows" :
    ua.includes("Mac") ? "macOS" :
    ua.includes("Linux") ? "Linux" :
    ua.includes("Android") ? "Android" :
    ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : "Unknown";
  return { browser, os };
}

/* ─── avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ user, color }: { user?: SecurityLog["user"]; color: string }) {
  const letter = (user?.username?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  return user?.avatar ? (
    <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-2xl object-cover shrink-0" style={{ border:`1px solid ${color}40` }} />
  ) : (
    <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background:`${color}18`, border:`1px solid ${color}30`, color, fontFamily:"'Sora',sans-serif" }}>
      {letter}
    </div>
  );
}

/* ─── stat card ──────────────────────────────────────────────────────────── */
function MiniStat({ label, value, color, lo, md, icon: Icon }: {
  label: string; value: number; color: string; lo: string; md: string; icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background:lo, border:`1px solid ${md}` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${color}20`, border:`1px solid ${color}30` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>{value}</p>
        <p className="text-xs" style={{ color, fontFamily:"'DM Sans',sans-serif" }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── skeleton ───────────────────────────────────────────────────────────── */
function AuthLogSkeleton({ idx }: { idx: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 } }}
      exit={{ opacity: 0, x: 20, scale: 0.97, transition: { duration: 0.2 } }}
      className="relative flex items-start gap-4 group"
    >
      <div className="relative z-10 shrink-0 mt-0.5">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: "rgba(99,140,255,0.12)", border: `1px solid ${T.borderHi}` }} />
      </div>
      <div className="flex-1 rounded-2xl p-4 sm:p-5 animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl" style={{ background: "rgba(99,140,255,0.12)" }} />
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

const FILTERS = ["All", "Success", "Failed", "Register", "Logout"] as const;
type Filter = typeof FILTERS[number];

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AuthLogsPage() {
  const [logs, setLogs]         = useState<SecurityLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<Filter>("All");
  const [liveCount, setLiveCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginating, setIsPaginating] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res  = await fetch("/api/admin/security/auth-logs");
        const data = await res.json();
        if (res.ok) setLogs(data.logs);
      } catch (err) { console.error("FETCH AUTH LOGS ERROR:", err); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    socket.emit("join_admin_global");
    socket.on("admin_security_log_created", (newLog) => {
      setLogs(prev => [newLog, ...prev]);
      setLiveCount(c => c + 1);
    });
    return () => { socket.off("admin_security_log_created"); };
  }, []);

  // Reset page when filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, itemsPerPage]);

  const ACTION_TO_FILTER: Record<string, Filter> = {
    auth_login:        "Success",
    auth_login_failed: "Failed",
    auth_register:     "Register",
    auth_logout:       "Logout",
  };

  const filtered = logs.filter(l => {
    const matchFilter = filter === "All" || ACTION_TO_FILTER[l.action] === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (l.user?.username ?? "").toLowerCase().includes(q)
      || (l.user?.email ?? "").toLowerCase().includes(q)
      || (l.ip ?? "").toLowerCase().includes(q)
      || (l.metadata?.email ?? "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // CSV Export Function
  const exportToCSV = () => {
    const headers = ["Log ID", "Action", "Status", "Username", "Email", "IP Address", "Browser", "OS", "Date"];
    const rows = filtered.map(l => {
      const escapeCSV = (str?: string) => `"${(str || "").replace(/"/g, '""')}"`;
      const cfg = getCfg(l.action);
      const ua = parseUA(l.userAgent);
      
      return [
        escapeCSV(l._id),
        escapeCSV(cfg.label),
        escapeCSV(cfg.tag),
        escapeCSV(l.user?.username || "Unknown"),
        escapeCSV(l.user?.email || l.metadata?.email || "N/A"),
        escapeCSV(l.ip || "Unknown"),
        escapeCSV(ua.browser),
        escapeCSV(ua.os),
        escapeCSV(new Date(l.createdAt).toISOString())
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `auth_logs_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const counts = {
    success:  logs.filter(l => l.action === "auth_login").length,
    failed:   logs.filter(l => l.action === "auth_login_failed").length,
    register: logs.filter(l => l.action === "auth_register").length,
    logout:   logs.filter(l => l.action === "auth_logout").length,
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLogs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setIsPaginating(true);
    setCurrentPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setIsPaginating(false), 400); // Wait briefly for skeleton effect
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
              <ShieldCheck size={28} style={{ color:T.accent }} className="animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping" style={{ background:T.accentLo, animationDuration:"2s" }} />
          </div>
          <p className="text-sm font-medium" style={{ color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>Loading auth logs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background:T.bg, color:T.text }}>
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
        <div style={{ position:"absolute", top:200, right:-100, width:500, height:500, borderRadius:"50%", background:"rgba(255,77,109,0.04)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", bottom:-80, left:"40%", width:400, height:400, borderRadius:"50%", background:"rgba(16,185,129,0.04)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20" ref={topRef}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background:"linear-gradient(135deg,#3D7BFF,#7C3AED)", boxShadow:"0 4px 20px rgba(61,123,255,0.30)" }}>
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>Auth Logs</h1>
                <p className="text-sm" style={{ color:T.muted }}>Realtime authentication &amp; security activity</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* export button */}
              <button onClick={exportToCSV} disabled={filtered.length === 0 || loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)", color:T.text }}>
                <Download size={14} />
                <span className="font-semibold hidden sm:block">Export CSV</span>
              </button>

              {/* live pill */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background:T.emerald }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:T.emerald }} />
                </span>
                <span className="font-semibold" style={{ color:T.text }}>Live</span>
                {liveCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg text-xs font-bold" style={{ background:T.accentLo, color:T.accent }}>
                    +{liveCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── stat strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="Logins"        value={counts.success}  color={T.emerald} lo="rgba(16,185,129,0.10)"  md="rgba(16,185,129,0.22)"  icon={ShieldCheck} />
            <MiniStat label="Failed"         value={counts.failed}   color={T.rose}    lo="rgba(255,77,109,0.10)"  md="rgba(255,77,109,0.22)"  icon={ShieldAlert} />
            <MiniStat label="Registrations" value={counts.register} color={T.accent}  lo={T.accentLo}             md={T.accentMd}             icon={UserPlus}    />
            <MiniStat label="Logouts"        value={counts.logout}   color={T.amber}   lo="rgba(249,115,22,0.10)"  md="rgba(249,115,22,0.22)"  icon={LogOut}      />
          </div>
        </motion.div>

        {/* ── CONTROLS ── */}
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.45, ease:[0.22,1,0.36,1] }} className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:T.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, email or IP…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{ background:T.surface, border:`1px solid ${search ? T.accentMd : T.border}`, color:T.text, backdropFilter:"blur(20px)", boxShadow:search ? `0 0 0 3px ${T.accentLo}` : "none", fontFamily:"'DM Sans',sans-serif" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg" style={{ background:"rgba(255,255,255,0.06)", color:T.muted }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
            {FILTERS.map(f => {
              const isActive = filter === f;
              const color =
                f === "Success"  ? T.emerald :
                f === "Failed"   ? T.rose    :
                f === "Register" ? T.accent  :
                f === "Logout"   ? T.amber   : T.text;
              const lo =
                f === "Success"  ? "rgba(16,185,129,0.12)"  :
                f === "Failed"   ? "rgba(255,77,109,0.12)"  :
                f === "Register" ? T.accentLo               :
                f === "Logout"   ? "rgba(249,115,22,0.12)"  : "rgba(255,255,255,0.06)";
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? lo : "transparent",
                    color: isActive ? color : T.muted,
                    border: isActive ? `1px solid ${color}35` : "1px solid transparent",
                    fontFamily: "'DM Sans',sans-serif",
                  }}>
                  {f}
                </button>
              );
            })}
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
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || isPaginating} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5" style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-sm font-semibold text-white">{currentPage}</span>
                  <span className="text-sm text-gray-500">/</span>
                  <span className="text-sm text-gray-500">{totalPages}</span>
                </div>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || isPaginating} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5" style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── EMPTY ── */}
        {!loading && !isPaginating && filtered.length === 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="flex flex-col items-center gap-4 py-24 rounded-3xl"
            style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
              <Activity size={22} style={{ color:T.accent }} />
            </div>
            <p className="text-base font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>No logs found</p>
            <p className="text-sm" style={{ color:T.muted }}>Authentication events will appear here in real time.</p>
          </motion.div>
        )}

        {/* ── FEED ── */}
        <div className="relative">
          {/* timeline line */}
          {filtered.length > 0 && (
            <div className="absolute left-[21px] top-0 bottom-0 w-px" style={{ background:`linear-gradient(180deg,${T.accent},${T.violet},transparent)`, opacity:0.18 }} />
          )}

          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {(loading || isPaginating) ? (
                Array.from({ length: paginatedLogs.length || 1 }).map((_, idx) => (
                  <AuthLogSkeleton key={`skel-${idx}`} idx={idx} />
                ))
              ) : paginatedLogs.map((log, idx) => {
                const cfg  = getCfg(log.action);
                const Icon = cfg.icon;
                const ua   = parseUA(log.userAgent);
                const name = log.user?.username || log.metadata?.email || "Unknown User";
                const isFailed = log.action === "auth_login_failed";

                return (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity:0, x:-20, scale:0.98 }}
                    animate={{ opacity:1, x:0, scale:1, transition:{ duration:0.35, ease:[0.22,1,0.36,1], delay: idx < 20 ? idx*0.025 : 0 } }}
                    exit={{ opacity:0, x:20, scale:0.97, transition:{ duration:0.2 } }}
                    className="relative flex items-start gap-4 group"
                  >
                    {/* dot */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300"
                        style={{ background:cfg.lo, border:`1px solid ${cfg.md}`, boxShadow:`0 0 0 3px ${T.bg}` }}
                      >
                        <Icon size={16} style={{ color:cfg.color }} />
                      </div>
                    </div>

                    {/* card */}
                    <div
                      className="flex-1 rounded-2xl overflow-hidden transition-all duration-200"
                      style={{ background:T.surface, border:`1px solid ${isFailed ? "rgba(255,77,109,0.18)" : T.border}`, backdropFilter:"blur(20px)" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.border=`1px solid ${cfg.md}`; el.style.boxShadow=`0 4px 24px ${cfg.lo}`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.border=`1px solid ${isFailed ? "rgba(255,77,109,0.18)" : T.border}`; el.style.boxShadow="none"; }}
                    >
                      {/* coloured top strip for failed */}
                      {isFailed && <div className="h-0.5" style={{ background:"linear-gradient(90deg,#FF4D6D,#FF6B35,transparent)" }} />}

                      <div className="p-4 sm:p-5">
                        {/* top row */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <Avatar user={log.user} color={cfg.color} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }}>{name}</span>
                                {/* role badge */}
                                {log.user?.role && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg uppercase" style={{ background:T.accentLo, color:T.accent, letterSpacing:"0.06em" }}>
                                    {log.user.role}
                                  </span>
                                )}
                              </div>
                              {log.user?.email && log.user.email !== name && (
                                <p className="text-xs mt-0.5" style={{ color:T.muted }}>{log.user.email}</p>
                              )}
                            </div>
                          </div>

                          {/* right: tag + time */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase"
                              style={{ background:cfg.lo, color:cfg.color, border:`1px solid ${cfg.md}`, letterSpacing:"0.07em" }}>
                              {cfg.tag}
                            </span>
                            <span className="text-xs flex items-center gap-1" style={{ color:T.muted }}>
                              <RefreshCw size={9} />
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix:true })}
                            </span>
                          </div>
                        </div>

                        {/* label */}
                        <p className="text-sm font-medium mt-3" style={{ color:cfg.color }}>
                          {cfg.label}
                        </p>

                        {/* failed reason */}
                        {isFailed && log.metadata?.reason && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl w-fit" style={{ background:"rgba(255,77,109,0.08)", border:"1px solid rgba(255,77,109,0.20)", color:T.rose }}>
                            <ShieldAlert size={11} />
                            {log.metadata.reason}
                          </div>
                        )}

                        {/* meta row */}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          {log.ip && (
                            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl"
                              style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, color:T.muted }}>
                              <Globe size={10} style={{ color:T.muted }} />
                              {log.ip}
                            </div>
                          )}
                          {log.userAgent && (
                            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl"
                              style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, color:T.muted }}>
                              <Monitor size={10} style={{ color:T.muted }} />
                              {ua.browser} · {ua.os}
                            </div>
                          )}
                          <div className="text-xs ml-auto" style={{ color:T.muted }}>
                            {new Date(log.createdAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* footer */}
        {!loading && !isPaginating && filtered.length > 0 && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
            className="text-center text-xs mt-8" style={{ color:T.muted }}>
            Showing <span style={{ color:T.text, fontWeight:600 }}>{paginatedLogs.length}</span> on this page out of{" "}
            <span style={{ color:T.text, fontWeight:600 }}>{filtered.length}</span> total filtered events · Updates in real time
          </motion.p>
        )}
      </div>
    </div>
  );
}