"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2, Plus, Users, Copy, Loader2, ArrowRight,
  Sparkles, Hash, CheckCircle2, XCircle, Bell,
  Activity, Zap, ChevronRight, RefreshCw, Crown,
  Shield, User, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Typewriter } from "react-simple-typewriter";

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
  violet: "#7C3AED",
  violetLo: "rgba(124,58,237,0.12)",
  violetMd: "rgba(124,58,237,0.25)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  emeraldMd: "rgba(16,185,129,0.25)",
  gold: "#F59E0B",
  goldLo: "rgba(245,158,11,0.12)",
  goldMd: "rgba(245,158,11,0.25)",
  rose: "#FF4D6D",
  text: "#E2E8F8",
  muted: "#4A5578",
};

/* ─── role config ────────────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { color: string; lo: string; md: string; icon: React.ElementType }> = {
  OWNER: { color: T.gold, lo: T.goldLo, md: T.goldMd, icon: Crown },
  ADMIN: { color: T.accent, lo: T.accentLo, md: T.accentMd, icon: Shield },
  MEMBER: { color: T.muted, lo: "rgba(74,85,120,0.15)", md: "rgba(74,85,120,0.28)", icon: User },
};

/* ─── greeting ───────────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ show, message, type, onClose }: {
  show: boolean; message: string; type: "success" | "error" | null; onClose: () => void;
}) {
  const isSuccess = type === "success";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, y: 30, scale: 0.92, transition: { duration: 0.2 } }}
          className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl"
          style={{
            background: isSuccess ? "rgba(16,185,129,0.12)" : "rgba(255,77,109,0.12)",
            border: `1px solid ${isSuccess ? "rgba(16,185,129,0.25)" : "rgba(255,77,109,0.25)"}`,
            backdropFilter: "blur(20px)",
            boxShadow: isSuccess ? "0 8px 32px rgba(16,185,129,0.15)" : "0 8px 32px rgba(255,77,109,0.15)",
          }}
        >
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isSuccess ? "rgba(16,185,129,0.20)" : "rgba(255,77,109,0.20)" }}>
            {isSuccess ? <CheckCircle2 size={14} style={{ color: T.emerald }} /> : <XCircle size={14} style={{ color: T.rose }} />}
          </div>
          <span className="text-sm font-semibold" style={{ color: T.text, fontFamily: "'DM Sans',sans-serif" }}>{message}</span>
          <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: T.muted }}>
            <XCircle size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── StatCard ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, lo, md, delay = 0 }: {
  label: string; value: number; icon: React.ElementType; color: string; lo: string; md: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}
    >
      <div aria-hidden style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: lo, filter: "blur(30px)", pointerEvents: "none" }} />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: lo, border: `1px solid ${md}` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-3xl font-black text-white" style={{ fontFamily: "'Sora',sans-serif" }}>{value}</span>
      </div>
      <p className="relative z-10 text-sm font-medium" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{label}</p>
    </motion.div>
  );
}

/* ─── QuickActionCard ────────────────────────────────────────────────────── */
function QuickActionCard({ icon: Icon, label, desc, color, lo, md, gradient, onClick }: {
  icon: React.ElementType; label: string; desc: string;
  color: string; lo: string; md: string; gradient: string; onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 w-full"
      style={{
        background: hov ? lo : "rgba(255,255,255,0.02)",
        border: `1px solid ${hov ? md : T.border}`,
        boxShadow: hov ? `0 8px 32px ${lo}` : "none",
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      <div aria-hidden style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: lo, filter: "blur(40px)", opacity: hov ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none" }} />
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
          style={{ background: hov ? gradient : lo, border: `1px solid ${md}`, boxShadow: hov ? `0 4px 16px ${lo}` : "none" }}>
          <Icon size={18} style={{ color: hov ? "#fff" : color }} />
        </div>
        <h3 className="text-sm font-bold mb-1 transition-colors duration-200"
          style={{ color: hov ? "#fff" : T.text, fontFamily: "'Sora',sans-serif" }}>{label}</h3>
        <p className="text-xs leading-5" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{desc}</p>
        <div className="flex items-center gap-1 mt-3 text-xs font-semibold transition-colors duration-200"
          style={{ color: hov ? color : "transparent", fontFamily: "'DM Sans',sans-serif" }}>
          Go <ChevronRight size={12} />
        </div>
      </div>
    </button>
  );
}

/* ─── WorkspaceCard ──────────────────────────────────────────────────────── */
function WorkspaceCard({ ws, onOpen, onInvite, copying }: {
  ws: any; onOpen: () => void; onInvite: (e: React.MouseEvent) => void; copying: boolean;
}) {
  const [hov, setHov] = useState(false);
  const roleCfg = ROLE_CFG[ws.role as keyof typeof ROLE_CFG] ?? ROLE_CFG.MEMBER;
  const RoleIcon = roleCfg.icon;
  const name = ws.name ?? "Workspace";
  const initials = name.slice(0, 2).toUpperCase();
  const hue = name.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onOpen}
      className="relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 flex flex-col min-h-[180px]"
      style={{
        background: T.surface,
        border: `1px solid ${hov ? T.borderHi : T.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: hov ? `0 12px 40px rgba(61,123,255,0.10)` : "none",
        transform: hov ? "translateY(-3px)" : "none",
      }}
    >
      {/* top accent */}
      <div className="h-0.5 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg,${T.accent},${T.violet},transparent)`, opacity: hov ? 1 : 0 }} />
      {/* glow blob */}
      <div aria-hidden style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: T.accentLo, filter: "blur(50px)", opacity: hov ? 0.8 : 0, transition: "opacity 0.4s", pointerEvents: "none" }} />

      <div className="relative z-10 p-5 sm:p-6 flex flex-col flex-1">
        {/* top row */}
        <div className="flex items-start gap-3.5 mb-auto">
          {/* avatar */}
          {ws.avatar ? (
            <img src={ws.avatar} alt={name} className="w-12 h-12 rounded-2xl object-cover shrink-0"
              style={{ border: `1px solid ${T.borderHi}` }} />
          ) : (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: `hsla(${hue},65%,45%,0.15)`, border: `1px solid hsla(${hue},65%,45%,0.28)`, color: `hsl(${hue},70%,68%)`, fontFamily: "'Sora',sans-serif" }}>
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-bold truncate text-white" style={{ fontFamily: "'Sora',sans-serif" }}>
                {name}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase"
              style={{ background: roleCfg.lo, color: roleCfg.color, border: `1px solid ${roleCfg.md}`, letterSpacing: "0.06em" }}>
              <RoleIcon size={9} />
              {ws.role}
            </span>
          </div>

          {/* open arrow */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
            style={{ background: hov ? T.accentLo : "rgba(255,255,255,0.03)", border: `1px solid ${hov ? T.accentMd : T.border}`, color: hov ? T.accent : T.muted }}>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between mt-5 pt-4"
          style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: T.muted }}>
            <Users size={11} />
            Team Workspace
          </div>
          <button
            onClick={onInvite}
            disabled={copying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
            style={{
              background: copying ? T.emeraldLo : T.accentLo,
              border: `1px solid ${copying ? T.emeraldMd : T.accentMd}`,
              color: copying ? T.emerald : T.accent,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {copying ? <><CheckCircle2 size={11} /> Copied!</> : <><Copy size={11} /> Invite</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function WorkspaceSkeleton() {
  return (
    <div className="rounded-3xl p-6 animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <div className="flex items-start gap-3 mb-auto">
        <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: "rgba(99,140,255,0.08)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg" style={{ background: "rgba(99,140,255,0.08)" }} />
          <div className="h-3 w-1/3 rounded-lg" style={{ background: "rgba(99,140,255,0.06)" }} />
        </div>
      </div>
      <div className="flex justify-between items-center mt-8 pt-4 border-t" style={{ borderColor: T.border }}>
        <div className="h-3 w-24 rounded-lg" style={{ background: "rgba(99,140,255,0.06)" }} />
        <div className="h-7 w-16 rounded-xl" style={{ background: "rgba(99,140,255,0.08)" }} />
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = (session?.user as any)?.username || session?.user?.name?.split(" ")[0] || "";
  const greeting = getGreeting();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | null }>({ show: false, message: "", type: null });
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wRes, dRes] = await Promise.all([
          fetch("/api/workspace/my"),
          fetch("/api/dashboard"),
        ]);
        const wData = await wRes.json();
        const dData = await dRes.json();
        if (wRes.ok) setWorkspaces(wData.workspaces);
        if (dRes.ok) setDashboard(dData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleInvite = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    setCopyingId(workspaceId);
    try {
      const res = await fetch("/api/invite/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (res.ok) {

        await navigator.clipboard.writeText(
          data.inviteLink
        );

        setInviteModalOpen(false);

        showToast(
          "Invite link copied to clipboard!",
          "success"
        );

      }
      else showToast(data.error || "Failed to generate invite", "error");
    } catch { showToast("Something went wrong.", "error"); }
    finally { setCopyingId(null); }
  };

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -180, left: -140, width: 700, height: 700, borderRadius: "50%", background: "rgba(61,123,255,0.07)", filter: "blur(140px)" }} />
        <div style={{ position: "absolute", top: "40%", right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 space-y-8">

        {/* ── WELCOME HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(28px)" }}
        >
          {/* accent bar */}
          <div className="h-0.5 absolute top-0 left-0 right-0" style={{ background: `linear-gradient(90deg,${T.accent},${T.violet},${T.emerald},transparent)` }} />
          {/* glow */}
          <div aria-hidden style={{ position: "absolute", top: -80, right: -60, width: 320, height: 320, borderRadius: "50%", background: `rgba(61,123,255,0.09)`, filter: "blur(80px)", pointerEvents: "none" }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => router.push("/dashboard/profile")}
              className="relative shrink-0 cursor-pointer"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              {(session?.user as any)?.avatar || session?.user?.image ? (
                <img
                  src={(session?.user as any)?.avatar || session?.user?.image}
                  alt={userName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover"
                  style={{ border: `2px solid ${T.accentMd}`, boxShadow: `0 0 0 4px ${T.accentLo}` }}
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg,${T.accentLo},${T.violetLo})`, border: `2px solid ${T.accentMd}`, boxShadow: `0 0 0 4px ${T.accentLo}` }}>
                  <span className="text-3xl sm:text-4xl font-black" style={{ color: T.accent, fontFamily: "'Sora',sans-serif" }}>
                    {userName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
              {/* online dot */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: T.bg, padding: 2 }}>
                <div className="w-full h-full rounded-full" style={{ background: T.emerald, boxShadow: `0 0 6px ${T.emerald}` }} />
              </div>
            </motion.div>

            {/* text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, letterSpacing: "0.04em" }}>
                  <Sparkles size={11} />
                  NexSyncHub Dashboard
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3"
                style={{ fontFamily: "'Sora',sans-serif" }}>
                <Typewriter
                  words={[
                    `${greeting}${userName ? `, ${userName}` : ""}`,
                    "Welcome to NexSyncHub",
                    "Let's build something great",
                  ]}
                  loop={true}
                  cursor
                  cursorStyle="_"
                  typeSpeed={70}
                  deleteSpeed={50}
                  delaySpeed={2000}
                />
                <motion.span
                  className="inline-block ml-3"
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  style={{ transformOrigin: "70% 70%", display: "inline-block" }}
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-base leading-relaxed max-w-xl" style={{ color: T.muted }}>
                Stay updated with your workspaces, activity, notifications, and team collaboration in one place.
              </p>
            </div>

            {/* create btn */}
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/dashboard/create")}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold text-white shrink-0"
              style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: "0 6px 24px rgba(61,123,255,0.35)", fontFamily: "'DM Sans',sans-serif" }}
            >
              <Plus size={16} /> New Workspace
            </motion.button>
          </div>
        </motion.div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard label="Workspaces" value={dashboard?.stats?.workspaceCount || 0} icon={Building2} color={T.accent} lo={T.accentLo} md={T.accentMd} delay={0.05} />
          <StatCard label="Pending Tasks" value={dashboard?.stats?.pendingTasks || 0} icon={Hash} color={T.gold} lo={T.goldLo} md={T.goldMd} delay={0.10} />
          <StatCard label="Notifications" value={dashboard?.stats?.unreadNotifications || 0} icon={Bell} color={T.emerald} lo={T.emeraldLo} md={T.emeraldMd} delay={0.15} />
        </div>

        {/* ── QUICK ACTIONS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg,${T.accent},${T.violet})` }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted }}>Quick Actions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionCard
              icon={Plus} label="Create Workspace" desc="Start collaborating with your team instantly."
              color={T.accent} lo={T.accentLo} md={T.accentMd}
              gradient={`linear-gradient(135deg,${T.accent},${T.violet})`}
              onClick={() => router.push("/dashboard/create")}
            />
            <QuickActionCard
              icon={Users} label="Invite Members" desc="Bring teammates into your workspace."
              color={T.violet} lo={T.violetLo} md={T.violetMd}
              gradient={`linear-gradient(135deg,${T.violet},#4F46E5)`}
              onClick={() => setInviteModalOpen(true)}
            />
            <QuickActionCard
              icon={Sparkles} label="AI Insights" desc="Review smart workspace insights."
              color={T.emerald} lo={T.emeraldLo} md={T.emeraldMd}
              gradient={`linear-gradient(135deg,${T.emerald},#059669)`}
            />
          </div>
        </motion.div>

        {/* ── RECENT ACTIVITY ── */}
        {dashboard?.recentActivity?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.45 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg,${T.violet},${T.emerald})` }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted }}>Recent Activity</span>
            </div>
            <div className="relative overflow-hidden rounded-3xl"
              style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
              <div className="h-0.5" style={{ background: `linear-gradient(90deg,${T.violet},${T.accent},transparent)` }} />
              <div className="p-5 space-y-2">
                {dashboard.recentActivity.slice(0, 5).map((activity: any, i: number) => (
                  <motion.div key={activity._id ?? i}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 + i * 0.06 }}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.border = `1px solid ${T.accentMd}`; el.style.background = T.accentLo; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.border = `1px solid ${T.border}`; el.style.background = "rgba(255,255,255,0.02)"; }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                      <Activity size={13} style={{ color: T.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: T.text }}>
                        {activity.action?.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span className="text-xs shrink-0 flex items-center gap-1" style={{ color: T.muted }}>
                      <RefreshCw size={9} />
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── WORKSPACES ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.45 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg,${T.gold},${T.accent})` }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted }}>Your Workspaces</span>
              {workspaces.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: T.accentLo, color: T.accent }}>
                  {workspaces.length}
                </span>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/dashboard/create")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: T.accentLo, border: `1px solid ${T.accentMd}`, color: T.accent, fontFamily: "'DM Sans',sans-serif" }}
            >
              <Plus size={13} /> New
            </motion.button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <WorkspaceSkeleton key={i} />)}
            </div>
          ) : workspaces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-20 text-center rounded-3xl"
              style={{ background: T.surface, border: `1px dashed ${T.borderHi}`, backdropFilter: "blur(20px)" }}
            >
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                <Building2 size={26} style={{ color: T.accent }} />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1" style={{ fontFamily: "'Sora',sans-serif" }}>No workspaces yet</p>
                <p className="text-sm" style={{ color: T.muted }}>Create your first workspace to start collaborating with your team.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/dashboard/create")}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: "0 6px 24px rgba(61,123,255,0.35)", fontFamily: "'DM Sans',sans-serif" }}
              >
                <Sparkles size={15} /> Create Your First Workspace <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((ws, i) => (
                  <WorkspaceCard
                    key={ws._id}
                    ws={ws}
                    onOpen={() => router.push(`/workspace/${ws._id}`)}
                    onInvite={e => handleInvite(e, ws._id)}
                    copying={copyingId === ws._id}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

      </div>

      {/* Invite Workspace Modal */}
      <AnimatePresence>

        {inviteModalOpen && (

          <motion.div

            initial={{
              opacity: 0,
            }}

            animate={{
              opacity: 1,
            }}

            exit={{
              opacity: 0,
            }}

            className="fixed inset-0 z-[150] flex items-center justify-center p-4"

          >

            {/* Backdrop */}
            <div

              className="absolute inset-0"

              onClick={() =>
                setInviteModalOpen(false)
              }

              style={{

                background:
                  "rgba(0,0,0,0.6)",

                backdropFilter:
                  "blur(14px)",

              }}

            />

            {/* Modal */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.92,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
                y: 20,
              }}
              transition={{
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative w-full max-w-2xl rounded-[2rem] overflow-hidden"
              style={{
                background:
                  "rgba(0,0,0,0.3)",
                border:
                  `1px solid ${T.borderHi}`,
                backdropFilter:
                  "blur(30px)",
                boxShadow:
                  "0 24px 80px rgba(0,0,0,0.45)",
              }}
            >
              {/* Top Glow */}
              <div
                className="h-1"
                style={{
                  background:
                    `linear-gradient(90deg,${T.violet},${T.accent},transparent)`,
                }}
              />

              {/* ambient glow inside modal */}
              <div aria-hidden style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: T.violetLo, filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

              <div className="relative z-10 p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div>
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
                      style={{
                        background:
                          T.violetLo,
                        border:
                          `1px solid ${T.violetMd}`,
                        color:
                          T.violet,
                      }}
                    >
                      <Users size={13} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Invite Members
                      </span>
                    </div>
                    <h2
                      className="text-3xl font-black text-white mb-2"
                      style={{
                        fontFamily:
                          "'Sora',sans-serif",
                      }}
                    >
                      Select Workspace
                    </h2>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color:
                          T.muted,
                      }}
                    >
                      Choose a workspace to generate and copy an invite link.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setInviteModalOpen(false)
                    }
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                      background:
                        "rgba(255,255,255,0.03)",
                      border:
                        `1px solid ${T.border}`,
                      color:
                        T.muted,
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                </div>
                {/* Workspace List */}
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {workspaces.map((ws) => {
                    const roleCfg =
                      ROLE_CFG[
                      ws.role as keyof typeof ROLE_CFG
                      ] ?? ROLE_CFG.MEMBER;
                    const RoleIcon =
                      roleCfg.icon;
                    return (
                      <motion.div
                        key={ws._id}
                        whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                        className="group rounded-3xl p-5 transition-all duration-300"
                        style={{
                          background:
                            "rgba(255,255,255,0.02)",
                          border:
                            `1px solid ${T.border}`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Left */}
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Avatar */}
                            {ws.avatar ? (
                              <img
                                src={ws.avatar}
                                alt={ws.name}
                                className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-lg"
                                style={{
                                  border:
                                    `1px solid ${T.borderHi}`,
                                }}
                              />
                            ) : (
                              <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-lg"
                                style={{
                                  background:
                                    `linear-gradient(135deg,${T.accentLo},${T.violetLo})`,
                                  border:
                                    `1px solid ${T.accentMd}`,
                                  color:
                                    T.accent,
                                }}
                              >
                                {ws.name
                                  ?.slice(0, 2)
                                  ?.toUpperCase()}
                              </div>
                            )}
                            {/* Info */}
                            <div className="min-w-0">
                              <h3
                                className="text-lg font-bold text-white truncate"
                                style={{
                                  fontFamily:
                                    "'Sora',sans-serif",
                                }}
                              >
                                {ws.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase"
                                  style={{
                                    background:
                                      roleCfg.lo,
                                    border:
                                      `1px solid ${roleCfg.md}`,
                                    color:
                                      roleCfg.color,
                                  }}
                                >
                                  <RoleIcon size={9} />
                                  {ws.role}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{
                                    color:
                                      T.muted,
                                  }}
                                >
                                  Team Workspace
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Invite Button */}
                          <motion.button
                            whileHover={{
                              scale: 1.03,
                            }}
                            whileTap={{
                              scale: 0.97,
                            }}
                            onClick={(e) =>
                              handleInvite(
                                e,
                                ws._id
                              )
                            }
                            disabled={
                              copyingId === ws._id
                            }
                            className="relative flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shrink-0 min-w-[160px] overflow-hidden transition-all duration-300"
                            style={{
                              background:
                                copyingId === ws._id
                                  ? T.emeraldLo
                                  : T.accentLo,
                              border:
                                `1px solid ${copyingId === ws._id
                                  ? T.emeraldMd
                                  : T.accentMd
                                }`,
                              color:
                                copyingId === ws._id
                                  ? T.emerald
                                  : T.accent,
                            }}
                          >
                            {/* Hover overlay for gradient */}
                            <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity" style={{ background: `linear-gradient(90deg, ${T.accent}, ${T.violet})` }} />
                            
                            <AnimatePresence mode="popLayout" initial={false}>
                              {copyingId === ws._id ? (
                                <motion.div key="copied" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex items-center gap-2 relative z-10">
                                  <CheckCircle2 size={15} /> Copied!
                                </motion.div>
                              ) : (
                                <motion.div key="copy" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex items-center gap-2 relative z-10">
                                  <Copy size={15} /> Generate Invite
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>

        )}

      </AnimatePresence>

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}