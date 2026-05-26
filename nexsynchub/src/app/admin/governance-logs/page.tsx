"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Shield, AlertTriangle, Search, ChevronLeft, ChevronRight,
  Loader2, Crown, Bot, X, Activity, Terminal, Filter,
  Clock, User, Database, Zap, Radio, TrendingUp,
} from "lucide-react";

/* ─── Design Tokens ── SIEM / Ops-Center Terminal ────────────────────────── */
const T = {
  bg: "#060810",
  bgDeep: "#03040A",
  surface: "rgba(8,12,26,0.80)",
  surfaceMid: "rgba(11,16,34,0.85)",
  surfaceHi: "rgba(14,20,44,0.90)",
  panel: "rgba(6,10,22,0.70)",

  border: "rgba(56,189,248,0.07)",
  borderMid: "rgba(56,189,248,0.13)",
  borderHi: "rgba(56,189,248,0.22)",
  borderGlow: "rgba(56,189,248,0.40)",

  cyan: "#38BDF8",
  cyanBright: "#7DD3FC",
  cyanDim: "rgba(56,189,248,0.55)",
  cyanLo: "rgba(56,189,248,0.08)",
  cyanMid: "rgba(56,189,248,0.16)",

  rose: "#F43F5E",
  roseBright: "#FB7185",
  roseLo: "rgba(244,63,94,0.10)",
  roseMid: "rgba(244,63,94,0.20)",
  roseGlow: "rgba(244,63,94,0.35)",

  amber: "#F59E0B",
  amberBright: "#FCD34D",
  amberLo: "rgba(245,158,11,0.10)",
  amberMid: "rgba(245,158,11,0.20)",

  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.10)",
  emeraldMid: "rgba(16,185,129,0.20)",

  violet: "#A78BFA",
  violetLo: "rgba(167,139,250,0.10)",
  violetMid: "rgba(167,139,250,0.20)",

  text: "#E8F4FF",
  textDim: "#8BA3C0",
  textMuted: "#3D506A",
  textGhost: "#1E2D42",
};

/* ─── Types ──────────────────────────────────────────────────────────────── */
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

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatAction(action: string) {
  return action.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionIcon(action: string, severity: string) {
  if (action.includes("admin") || action.includes("crown")) return Crown;
  if (action.includes("ai") || action.includes("bot")) return Bot;
  if (severity === "danger") return AlertTriangle;
  if (action.includes("user") || action.includes("account")) return User;
  if (action.includes("data") || action.includes("export")) return Database;
  return Shield;
}

const SEVERITY_CONFIG = {
  danger: { color: T.rose, glow: T.roseGlow, bg: T.roseLo, border: T.roseMid, label: "CRIT", dot: "#F43F5E" },
  warning: { color: T.amber, glow: "rgba(245,158,11,0.3)", bg: T.amberLo, border: T.amberMid, label: "WARN", dot: "#F59E0B" },
  info: { color: T.cyan, glow: "rgba(56,189,248,0.25)", bg: T.cyanLo, border: T.cyanMid, label: "INFO", dot: "#38BDF8" },
};

/* ─── Animated Counter ───────────────────────────────────────────────────── */
function AnimCounter({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const step = (end - start) / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>{display}</span>;
}

/* ─── Severity Pill ──────────────────────────────────────────────────────── */
function SeverityPill({ severity }: { severity: "danger" | "warning" | "info" }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: severity === "danger" ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
      />
      <span className="text-[10px] font-black tracking-[0.15em]"
        style={{ color: cfg.color, fontFamily: "'JetBrains Mono',monospace" }}>
        {cfg.label}
      </span>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon: Icon, sublabel }: {
  label: string; value: number; color: string; icon: any; sublabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl px-4 py-3.5 flex items-center gap-3"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 60% at 0% 50%, ${color}08, transparent)` }} />
      <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="relative min-w-0">
        <div className="text-xl font-black leading-none">
          <AnimCounter value={value} color={color} />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: T.textMuted }}>
          {label}
        </div>
      </div>
      {sublabel && (
        <div className="relative ml-auto text-[9px] font-medium px-2 py-0.5 rounded-md"
          style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
          {sublabel}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Skeleton Row ───────────────────────────────────────────────────────── */
function SkeletonRow({ idx }: { idx: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.04 }}
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      {[
        "w-52", "w-20", "w-40", "w-56", "w-28"
      ].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-4 ${w} rounded-md`}
            style={{ background: "rgba(56,189,248,0.04)", animation: `pulse 2s ease-in-out ${idx * 0.1}s infinite` }} />
        </td>
      ))}
    </motion.tr>
  );
}

/* ─── Row Detail Expand ──────────────────────────────────────────────────── */
function MetadataChips({ metadata }: { metadata: any }) {
  if (!metadata) return <span className="text-[11px]" style={{ color: T.textMuted }}>—</span>;
  const parts: { label: string; value: string; color: string }[] = [];
  if (metadata.reason) parts.push({ label: "reason", value: metadata.reason, color: T.textDim });
  if (metadata.moderationLabels?.length) {
    metadata.moderationLabels.slice(0, 2).forEach((l: any) => {
      parts.push({ label: l.name, value: `${Math.round(l.confidence)}%`, color: T.amber });
    });
  }
  if (metadata.ip) parts.push({ label: "ip", value: metadata.ip, color: T.violet });
  if (metadata.userAgent) parts.push({ label: "ua", value: String(metadata.userAgent).slice(0, 30), color: T.textMuted });
  if (parts.length === 0) {
    const keys = Object.keys(metadata).slice(0, 2);
    keys.forEach(k => parts.push({ label: k, value: String(metadata[k]).slice(0, 30), color: T.textDim }));
  }
  if (parts.length === 0) return <span className="text-[11px]" style={{ color: T.textMuted }}>No metadata</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ color: T.cyan, opacity: 0.6 }}>{p.label}:</span>
          <span style={{ color: p.color }}>{p.value}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── Log Table Row ──────────────────────────────────────────────────────── */
function LogRow({ log, idx, isLast }: { log: GovernanceLog; idx: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[log.severity];
  const Icon = getActionIcon(log.action, log.severity);
  const ts = new Date(log.createdAt);

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: idx < 12 ? idx * 0.025 : 0 }}
        onClick={() => setExpanded(e => !e)}
        className="cursor-pointer transition-all duration-150 group"
        style={{ borderBottom: (isLast && !expanded) ? "none" : `1px solid ${T.border}` }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(56,189,248,0.03)";
          e.currentTarget.style.borderColor = T.borderMid;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = T.border;
        }}
      >
        {/* Severity stripe */}
        <td className="w-0.5 p-0 relative">
          <div className="absolute inset-y-0 left-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: cfg.color }} />
        </td>

        {/* Action */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <Icon size={15} style={{ color: cfg.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: T.text }}>
                {formatAction(log.action)}
              </p>
              <p className="text-[10px] truncate mt-0.5 font-mono" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                {log.action}
              </p>
            </div>
          </div>
        </td>

        {/* Severity */}
        <td className="px-4 py-4 whitespace-nowrap">
          <SeverityPill severity={log.severity} />
        </td>

        {/* User */}
        <td className="px-4 py-4">
          {log.targetUser ? (
            <div className="flex items-center gap-2.5 min-w-0">
              {log.targetUser.avatar ? (
                <img src={log.targetUser.avatar} alt=""
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                  style={{ border: `1px solid ${T.borderMid}` }}
                />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: T.cyanLo, border: `1px solid ${T.cyanMid}`, color: T.cyan, fontFamily: "'JetBrains Mono',monospace" }}>
                  {(log.targetUser.username || log.targetUser.email)[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: T.text }}>
                  {log.targetUser.username || "unnamed"}
                </p>
                <p className="text-[10px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                  {log.targetUser.email}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-[11px] italic flex items-center gap-1.5" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
              <Terminal size={11} /> system
            </span>
          )}
        </td>

        {/* Metadata preview */}
        <td className="px-4 py-4 max-w-[220px]">
          <MetadataChips metadata={log.metadata} />
        </td>

        {/* Timestamp */}
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold" style={{ color: T.text, fontFamily: "'JetBrains Mono',monospace" }}>
              {ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
            </span>
            <span className="text-[10px]" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
              {ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </td>

        {/* Expand indicator */}
        <td className="px-3 py-4 w-8">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={14} style={{ color: T.textMuted }} className="rotate-90" />
          </motion.div>
        </td>
      </motion.tr>

      {/* Expanded detail row */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ borderBottom: isLast ? "none" : `1px solid ${T.border}` }}
          >
            <td colSpan={7} className="px-0 py-0">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-6 py-4 mx-4 mb-3 mt-1 rounded-2xl"
                  style={{ background: "rgba(56,189,248,0.03)", border: `1px solid ${T.borderMid}` }}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>
                        EVENT ID
                      </p>
                      <span className="text-[11px]" style={{ color: T.cyan, fontFamily: "'JetBrains Mono',monospace" }}>
                        {log.id}
                      </span>
                    </div>
                    {log.targetUser && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>
                          USER ROLE
                        </p>
                        <span className="text-[11px] px-2 py-0.5 rounded-md"
                          style={{ background: T.violetLo, color: T.violet, border: `1px solid ${T.violetMid}`, fontFamily: "'JetBrains Mono',monospace" }}>
                          {log.targetUser.role}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>
                        FULL METADATA
                      </p>
                      <pre className="text-[10px] leading-relaxed overflow-auto max-h-32 rounded-lg p-2"
                        style={{ color: T.textDim, background: "rgba(0,0,0,0.3)", fontFamily: "'JetBrains Mono',monospace", scrollbarWidth: "none" }}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Search Input ───────────────────────────────────────────────────────── */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex-1 max-w-sm">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: focused ? T.cyan : T.textMuted }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search actions, users, metadata..."
        className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[12px] outline-none transition-all duration-250"
        style={{
          background: focused ? "rgba(56,189,248,0.06)" : T.surface,
          border: `1px solid ${focused ? T.borderGlow : T.borderMid}`,
          color: T.text,
          backdropFilter: "blur(16px)",
          boxShadow: focused ? `0 0 0 3px rgba(56,189,248,0.08), 0 0 20px rgba(56,189,248,0.06)` : "none",
          fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: "0.02em",
        }}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
            style={{ color: T.textMuted }}
          >
            <X size={11} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Filter Tabs ────────────────────────────────────────────────────────── */
const FILTERS = [
  { key: "all", label: "All", color: T.cyan },
  { key: "security", label: "Security", color: T.rose },
  { key: "moderation", label: "Moderation", color: T.amber },
  { key: "governance", label: "Governance", color: T.violet },
  { key: "ai", label: "AI", color: T.emerald },
];

function FilterTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl"
      style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
      {FILTERS.map(({ key, label, color }) => {
        const isActive = active === key;
        return (
          <motion.button
            key={key}
            onClick={() => onChange(key)}
            whileTap={{ scale: 0.96 }}
            className="relative px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors duration-200 whitespace-nowrap"
            style={{
              color: isActive ? color : T.textMuted,
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="filter-active"
                className="absolute inset-0 rounded-lg"
                style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Live Feed Ticker ───────────────────────────────────────────────────── */
function LiveTicker({ logs }: { logs: GovernanceLog[] }) {
  const tickerRef = useRef<HTMLDivElement>(null);
  const recentDanger = logs.filter(l => l.severity === "danger").length;
  if (logs.length === 0) return null;
  return (
    <div className="relative overflow-hidden rounded-xl h-8 flex items-center"
      style={{ background: "rgba(244,63,94,0.05)", border: `1px solid rgba(244,63,94,0.12)` }}>
      <div className="flex items-center gap-2 px-3 shrink-0"
        style={{ borderRight: `1px solid rgba(244,63,94,0.15)`, height: "100%" }}>
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: T.rose }}
        />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.rose, fontFamily: "'JetBrains Mono',monospace" }}>
          LIVE
        </span>
      </div>
      <div className="overflow-hidden flex-1 mx-3">
        <motion.div
          ref={tickerRef}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {[...logs.slice(0, 6), ...logs.slice(0, 6)].map((log, i) => {
            const cfg = SEVERITY_CONFIG[log.severity];
            return (
              <span key={i} className="text-[10px] flex items-center gap-2"
                style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <span style={{ color: cfg.color }}>◆</span>
                <span style={{ color: T.textDim }}>{formatAction(log.action)}</span>
                {log.targetUser && <span style={{ color: T.textMuted }}>→ {log.targetUser.username || log.targetUser.email}</span>}
                <span style={{ color: T.textGhost }}>|</span>
              </span>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function GovernanceLogsPage() {
  const [logs, setLogs] = useState<GovernanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(itemsPerPage), search, type });
      const res = await fetch(`/api/admin/governance-logs?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total ?? data.logs.length);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, type, itemsPerPage]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const dangerCount = logs.filter(l => l.severity === "danger").length;
  const warnCount = logs.filter(l => l.severity === "warning").length;
  const infoCount = logs.filter(l => l.severity === "info").length;

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Familjen+Grotesk:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.2); border-radius: 99px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes grid-flow {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes h-scan {
          0% { top: 0%; opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
        .h-scanline {
          animation: h-scan 6s linear infinite;
        }
        tr:hover .row-stripe { opacity: 1 !important; }
      `}</style>

      {/* ── Atmospheric background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {/* Base radial bleeds */}
        <div style={{ position: "absolute", top: -200, left: -150, width: 700, height: 600, borderRadius: "50%", background: "rgba(56,189,248,0.05)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(167,139,250,0.04)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: 400, height: 400, borderRadius: "50%", background: "rgba(244,63,94,0.025)", filter: "blur(80px)" }} />

        {/* Fine data grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${T.textGhost}22 1px, transparent 1px), linear-gradient(90deg, ${T.textGhost}22 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          opacity: 0.5,
        }} />

        {/* Dot matrix overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(56,189,248,0.06) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          backgroundPosition: "16px 16px",
        }} />

        {/* Horizontal scanline */}
        <div className="h-scanline absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, rgba(56,189,248,0.15), transparent)` }} />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          {/* System label */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.3em]"
              style={{ color: T.cyan, fontFamily: "'JetBrains Mono',monospace" }}>
              ◈ ADMIN CONSOLE
            </span>
            <span className="text-[9px]" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
              / governance
            </span>
            <div className="flex-1 h-px ml-2" style={{ background: `linear-gradient(90deg, ${T.borderMid}, transparent)` }} />
            <span className="text-[9px] font-mono" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
              {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
            </span>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            {/* Title */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{ background: T.cyanLo, filter: "blur(16px)" }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0.05) 100%)`,
                    border: `1px solid ${T.borderHi}`,
                    boxShadow: `0 8px 32px rgba(56,189,248,0.12), inset 0 1px 0 rgba(255,255,255,0.08)`,
                  }}>
                  <Shield size={24} style={{ color: T.cyan }} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none"
                  style={{ fontFamily: "'Familjen Grotesk',sans-serif", letterSpacing: "-0.04em" }}>
                  Governance Logs
                </h1>
                <p className="text-sm mt-1.5 font-medium flex items-center gap-2" style={{ color: T.textMuted }}>
                  <Radio size={11} style={{ color: T.cyan }} />
                  Platform moderation, security &amp; governance activity
                </p>
              </div>
            </div>

            {/* Stat cards */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
              >
                <StatCard label="Total" value={totalCount || logs.length} color={T.cyan} icon={Database} />
                <StatCard label="Critical" value={dangerCount} color={T.rose} icon={AlertTriangle} sublabel={dangerCount > 0 ? "ALERT" : undefined} />
                <StatCard label="Warnings" value={warnCount} color={T.amber} icon={Zap} />
                <StatCard label="Info" value={infoCount} color={T.emerald} icon={Activity} />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── LIVE TICKER ── */}
        {!loading && logs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-5">
            <LiveTicker logs={logs} />
          </motion.div>
        )}

        {/* ── CONTROLS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-5"
        >
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
          <FilterTabs active={type} onChange={(v) => { setType(v); setPage(1); }} />
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
              className="text-[10px] rounded-xl px-3 py-2.5 outline-none cursor-pointer transition-colors"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderMid}`,
                color: T.textDim,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {[5, 10, 15, 25].map(n => (
                <option key={n} value={n} style={{ background: T.bgDeep }}>{n} / page</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* ── RESULT COUNT ── */}
        <AnimatePresence>
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 px-0.5"
            >
              <p className="text-[10px] w-full sm:w-auto text-left" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                <span style={{ color: T.cyan }}>{logs.length}</span> results{search && <span> for "<span style={{ color: T.text }}>{search}</span>"</span>}
                {type !== "all" && <span> in <span style={{ color: T.violet }}>{type}</span></span>}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-25 hover:bg-white/5"
                    style={{ background: T.surface, border: `1px solid ${T.borderMid}`, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}
                  >
                    ⟨⟨
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-25 hover:bg-white/5"
                    style={{ background: T.surface, border: `1px solid ${T.borderMid}`, color: T.text }}
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {/* Page pills */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                      if (pg < 1 || pg > totalPages) return null;
                      const isActive = pg === page;
                      return (
                        <motion.button
                          key={pg}
                          onClick={() => setPage(pg)}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all"
                          style={{
                            background: isActive ? T.cyanMid : "transparent",
                            border: isActive ? `1px solid ${T.borderGlow}` : "1px solid transparent",
                            color: isActive ? T.cyan : T.textMuted,
                            fontFamily: "'JetBrains Mono',monospace",
                            boxShadow: isActive ? `0 0 16px rgba(56,189,248,0.15)` : "none",
                          }}
                        >
                          {pg}
                        </motion.button>
                      );
                    })}
                  </div>

                  <span className="sm:hidden text-[10px] font-black px-2" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                    {page} / {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-25 hover:bg-white/5"
                    style={{ background: T.surface, border: `1px solid ${T.borderMid}`, color: T.text }}
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-25 hover:bg-white/5"
                    style={{ background: T.surface, border: `1px solid ${T.borderMid}`, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}
                  >
                    ⟩⟩
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TABLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderMid}`,
            backdropFilter: "blur(24px) saturate(160%)",
            boxShadow: `0 24px 60px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Top accent bar */}
          <div className="h-px w-full"
            style={{ background: `linear-gradient(90deg, ${T.cyan}00, ${T.cyan}70, ${T.violet}50, ${T.cyan}00)` }} />

          {/* Column headers */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th className="w-0.5 p-0" />
                  {["Action", "Severity", "Target", "Metadata", "Timestamp", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3.5 text-left"
                      style={{ background: "rgba(4,8,20,0.50)" }}>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]"
                        style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                        {h}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center gap-4 py-24 text-center">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: T.cyanLo, border: `1px solid ${T.cyanMid}` }}>
                            <Shield size={22} style={{ color: T.cyan }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white mb-1"
                              style={{ fontFamily: "'Familjen Grotesk',sans-serif" }}>
                              No logs found
                            </p>
                            <p className="text-[11px]" style={{ color: T.textMuted }}>
                              {search ? `No results matching "${search}"` : "No governance events recorded"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, idx) => (
                      <LogRow key={log.id} log={log} idx={idx} isLast={idx === logs.length - 1} />
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!loading && logs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: `1px solid ${T.border}`, background: "rgba(4,8,20,0.40)" }}
            >
              <p className="text-[10px]" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                {loading ? "…" : `${logs.length} events`}
              </p>
              <div className="flex items-center gap-1.5">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: T.emerald }}
                />
                <span className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: T.emerald, fontFamily: "'JetBrains Mono',monospace" }}>
                  System Online
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}