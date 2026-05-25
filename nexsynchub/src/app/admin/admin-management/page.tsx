"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Shield, Users, Loader2, Sparkles, X,
  ChevronUp, ChevronDown, Check, AlertTriangle,
  Search, RefreshCw, Lock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.70)",
  surfaceHi:"rgba(10,22,52,0.92)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  violet:   "#7C3AED",
  violetLo: "rgba(124,58,237,0.12)",
  violetMd: "rgba(124,58,237,0.25)",
  emerald:  "#10B981",
  emeraldLo:"rgba(16,185,129,0.12)",
  emeraldMd:"rgba(16,185,129,0.25)",
  gold:     "#F59E0B",
  goldLo:   "rgba(245,158,11,0.12)",
  goldMd:   "rgba(245,158,11,0.25)",
  rose:     "#FF4D6D",
  roseLo:   "rgba(255,77,109,0.12)",
  roseMd:   "rgba(255,77,109,0.25)",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

interface User {
  _id: string; username?: string; email: string;
  role: string; avatar?: string; createdAt: string; isBanned?: boolean;
}

/* ─── role config ────────────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { icon:React.ElementType; color:string; lo:string; md:string; label:string }> = {
  super_admin: { icon:Crown,  color:T.gold,   lo:T.goldLo,   md:T.goldMd,   label:"Super Admin" },
  admin:       { icon:Shield, color:T.accent, lo:T.accentLo, md:T.accentMd, label:"Admin"       },
  user:        { icon:Users,  color:T.muted,  lo:"rgba(74,85,120,0.15)", md:"rgba(74,85,120,0.28)", label:"User" },
};

function getRoleCfg(role: string) { return ROLE_CFG[role] ?? ROLE_CFG.user; }

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function UserAvatar({ user }: { user: User }) {
  const letter = (user.username?.[0] ?? user.email[0]).toUpperCase();
  const cfg    = getRoleCfg(user.role);
  return user.avatar ? (
    <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-2xl object-cover shrink-0"
      style={{ border:`1px solid ${cfg.md}` }} />
  ) : (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
      style={{ background:cfg.lo, border:`1px solid ${cfg.md}`, color:cfg.color, fontFamily:"'Sora',sans-serif" }}>
      {letter}
    </div>
  );
}

/* ─── RoleBadge ──────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const cfg  = getRoleCfg(role);
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background:cfg.lo, color:cfg.color, border:`1px solid ${cfg.md}`, fontFamily:"'DM Sans',sans-serif" }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

/* ─── StatusBadge ────────────────────────────────────────────────────────── */
function StatusBadge({ isBanned }: { isBanned?: boolean }) {
  return isBanned ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background:T.roseLo, color:T.rose, border:`1px solid ${T.roseMd}` }}>
      Banned
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background:T.emeraldLo, color:T.emerald, border:`1px solid ${T.emeraldMd}` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:T.emerald }} />
      Active
    </span>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse" style={{ borderBottom:`1px solid ${T.border}` }}>
      <div className="w-10 h-10 rounded-2xl shrink-0" style={{ background:"rgba(99,140,255,0.08)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded-lg" style={{ background:"rgba(99,140,255,0.08)" }} />
        <div className="h-3 w-48 rounded-lg"   style={{ background:"rgba(99,140,255,0.05)" }} />
      </div>
      <div className="h-6 w-20 rounded-xl" style={{ background:"rgba(99,140,255,0.07)" }} />
      <div className="h-6 w-16 rounded-xl" style={{ background:"rgba(99,140,255,0.06)" }} />
      <div className="h-3 w-20 rounded-lg" style={{ background:"rgba(99,140,255,0.05)" }} />
      <div className="h-8 w-20 rounded-xl" style={{ background:"rgba(99,140,255,0.08)" }} />
    </div>
  );
}

/* ─── StyledTextarea ─────────────────────────────────────────────────────── */
function StyledTextarea({ value, onChange, placeholder, rows=5, pulsing }: {
  value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number; pulsing?:boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      animate={{
        borderColor:     pulsing ? T.violet : focused ? T.accentMd : T.border,
        boxShadow:       pulsing ? `0 0 0 3px ${T.violetLo}, 0 0 20px ${T.violetLo}` : focused ? `0 0 0 3px ${T.accentLo}` : "none",
        backgroundColor: pulsing ? T.violetLo : focused ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
      }}
      transition={{ duration:0.4 }}
      className="rounded-2xl"
      style={{ border:`1px solid ${T.border}` }}
    >
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-5 py-4 text-sm outline-none resize-none"
        style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }} />
    </motion.div>
  );
}

/* ─── Action Modal ───────────────────────────────────────────────────────── */
function ActionModal({ user, targetRole, reason, setReason, onClose, onConfirm, loading, enhancing, onEnhance, aiPulse }: {
  user:User; targetRole:string; reason:string; setReason:(v:string)=>void;
  onClose:()=>void; onConfirm:()=>void; loading:boolean; enhancing:boolean;
  onEnhance:()=>void; aiPulse:boolean;
}) {
  const isPromote   = targetRole === "admin";
  const color       = isPromote ? T.accent : T.rose;
  const lo          = isPromote ? T.accentLo : T.roseLo;
  const md          = isPromote ? T.accentMd : T.roseMd;
  const gradient    = isPromote ? `linear-gradient(135deg,${T.accent},${T.violet})` : "linear-gradient(135deg,#FF4D6D,#F97316)";
  const ActionIcon  = isPromote ? ChevronUp : ChevronDown;

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} className="absolute inset-0"
        style={{ background:"rgba(2,4,12,0.85)", backdropFilter:"blur(12px)" }} />

      <motion.div
        initial={{ opacity:0, y:32, scale:0.97 }}
        animate={{ opacity:1, y:0, scale:1, transition:{ duration:0.35, ease:[0.22,1,0.36,1] } }}
        exit={{ opacity:0, y:20, scale:0.97, transition:{ duration:0.2 } }}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background:T.surfaceHi, border:`1px solid ${md}`, backdropFilter:"blur(40px)" }}
      >
        {/* accent bar */}
        <div className="h-0.5" style={{ background:gradient }} />
        {/* glow */}
        <div aria-hidden style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:lo, filter:"blur(60px)", pointerEvents:"none", zIndex:0 }} />

        <div className="relative z-10 p-7">
          {/* header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background:lo, border:`1px solid ${md}` }}>
                <ActionIcon size={18} style={{ color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>
                  {isPromote ? "Promote to Admin" : "Demote to User"}
                </h2>
                <p className="text-xs mt-0.5" style={{ color:T.muted }}>
                  This action will be logged and emailed to the user.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-2xl transition-colors"
              style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.muted }}>
              <X size={15} />
            </button>
          </div>

          {/* user preview */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl mb-6"
            style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}` }}>
            <UserAvatar user={user} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.username ?? "Unnamed"}</p>
              <p className="text-xs truncate" style={{ color:T.muted }}>{user.email}</p>
            </div>
            <div className="ml-auto shrink-0 flex items-center gap-2">
              <RoleBadge role={user.role} />
              <span style={{ color:T.muted, fontSize:12 }}>→</span>
              <RoleBadge role={targetRole} />
            </div>
          </div>

          {/* reason textarea */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color:T.muted }}>
              Reason <span className="normal-case font-normal">(required for audit log)</span>
            </label>
            <StyledTextarea value={reason} onChange={setReason}
              placeholder="Explain the reason for this role change…"
              rows={4} pulsing={aiPulse} />
          </div>

          {/* AI enhance */}
          <div className="flex justify-end mb-6">
            <button onClick={onEnhance} disabled={enhancing || !reason.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background:T.violetLo, border:`1px solid ${T.violetMd}`, color:"#C4B5FD", fontFamily:"'DM Sans',sans-serif" }}>
              {enhancing ? <><Loader2 size={13} className="animate-spin" /> Enhancing…</> : <><Sparkles size={13} /> Enhance with AI</>}
            </button>
          </div>

          {/* confirmation warning for demotion */}
          {!isPromote && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl mb-6"
              style={{ background:T.roseLo, border:`1px solid ${T.roseMd}` }}>
              <AlertTriangle size={14} style={{ color:T.rose, marginTop:2 }} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-5" style={{ color:"rgba(255,180,190,0.85)" }}>
                Removing admin access revokes all moderation privileges immediately. The user will be notified by email.
              </p>
            </div>
          )}

          {/* footer */}
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
              style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading || !reason.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background:gradient, boxShadow:`0 4px 20px ${color}40`, fontFamily:"'DM Sans',sans-serif" }}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                : <><Check size={14} /> {isPromote ? "Promote" : "Demote"}</>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AdminManagementPage() {
  const [users, setUsers]               = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [selectedUser, setSelectedUser] = useState<User|null>(null);
  const [targetRole, setTargetRole]     = useState("");
  const [reason, setReason]             = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [enhancing, setEnhancing]       = useState(false);
  const [aiPulse, setAiPulse]           = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/admin-management/list");
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEnhance = async () => {
    if (!reason.trim()) return;
    try {
      setEnhancing(true);
      const res  = await fetch("/api/admin/ai-enhance-moderation", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ reason, type:"role_management" }),
      });
      const data = await res.json();
      if (res.ok) { setReason(data.reason); setAiPulse(true); setTimeout(() => setAiPulse(false), 2500); }
    } catch (err) { console.error(err); }
    finally { setEnhancing(false); }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res  = await fetch(`/api/admin/admin-management/${selectedUser._id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ role:targetRole, reason }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      await fetchUsers();
      setSelectedUser(null); setReason(""); setTargetRole("");
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q
      || (u.username ?? "").toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || u.role.toLowerCase().includes(q);
  });

  const admins      = users.filter(u => u.role === "admin").length;
  const superAdmins = users.filter(u => u.role === "super_admin").length;
  const regulars    = users.filter(u => u.role === "user").length;

  return (
    <div className="min-h-screen" style={{ background:T.bg, color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-160, left:-120, width:600, height:600, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", top:300, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(245,158,11,0.05)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

        {/* HEADER */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,#F59E0B,#D97706)", boxShadow:"0 4px 20px rgba(245,158,11,0.35)" }}>
                <Crown size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>
                  Admin Management
                </h1>
                <p className="text-sm" style={{ color:T.muted }}>Platform governance and role assignment</p>
              </div>
            </div>

            {/* live pill */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl"
              style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background:T.emerald }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:T.emerald }} />
              </span>
              <span className="text-sm font-semibold" style={{ color:T.text }}>{users.length}</span>
              <span className="text-sm" style={{ color:T.muted }}>total users</span>
            </div>
          </div>
        </motion.div>

        {/* STATS STRIP */}
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08, duration:0.45 }}
          className="grid grid-cols-3 gap-3 mb-7 p-4 rounded-2xl"
          style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
          {[
            { label:"Super Admins", value:superAdmins, color:T.gold,   lo:T.goldLo,   md:T.goldMd,   icon:Crown  },
            { label:"Admins",       value:admins,      color:T.accent, lo:T.accentLo, md:T.accentMd, icon:Shield },
            { label:"Users",        value:regulars,    color:T.muted,  lo:"rgba(74,85,120,0.15)", md:"rgba(74,85,120,0.28)", icon:Users  },
          ].map(({ label, value, color, lo, md, icon:Icon }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:lo, border:`1px solid ${md}` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color:T.muted }}>{label}</p>
                <p className="text-lg font-black text-white" style={{ fontFamily:"'Sora',sans-serif" }}>
                  {loading ? "—" : value}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* SEARCH */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12, duration:0.4 }} className="mb-5">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:T.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or role…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{ background:T.surface, border:`1px solid ${search ? T.accentMd : T.border}`, color:T.text, backdropFilter:"blur(20px)", boxShadow:search ? `0 0 0 3px ${T.accentLo}` : "none" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg" style={{ background:"rgba(255,255,255,0.06)", color:T.muted }}>
                <X size={12} />
              </button>
            )}
          </div>
        </motion.div>

        {/* TABLE */}
        <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.5, ease:[0.22,1,0.36,1] }}
          className="rounded-3xl overflow-hidden"
          style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }}>
          {/* top accent */}
          <div className="h-0.5" style={{ background:`linear-gradient(90deg,${T.gold},${T.accent},${T.violet},transparent)` }} />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {["User","Role","Status","Joined","Actions"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                      style={{ color:T.muted, background:"rgba(6,12,32,0.60)", fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.07em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => <tr key={i}><td colSpan={5}><SkeletonRow /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center gap-3 py-20 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                          <Users size={20} style={{ color:T.accent }} />
                        </div>
                        <p className="text-sm font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filtered.map((user, idx) => {
                      const isSuper = user.role === "super_admin";
                      const isAdmin = user.role === "admin";
                      const isLast  = idx === filtered.length - 1;

                      return (
                        <motion.tr
                          key={user._id}
                          layout
                          initial={{ opacity:0, y:8 }}
                          animate={{ opacity:1, y:0 }}
                          exit={{ opacity:0, x:-16, transition:{ duration:0.18 } }}
                          transition={{ duration:0.3, ease:[0.22,1,0.36,1], delay: idx < 15 ? idx*0.03 : 0 }}
                          className="group transition-colors duration-150"
                          style={{ borderBottom: isLast ? "none" : `1px solid ${T.border}` }}
                          onMouseEnter={e => (e.currentTarget.style.background="rgba(61,123,255,0.04)")}
                          onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                        >
                          {/* User */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user.username ?? "Unnamed"}</p>
                                <p className="text-xs truncate mt-0.5" style={{ color:T.muted }}>{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-5 py-4"><RoleBadge role={user.role} /></td>

                          {/* Status */}
                          <td className="px-5 py-4"><StatusBadge isBanned={user.isBanned} /></td>

                          {/* Joined */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium" style={{ color:T.text }}>
                                {new Date(user.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                              </span>
                              <span className="text-xs" style={{ color:T.muted }}>
                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix:true })}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            {isSuper ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                                style={{ background:T.goldLo, color:T.gold, border:`1px solid ${T.goldMd}` }}>
                                <Lock size={10} /> Protected
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                {isAdmin ? (
                                  <button
                                    onClick={() => { setSelectedUser(user); setTargetRole("user"); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                                    style={{ background:T.roseLo, border:`1px solid ${T.roseMd}`, color:T.rose, fontFamily:"'DM Sans',sans-serif" }}>
                                    <ChevronDown size={12} /> Demote
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setSelectedUser(user); setTargetRole("admin"); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                                    style={{ background:T.accentLo, border:`1px solid ${T.accentMd}`, color:T.accent, fontFamily:"'DM Sans',sans-serif" }}>
                                    <ChevronUp size={12} /> Promote
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* table footer */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop:`1px solid ${T.border}`, background:"rgba(6,12,32,0.40)" }}>
              <p className="text-xs" style={{ color:T.muted }}>
                Showing <span style={{ color:T.text, fontWeight:600 }}>{filtered.length}</span> of{" "}
                <span style={{ color:T.text, fontWeight:600 }}>{users.length}</span> users
              </p>
              <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color:T.muted }} onMouseEnter={e => (e.currentTarget.style.color=T.accent)} onMouseLeave={e => (e.currentTarget.style.color=T.muted)}>
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
          )}
        </motion.div>

      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <ActionModal
            user={selectedUser}
            targetRole={targetRole}
            reason={reason}
            setReason={setReason}
            onClose={() => { setSelectedUser(null); setReason(""); setTargetRole(""); }}
            onConfirm={handleRoleUpdate}
            loading={actionLoading}
            enhancing={enhancing}
            onEnhance={handleEnhance}
            aiPulse={aiPulse}
          />
        )}
      </AnimatePresence>
    </div>
  );
}