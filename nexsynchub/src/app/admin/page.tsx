"use client";

import { useEffect, useState } from "react";
import {
  Users, Building2, Hash, CheckSquare, MessageSquare,
  Shield, Crown, BadgeCheck, Loader2, TrendingUp, Activity,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

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
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalChannels: number;
  totalTasks: number;
  totalMessages: number;
  verifiedUsers: number;
  admins: number;
  superAdmins: number;
}

/* ─── per-card colour/gradient config ───────────────────────────────────── */
const CARD_CFG = [
  {
    title: "Total Users",
    key: "totalUsers" as keyof AdminStats,
    icon: Users,
    gradient: "linear-gradient(135deg,#3D7BFF,#2563EB)",
    glow: "rgba(61,123,255,0.20)",
    lo: "rgba(61,123,255,0.10)",
    md: "rgba(61,123,255,0.22)",
    color: "#3D7BFF",
    desc: "Registered accounts",
  },
  {
    title: "Workspaces",
    key: "totalWorkspaces" as keyof AdminStats,
    icon: Building2,
    gradient: "linear-gradient(135deg,#7C3AED,#6D28D9)",
    glow: "rgba(124,58,237,0.20)",
    lo: "rgba(124,58,237,0.10)",
    md: "rgba(124,58,237,0.22)",
    color: "#7C3AED",
    desc: "Active workspaces",
  },
  {
    title: "Channels",
    key: "totalChannels" as keyof AdminStats,
    icon: Hash,
    gradient: "linear-gradient(135deg,#22D3EE,#0891B2)",
    glow: "rgba(34,211,238,0.18)",
    lo: "rgba(34,211,238,0.10)",
    md: "rgba(34,211,238,0.22)",
    color: "#22D3EE",
    desc: "Total channels",
  },
  {
    title: "Tasks",
    key: "totalTasks" as keyof AdminStats,
    icon: CheckSquare,
    gradient: "linear-gradient(135deg,#10B981,#059669)",
    glow: "rgba(16,185,129,0.18)",
    lo: "rgba(16,185,129,0.10)",
    md: "rgba(16,185,129,0.22)",
    color: "#10B981",
    desc: "Created tasks",
  },
  {
    title: "Messages",
    key: "totalMessages" as keyof AdminStats,
    icon: MessageSquare,
    gradient: "linear-gradient(135deg,#FB7185,#E11D48)",
    glow: "rgba(251,113,133,0.18)",
    lo: "rgba(251,113,133,0.10)",
    md: "rgba(251,113,133,0.22)",
    color: "#FB7185",
    desc: "Total messages sent",
  },
  {
    title: "Verified Users",
    key: "verifiedUsers" as keyof AdminStats,
    icon: BadgeCheck,
    gradient: "linear-gradient(135deg,#F59E0B,#D97706)",
    glow: "rgba(245,158,11,0.18)",
    lo: "rgba(245,158,11,0.10)",
    md: "rgba(245,158,11,0.22)",
    color: "#F59E0B",
    desc: "Email-verified accounts",
  },
  {
    title: "Admins",
    key: "admins" as keyof AdminStats,
    icon: Shield,
    gradient: "linear-gradient(135deg,#6366F1,#4F46E5)",
    glow: "rgba(99,102,241,0.18)",
    lo: "rgba(99,102,241,0.10)",
    md: "rgba(99,102,241,0.22)",
    color: "#6366F1",
    desc: "Workspace admins",
  },
  {
    title: "Super Admins",
    key: "superAdmins" as keyof AdminStats,
    icon: Crown,
    gradient: "linear-gradient(135deg,#F97316,#EA580C)",
    glow: "rgba(249,115,22,0.18)",
    lo: "rgba(249,115,22,0.10)",
    md: "rgba(249,115,22,0.22)",
    color: "#F97316",
    desc: "Platform super admins",
  },
];

/* ─── animated counter ───────────────────────────────────────────────────── */
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 900;
    const steps    = 40;
    const inc      = value / steps;
    let   current  = 0;
    const timer    = setInterval(() => {
      current += inc;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

/* ─── stat card ──────────────────────────────────────────────────────────── */
function StatCard({ cfg, value, index }: { cfg: typeof CARD_CFG[0]; value: number; index: number }) {
  const [hov, setHov] = useState(false);
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden rounded-2xl cursor-default transition-all duration-300"
      style={{
        background:   T.surface,
        border:       `1px solid ${hov ? cfg.md : T.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:    hov ? `0 8px 40px ${cfg.glow}, 0 0 0 1px ${cfg.md}` : "none",
        transform:    hov ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* background glow blob */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: -30, right: -30,
          width: 120, height: 120, borderRadius: "50%",
          background: cfg.glow, filter: "blur(40px)",
          opacity: hov ? 1 : 0.5,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      />

      {/* top accent line */}
      <div
        className="h-0.5 w-full absolute top-0 left-0 transition-opacity duration-300"
        style={{
          background: cfg.gradient,
          opacity: hov ? 1 : 0,
        }}
      />

      <div className="relative z-10 p-5 sm:p-6">
        {/* icon + badge */}
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: hov ? cfg.gradient : cfg.lo,
              border:     `1px solid ${cfg.md}`,
              boxShadow:  hov ? `0 4px 16px ${cfg.glow}` : "none",
            }}
          >
            <Icon size={19} style={{ color: hov ? "#fff" : cfg.color }} />
          </div>

          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
            style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}` }}
          >
            <TrendingUp size={10} />
            Live
          </div>
        </div>

        {/* value */}
        <div
          className="text-3xl sm:text-4xl font-bold mb-1.5 tabular-nums"
          style={{ color: "#fff", fontFamily: "'Sora', sans-serif" }}
        >
          <Counter value={value} />
        </div>

        {/* title */}
        <p className="text-sm font-semibold" style={{ color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
          {cfg.title}
        </p>

        {/* desc */}
        <p className="text-xs mt-0.5" style={{ color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
          {cfg.desc}
        </p>

        {/* bottom mini bar */}
        <div className="mt-4 h-0.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / 500) * 100, 100)}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 + 0.3 }}
            className="h-full rounded-full"
            style={{ background: cfg.gradient }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res  = await fetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } catch (error) {
        console.error("ADMIN STATS ERROR:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}
            >
              <Activity size={28} style={{ color: T.accent }} className="animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping" style={{ background: T.accentLo, animationDuration: "2s" }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold" style={{ color: T.text, fontFamily: "'DM Sans',sans-serif" }}>Loading dashboard…</p>
            <p className="text-xs" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Fetching platform statistics</p>
          </div>
        </div>
      </div>
    );
  }

  const totalActivity = (stats?.totalMessages || 0) + (stats?.totalTasks || 0);
  const verifiedPct   = stats?.totalUsers
    ? Math.round(((stats.verifiedUsers || 0) / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* ── ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-160, left:-120, width:600, height:600, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", top:200, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(124,58,237,0.06)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", bottom:-100, left:"30%", width:500, height:400, borderRadius:"50%", background:"rgba(34,211,238,0.04)", filter:"blur(120px)" }} />

        {/* subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(99,140,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,140,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          {/* top bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div className="flex items-center gap-4">
              {/* logo mark */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg,#3D7BFF,#7C3AED)",
                  boxShadow: "0 4px 24px rgba(61,123,255,0.35)",
                }}
              >
                <Activity size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1
                    className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Sora',sans-serif" }}
                  >
                    NexSyncHub
                  </h1>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, letterSpacing:"0.05em" }}
                  >
                    ADMIN
                  </span>
                </div>
                <p className="text-sm" style={{ color: T.muted }}>Platform overview dashboard</p>
              </div>
            </div>

            {/* live indicator */}
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm"
              style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter:"blur(20px)" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.emerald }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.emerald }} />
              </span>
              <span className="font-medium" style={{ color: T.text }}>Live Data</span>
            </div>
          </div>

          {/* summary strip */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter:"blur(20px)" }}
          >
            {[
              {
                label: "Platform Activity",
                value: totalActivity.toLocaleString(),
                sub: "messages + tasks",
                color: T.accent,
                icon: MessageSquare,
              },
              {
                label: "Verified Rate",
                value: `${verifiedPct}%`,
                sub: "of total users",
                color: T.emerald,
                icon: BadgeCheck,
              },
              {
                label: "Admin Coverage",
                value: `${(stats?.admins || 0) + (stats?.superAdmins || 0)}`,
                sub: "admins + super admins",
                color: "#F59E0B",
                icon: Crown,
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}
                  >
                    <Icon size={15} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: T.muted }}>{s.label}</p>
                    <p className="text-lg font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>{s.value}</p>
                    <p className="text-xs" style={{ color: T.muted }}>{s.sub}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden sm:block ml-auto w-px h-8 self-center" style={{ background: T.border }} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION LABEL ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center gap-3 mb-5"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg,${T.accent},${T.cyan})` }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted }}>
              Platform Statistics
            </span>
          </div>
          <div className="flex-1 h-px" style={{ background: T.border }} />
          <span className="text-xs" style={{ color: T.muted }}>{CARD_CFG.length} metrics</span>
        </motion.div>

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {CARD_CFG.map((cfg, i) => (
            <StatCard
              key={cfg.key}
              cfg={cfg}
              value={stats?.[cfg.key] || 0}
              index={i}
            />
          ))}
        </div>

        {/* ── FOOTER NOTE ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-xs mt-10"
          style={{ color: T.muted }}
        >
          Logged in as{" "}
          <span style={{ color: T.accent, fontWeight: 600 }}>
            {session?.user?.name || session?.user?.email || "Admin"}
          </span>
          {" "}· Data refreshes on page load
        </motion.p>

      </div>
    </div>
  );
}