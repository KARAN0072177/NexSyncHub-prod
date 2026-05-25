"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Shield, Ban, AlertTriangle, Bot,
  ImageIcon, Activity, TrendingUp, Zap,
  Users, Lock, Eye,
} from "lucide-react";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.70)",
  surfaceHi:"rgba(10,22,52,0.85)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  gold:     "#F59E0B",
  goldLo:   "rgba(245,158,11,0.12)",
  goldMd:   "rgba(245,158,11,0.25)",
  rose:     "#FF4D6D",
  roseLo:   "rgba(255,77,109,0.12)",
  roseMd:   "rgba(255,77,109,0.25)",
  violet:   "#7C3AED",
  violetLo: "rgba(124,58,237,0.12)",
  violetMd: "rgba(124,58,237,0.25)",
  cyan:     "#22D3EE",
  cyanLo:   "rgba(34,211,238,0.12)",
  cyanMd:   "rgba(34,211,238,0.25)",
  emerald:  "#10B981",
  emeraldLo:"rgba(16,185,129,0.12)",
  emeraldMd:"rgba(16,185,129,0.25)",
  amber:    "#F97316",
  amberLo:  "rgba(249,115,22,0.12)",
  amberMd:  "rgba(249,115,22,0.25)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

interface Stats {
  totalAdmins: number;
  totalSuperAdmins: number;
  totalBannedUsers: number;
  totalSecurityThreats: number;
  totalAIFlags: number;
  unsafeUploads: {
    avatars: number;
    workspaceAvatars: number;
    supportAttachments: number;
    chatAttachments: number;
  };
}

/* ─── animated counter ───────────────────────────────────────────────────── */
function Counter({ value, delay=0 }: { value:number; delay?:number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    const steps = 36; const dur = 800; const inc = value / steps; let cur = 0;
    const start = setTimeout(() => {
      const t = setInterval(() => {
        cur += inc;
        if (cur >= value) { setDisplay(value); clearInterval(t); }
        else setDisplay(Math.floor(cur));
      }, dur / steps);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(start);
  }, [value, delay]);
  return <>{display.toLocaleString()}</>;
}

/* ─── card config ─────────────────────────────────────────────────────────── */
const CARD_CFG = [
  {
    key:      "totalAdmins" as const,
    title:    "Total Admins",
    icon:     Shield,
    color:    T.gold,    lo: T.goldLo,    md: T.goldMd,
    gradient: "linear-gradient(135deg,#F59E0B,#D97706)",
    desc:     "Platform administrators",
    threat:   false,
  },
  {
    key:      "totalSuperAdmins" as const,
    title:    "Super Admins",
    icon:     Crown,
    color:    T.cyan,    lo: T.cyanLo,    md: T.cyanMd,
    gradient: "linear-gradient(135deg,#22D3EE,#0891B2)",
    desc:     "Highest privilege level",
    threat:   false,
  },
  {
    key:      "totalBannedUsers" as const,
    title:    "Banned Users",
    icon:     Ban,
    color:    T.rose,    lo: T.roseLo,    md: T.roseMd,
    gradient: "linear-gradient(135deg,#FF4D6D,#FF6B35)",
    desc:     "Permanently restricted accounts",
    threat:   true,
  },
  {
    key:      "totalSecurityThreats" as const,
    title:    "Security Threats",
    icon:     AlertTriangle,
    color:    T.violet,  lo: T.violetLo,  md: T.violetMd,
    gradient: "linear-gradient(135deg,#7C3AED,#4F46E5)",
    desc:     "Flagged security events",
    threat:   true,
  },
  {
    key:      "totalAIFlags" as const,
    title:    "AI Flags",
    icon:     Bot,
    color:    T.emerald, lo: T.emeraldLo, md: T.emeraldMd,
    gradient: "linear-gradient(135deg,#10B981,#059669)",
    desc:     "AI-detected violations",
    threat:   true,
  },
];

/* ─── StatCard ───────────────────────────────────────────────────────────── */
function StatCard({ cfg, value, index }: { cfg:typeof CARD_CFG[0]; value:number; index:number }) {
  const [hov, setHov] = useState(false);
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity:0, y:22 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45, ease:[0.22,1,0.36,1], delay:index*0.07 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        background:   T.surface,
        border:       `1px solid ${hov ? cfg.md : T.border}`,
        backdropFilter: "blur(20px)",
        boxShadow:    hov ? `0 8px 36px ${cfg.lo}, 0 0 0 1px ${cfg.md}` : "none",
        transform:    hov ? "translateY(-4px)" : "none",
      }}
    >
      {/* top accent */}
      <div className="h-0.5 transition-opacity duration-300"
        style={{ background:cfg.gradient, opacity: hov ? 1 : 0.3 }} />

      {/* threat pulse for danger cards */}
      {cfg.threat && value > 0 && (
        <div className="absolute top-4 right-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background:cfg.color }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background:cfg.color }} />
          </span>
        </div>
      )}

      {/* glow */}
      <div aria-hidden style={{ position:"absolute", top:-30, right:-30, width:140, height:140, borderRadius:"50%", background:cfg.lo, filter:"blur(50px)", opacity: hov ? 1 : 0.5, transition:"opacity 0.4s", pointerEvents:"none" }} />

      <div className="relative z-10 p-5">
        {/* icon + value */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: hov ? cfg.gradient : cfg.lo,
              border: `1px solid ${cfg.md}`,
              boxShadow: hov ? `0 4px 16px ${cfg.lo}` : "none",
            }}>
            <Icon size={20} style={{ color: hov ? "#fff" : cfg.color }} />
          </div>
          <div className="text-right">
            <span className="text-3xl font-black" style={{ color:"#fff", fontFamily:"'Sora',sans-serif" }}>
              <Counter value={value} delay={index*80} />
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily:"'Sora',sans-serif" }}>
          {cfg.title}
        </h3>
        <p className="text-xs" style={{ color:T.muted }}>{cfg.desc}</p>

        {/* mini progress bar */}
        <div className="mt-4 h-0.5 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width:0 }}
            animate={{ width: value > 0 ? "100%" : "0%" }}
            transition={{ duration:1.0, ease:[0.22,1,0.36,1], delay:index*0.07+0.3 }}
            className="h-full rounded-full"
            style={{ background:cfg.gradient }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── UploadsCard ─────────────────────────────────────────────────────────── */
function UploadsCard({ uploads, index }: {
  uploads: Stats["unsafeUploads"] | undefined; index:number;
}) {
  const [hov, setHov] = useState(false);

  const total = uploads
    ? uploads.avatars + uploads.workspaceAvatars + uploads.supportAttachments + uploads.chatAttachments
    : 0;

  const rows = [
    { label:"User Avatars",        value: uploads?.avatars ?? 0,             color:T.rose,    lo:T.roseLo    },
    { label:"Workspace Logos",     value: uploads?.workspaceAvatars ?? 0,    color:T.amber,   lo:T.amberLo   },
    { label:"Support Attachments", value: uploads?.supportAttachments ?? 0,  color:T.violet,  lo:T.violetLo  },
    { label:"Chat Attachments",    value: uploads?.chatAttachments ?? 0,     color:T.emerald, lo:T.emeraldLo },
  ];

  return (
    <motion.div
      initial={{ opacity:0, y:22 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45, ease:[0.22,1,0.36,1], delay:index*0.07 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        background:   T.surface,
        border:       `1px solid ${hov ? T.amberMd : T.border}`,
        backdropFilter: "blur(20px)",
        boxShadow:    hov ? `0 8px 36px ${T.amberLo}, 0 0 0 1px ${T.amberMd}` : "none",
        transform:    hov ? "translateY(-4px)" : "none",
      }}
    >
      <div className="h-0.5 transition-opacity duration-300"
        style={{ background:"linear-gradient(90deg,#F97316,#F59E0B,#EAB308,transparent)", opacity: hov ? 1 : 0.3 }} />

      {/* threat pulse if any */}
      {total > 0 && (
        <div className="absolute top-4 right-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background:T.amber }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background:T.amber }} />
          </span>
        </div>
      )}

      <div aria-hidden style={{ position:"absolute", top:-30, right:-30, width:140, height:140, borderRadius:"50%", background:T.amberLo, filter:"blur(50px)", opacity: hov ? 1 : 0.5, transition:"opacity 0.4s", pointerEvents:"none" }} />

      <div className="relative z-10 p-5">
        {/* icon + total */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{ background: hov ? "linear-gradient(135deg,#F97316,#F59E0B)" : T.amberLo, border:`1px solid ${T.amberMd}`, boxShadow: hov ? `0 4px 16px ${T.amberLo}` : "none" }}>
            <ImageIcon size={20} style={{ color: hov ? "#fff" : T.amber }} />
          </div>
          <span className="text-3xl font-black" style={{ color:"#fff", fontFamily:"'Sora',sans-serif" }}>
            <Counter value={total} delay={index*80} />
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily:"'Sora',sans-serif" }}>
          Unsafe Uploads
        </h3>
        <p className="text-xs mb-5" style={{ color:T.muted }}>Content blocked by AI moderation</p>

        {/* breakdown rows */}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background:row.color }} />
                  <span style={{ color:T.muted }}>{row.label}</span>
                </div>
                <span className="font-semibold" style={{ color:T.text }}>{row.value}</span>
              </div>
              {/* mini bar */}
              <div className="h-0.5 rounded-full" style={{ background:"rgba(255,255,255,0.05)" }}>
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width: total > 0 ? `${Math.min((row.value/total)*100,100)}%` : "0%" }}
                  transition={{ duration:0.9, ease:[0.22,1,0.36,1], delay:0.4+i*0.08 }}
                  className="h-full rounded-full"
                  style={{ background:`linear-gradient(90deg,${row.color},${row.color}80)` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res  = await fetch("/api/admin/super/stats");
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const totalThreats = stats
    ? stats.totalBannedUsers + stats.totalSecurityThreats + stats.totalAIFlags
    : 0;

  const totalUploads = stats?.unsafeUploads
    ? Object.values(stats.unsafeUploads).reduce((a,b) => a+b, 0)
    : 0;

  return (
    <div className="mt-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
      `}</style>

      {/* ── SECTION HEADER ── */}
      <motion.div
        initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.45, ease:[0.22,1,0.36,1] }}
        className="mb-6"
      >
        {/* badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-4 rounded-full"
            style={{ background:"linear-gradient(180deg,#F59E0B,#F97316)" }} />
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color:T.gold, fontFamily:"'DM Sans',sans-serif" }}>
            Platform Governance
          </span>
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background:T.gold }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ background:T.gold }} />
          </span>
        </div>

        {/* summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl"
          style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
          {[
            { icon:Users,         label:"Admin Coverage",   value:`${(stats?.totalAdmins??0)+(stats?.totalSuperAdmins??0)}`, color:T.gold   },
            { icon:AlertTriangle, label:"Active Threats",   value:String(totalThreats),                                       color:T.rose   },
            { icon:Eye,           label:"Blocked Uploads",  value:String(totalUploads),                                       color:T.amber  },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:`${s.color}15`, border:`1px solid ${s.color}28` }}>
                <s.icon size={14} style={{ color:s.color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</p>
                <p className="text-base font-black text-white" style={{ fontFamily:"'Sora',sans-serif" }}>{loading ? "—" : s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse"
              style={{ background:T.surface, border:`1px solid ${T.border}`, height:"148px" }}>
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl" style={{ background:"rgba(99,140,255,0.08)" }} />
                <div className="h-8 w-12 rounded-xl" style={{ background:"rgba(99,140,255,0.06)" }} />
              </div>
              <div className="h-4 w-28 rounded-lg mb-2" style={{ background:"rgba(99,140,255,0.07)" }} />
              <div className="h-3 w-36 rounded-lg" style={{ background:"rgba(99,140,255,0.05)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {CARD_CFG.map((cfg, i) => {
            const value = cfg.key === "totalAdmins"          ? (stats?.totalAdmins ?? 0)
                        : cfg.key === "totalSuperAdmins"     ? (stats?.totalSuperAdmins ?? 0)
                        : cfg.key === "totalBannedUsers"     ? (stats?.totalBannedUsers ?? 0)
                        : cfg.key === "totalSecurityThreats" ? (stats?.totalSecurityThreats ?? 0)
                        :                                      (stats?.totalAIFlags ?? 0);
            return <StatCard key={cfg.key} cfg={cfg} value={value} index={i} />;
          })}
          <UploadsCard uploads={stats?.unsafeUploads} index={5} />
        </div>
      )}

      {/* ── THREAT CALLOUT (if active threats) ── */}
      <AnimatePresence>
        {!loading && totalThreats > 0 && (
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ duration:0.45, delay:0.5, ease:[0.22,1,0.36,1] }}
            className="mt-5 relative overflow-hidden rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ background:T.roseLo, border:`1px solid ${T.roseMd}`, backdropFilter:"blur(20px)" }}
          >
            <div className="h-0.5 absolute top-0 left-0 right-0"
              style={{ background:"linear-gradient(90deg,#FF4D6D,#F97316,transparent)" }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background:"rgba(255,77,109,0.20)", border:`1px solid ${T.roseMd}` }}>
              <Zap size={16} style={{ color:T.rose }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>
                {totalThreats} active threat{totalThreats !== 1 ? "s" : ""} detected
              </p>
              <p className="text-xs" style={{ color:T.muted }}>
                Review banned users, security logs, and AI flags in their respective sections.
              </p>
            </div>
            <span className="text-2xl font-black shrink-0" style={{ color:T.rose, fontFamily:"'Sora',sans-serif" }}>
              {totalThreats}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}