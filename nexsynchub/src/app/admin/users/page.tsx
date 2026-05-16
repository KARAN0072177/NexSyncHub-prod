"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, Crown, BadgeCheck, Users, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── design tokens (matches AdminPage) ─────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.70)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  emerald:  "#10B981",
  gold:     "#F59E0B",
  violet:   "#7C3AED",
  rose:     "#FB7185",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

interface User {
  _id: string;
  username?: string;
  email: string;
  role: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

/* ─── role config ────────────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { label: string; icon: React.ElementType; color: string; lo: string; md: string; gradient: string }> = {
  super_admin: {
    label: "Super Admin",
    icon: Crown,
    color: T.gold,
    lo: "rgba(245,158,11,0.12)",
    md: "rgba(245,158,11,0.25)",
    gradient: "linear-gradient(135deg,#F59E0B,#D97706)",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: T.accent,
    lo: T.accentLo,
    md: T.accentMd,
    gradient: `linear-gradient(135deg,${T.accent},#6366F1)`,
  },
  user: {
    label: "User",
    icon: Users,
    color: T.muted,
    lo: "rgba(74,85,120,0.15)",
    md: "rgba(74,85,120,0.28)",
    gradient: "linear-gradient(135deg,#4A5578,#374162)",
  },
};

/* ─── avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ user }: { user: User }) {
  const cfg   = ROLE_CFG[user.role] ?? ROLE_CFG.user;
  const initials = (user.username?.[0] ?? user.email[0]).toUpperCase();

  return user.avatar ? (
    <img
      src={user.avatar}
      alt={user.username ?? "User"}
      className="w-10 h-10 rounded-2xl object-cover shrink-0"
      style={{ border: `1px solid ${cfg.md}` }}
    />
  ) : (
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
      style={{
        background: cfg.lo,
        border: `1px solid ${cfg.md}`,
        color: cfg.color,
        fontFamily: "'Sora',sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

/* ─── role badge ─────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const cfg  = ROLE_CFG[role] ?? ROLE_CFG.user;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}`, fontFamily: "'DM Sans',sans-serif" }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

/* ─── skeleton row ───────────────────────────────────────────────────────── */
function SkeletonRow({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.05 }}
      className="flex items-center gap-4 px-5 py-4"
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      <div className="w-10 h-10 rounded-2xl animate-pulse shrink-0" style={{ background: "rgba(99,140,255,0.07)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.07)" }} />
        <div className="h-3 w-48 rounded-lg animate-pulse" style={{ background: "rgba(99,140,255,0.05)" }} />
      </div>
      <div className="h-6 w-20 rounded-xl animate-pulse" style={{ background: "rgba(99,140,255,0.07)" }} />
      <div className="h-5 w-16 rounded-lg animate-pulse hidden sm:block" style={{ background: "rgba(99,140,255,0.05)" }} />
      <div className="h-4 w-20 rounded-lg animate-pulse hidden md:block" style={{ background: "rgba(99,140,255,0.05)" }} />
    </motion.div>
  );
}

type SortKey = "username" | "role" | "createdAt";

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AdminUsersPage() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortKey, setSortKey]   = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc]   = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res  = await fetch("/api/admin/users/list");
        const data = await res.json();
        if (res.ok) setUsers(data.users);
      } catch (error) {
        console.error("FETCH USERS ERROR:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  /* ── derived list ── */
  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || (u.username ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole   = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      let va: string, vb: string;
      if (sortKey === "username")   { va = (a.username ?? a.email).toLowerCase(); vb = (b.username ?? b.email).toLowerCase(); }
      else if (sortKey === "role")  { va = a.role; vb = b.role; }
      else                          { va = a.createdAt; vb = b.createdAt; }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const roleCounts = {
    all:         users.length,
    super_admin: users.filter(u => u.role === "super_admin").length,
    admin:       users.filter(u => u.role === "admin").length,
    user:        users.filter(u => u.role === "user").length,
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
              <Users size={28} style={{ color: T.accent }} className="animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping" style={{ background: T.accentLo, animationDuration: "2s" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Loading users…</p>
        </div>
      </div>
    );
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1" style={{ opacity: sortKey === col ? 1 : 0.3 }}>
      <ChevronUp size={10} style={{ color: sortKey === col && sortAsc ? T.accent : T.muted, marginBottom: -2 }} />
      <ChevronDown size={10} style={{ color: sortKey === col && !sortAsc ? T.accent : T.muted }} />
    </span>
  );

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-160, left:-120, width:600, height:600, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", top:300, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(124,58,237,0.05)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#3D7BFF,#7C3AED)", boxShadow:"0 4px 20px rgba(61,123,255,0.30)" }}>
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>Platform Users</h1>
                <p className="text-sm" style={{ color:T.muted }}>Manage and monitor all registered accounts</p>
              </div>
            </div>

            {/* total count pill */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm"
              style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background:T.emerald }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:T.emerald }} />
              </span>
              <span style={{ color:T.text, fontWeight:600 }}>{users.length}</span>
              <span style={{ color:T.muted }}>total users</span>
            </div>
          </div>
        </motion.div>

        {/* ── CONTROLS ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.45, ease:[0.22,1,0.36,1] }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:T.muted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
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
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg" style={{ background:"rgba(255,255,255,0.06)", color:T.muted }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* role filter tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
            {(["all","super_admin","admin","user"] as const).map(r => {
              const isActive = roleFilter === r;
              const label    = r === "all" ? "All" : r === "super_admin" ? "Super" : r === "admin" ? "Admin" : "User";
              const count    = roleCounts[r];
              return (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? (r === "super_admin" ? "rgba(245,158,11,0.15)" : r === "admin" ? T.accentLo : isActive ? "rgba(255,255,255,0.08)" : "transparent") : "transparent",
                    color: isActive ? (r === "super_admin" ? T.gold : r === "admin" ? T.accent : T.text) : T.muted,
                    border: isActive ? `1px solid ${r === "super_admin" ? "rgba(245,158,11,0.25)" : r === "admin" ? T.accentMd : "rgba(255,255,255,0.12)"}` : "1px solid transparent",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {label}
                  <span className="px-1 py-0.5 rounded-md text-[10px]" style={{ background:"rgba(255,255,255,0.06)" }}>{count}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── TABLE CARD ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.5, ease:[0.22,1,0.36,1] }}
          className="rounded-3xl overflow-hidden"
          style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }}
        >
          {/* top accent */}
          <div className="h-0.5" style={{ background:`linear-gradient(90deg,${T.accent},${T.violet},transparent)` }} />

          {/* table wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {[
                    { label:"User",    key:"username" as SortKey, sortable:true },
                    { label:"Role",    key:"role"     as SortKey, sortable:true },
                    { label:"Verified", key:null,                  sortable:false },
                    { label:"Joined",  key:"createdAt" as SortKey, sortable:true },
                  ].map(col => (
                    <th key={col.label}
                      onClick={() => col.sortable && col.key && toggleSort(col.key)}
                      className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest select-none"
                      style={{
                        color: col.sortable && col.key && sortKey === col.key ? T.accent : T.muted,
                        cursor: col.sortable ? "pointer" : "default",
                        background: "rgba(6,12,32,0.60)",
                        fontFamily: "'DM Sans',sans-serif",
                        letterSpacing: "0.07em",
                      }}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col.label}
                        {col.sortable && col.key && <SortIcon col={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="flex flex-col items-center gap-3 py-20 text-center">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                            <Users size={20} style={{ color:T.accent }} />
                          </div>
                          <p className="text-sm font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>No users found</p>
                          <p className="text-xs" style={{ color:T.muted }}>Try adjusting your search or filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user, idx) => {
                      const isLast = idx === filtered.length - 1;
                      const verifiedColor = user.isEmailVerified ? T.emerald : T.muted;

                      return (
                        <motion.tr
                          key={user._id}
                          layout
                          initial={{ opacity:0, y:8 }}
                          animate={{ opacity:1, y:0 }}
                          exit={{ opacity:0, x:-16, transition:{ duration:0.18 } }}
                          transition={{ duration:0.32, ease:[0.22,1,0.36,1], delay: idx < 15 ? idx * 0.03 : 0 }}
                          className="group transition-colors duration-150"
                          style={{ borderBottom: isLast ? "none" : `1px solid ${T.border}` }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(61,123,255,0.04)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* User */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar user={user} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
                                  {user.username || "Unnamed"}
                                </p>
                                <p className="text-xs truncate mt-0.5" style={{ color:T.muted }}>
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-5 py-4">
                            <RoleBadge role={user.role} />
                          </td>

                          {/* Verified */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              {user.isEmailVerified ? (
                                <>
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
                                    style={{ background:"rgba(16,185,129,0.12)", color:T.emerald, border:`1px solid rgba(16,185,129,0.25)` }}
                                  >
                                    <BadgeCheck size={11} />
                                    Verified
                                  </span>
                                </>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
                                  style={{ background:"rgba(74,85,120,0.15)", color:T.muted, border:`1px solid rgba(74,85,120,0.25)` }}
                                >
                                  Unverified
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Joined */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium" style={{ color:T.text }}>
                                {new Date(user.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                              </span>
                              <span className="text-xs" style={{ color:T.muted }}>
                                {new Date(user.createdAt).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" })}
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

          {/* footer */}
          {filtered.length > 0 && (
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop:`1px solid ${T.border}`, background:"rgba(6,12,32,0.40)" }}
            >
              <p className="text-xs" style={{ color:T.muted }}>
                Showing <span style={{ color:T.text, fontWeight:600 }}>{filtered.length}</span> of <span style={{ color:T.text, fontWeight:600 }}>{users.length}</span> users
              </p>
              <div className="flex items-center gap-3">
                {["super_admin","admin","user"].map(r => {
                  const cfg = ROLE_CFG[r];
                  const Icon = cfg.icon;
                  const count = users.filter(u => u.role === r).length;
                  if (!count) return null;
                  return (
                    <div key={r} className="flex items-center gap-1 text-xs" style={{ color:T.muted }}>
                      <Icon size={10} style={{ color:cfg.color }} />
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}