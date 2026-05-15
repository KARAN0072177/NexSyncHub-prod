"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Crown, Shield, User, Loader2, Trash2,
  ChevronUp, ChevronDown, Users, X, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── design tokens (matches settings page) ─────────────────────────────── */
const T = {
  accent:   "#6C63FF",
  accentLo: "rgba(108,99,255,0.12)",
  accentMd: "rgba(108,99,255,0.25)",
  gold:     "#F59E0B",
  goldLo:   "rgba(245,158,11,0.12)",
  goldMd:   "rgba(245,158,11,0.25)",
  red:      "#FF4D6D",
  redLo:    "rgba(255,77,109,0.10)",
  surface:  "rgba(14,14,20,0.80)",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.13)",
  text:     "#E8E6F0",
  muted:    "#6B6880",
};

/* ─── role config ────────────────────────────────────────────────────────── */
const ROLE = {
  OWNER: {
    icon: Crown,
    color: "#F59E0B",
    lo: "rgba(245,158,11,0.12)",
    md: "rgba(245,158,11,0.25)",
    label: "Owner",
    rank: 3,
  },
  ADMIN: {
    icon: Shield,
    color: T.accent,
    lo: T.accentLo,
    md: T.accentMd,
    label: "Admin",
    rank: 2,
  },
  MEMBER: {
    icon: User,
    color: T.muted,
    lo: "rgba(107,104,128,0.12)",
    md: "rgba(107,104,128,0.22)",
    label: "Member",
    rank: 1,
  },
};

type Role = "OWNER" | "ADMIN" | "MEMBER";
type Member = {
  _id: string;
  role: Role;
  user: { _id: string; username: string; email: string };
};

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */
interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  type: "danger" | "primary" | "gold";
  onConfirm: () => void;
}

function ConfirmModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  const isGold   = modal.type === "gold";
  const isPrimary = modal.type === "primary";
  const color    = isGold ? T.gold : isPrimary ? T.accent : T.red;
  const lo       = isGold ? T.goldLo : isPrimary ? T.accentLo : T.redLo;
  const gradient = isGold
    ? "linear-gradient(135deg,#F59E0B,#D97706)"
    : isPrimary
    ? `linear-gradient(135deg,${T.accent},#8B5CF6)`
    : "linear-gradient(135deg,#FF4D6D,#FF6B35)";

  return (
    <AnimatePresence>
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: "rgba(5,5,8,0.78)", backdropFilter: "blur(10px)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22,1,0.36,1] } }}
            exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: "rgba(16,15,22,0.98)", border: `1px solid ${color}30`, backdropFilter: "blur(40px)" }}
          >
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
            <div className="p-7">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: lo, border: `1px solid ${color}30` }}>
                    <AlertTriangle size={16} style={{ color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>
                    {modal.title}
                  </h3>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors" style={{ background: "rgba(255,255,255,0.04)", color: T.muted }}>
                  <X size={15} />
                </button>
              </div>
              <p className="text-sm leading-relaxed mb-7" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>
                {modal.message}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>
                  Cancel
                </button>
                <button onClick={() => { modal.onConfirm(); onClose(); }} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95" style={{ background: gradient, boxShadow: `0 4px 20px ${color}40`, fontFamily: "'DM Sans',sans-serif" }}>
                  {modal.confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ name, role }: { name: string; role: Role }) {
  const cfg = ROLE[role];
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold"
        style={{
          background: `linear-gradient(135deg, ${cfg.lo}, ${cfg.md})`,
          border: `1px solid ${cfg.md}`,
          color: cfg.color,
          fontFamily: "'Sora',sans-serif",
        }}
      >
        {initials}
      </div>
      {role === "OWNER" && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: T.gold, boxShadow: `0 0 8px ${T.gold}80` }}>
          <Crown size={8} className="text-black" />
        </div>
      )}
    </div>
  );
}

/* ─── Role Badge ─────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: Role }) {
  const cfg  = ROLE[role];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}`, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.03em" }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

/* ─── Action Button ──────────────────────────────────────────────────────── */
function ActionBtn({
  onClick, title, icon: Icon, color, lo, md,
}: {
  onClick: () => void; title: string;
  icon: React.ElementType; color: string; lo: string; md: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
      style={{ background: hov ? lo : "rgba(255,255,255,0.03)", border: `1px solid ${hov ? md : T.border}`, color: hov ? color : T.muted }}
    >
      <Icon size={13} />
    </button>
  );
}

/* ─── Skeleton row ───────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="space-y-2">
          <div className="h-3.5 w-28 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="h-3 w-40 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-6 w-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function MembersClient({ workspaceId }: { workspaceId: string }) {
  const { data: session, status } = useSession();
  const [members, setMembers]             = useState<Member[]>([]);
  const [loading, setLoading]             = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [modal, setModal]                 = useState<ModalState>({
    isOpen: false, title: "", message: "", confirmText: "Confirm", type: "danger", onConfirm: () => {},
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchMembers = async () => {
      const res  = await fetch(`/api/workspace/members?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members);
        const me = data.members.find((m: any) => m.user._id === session?.user?.id);
        if (me) setCurrentUserRole(me.role);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [workspaceId, status, session?.user?.id]);

  const openModal = (opts: Omit<ModalState, "isOpen">) =>
    setModal({ isOpen: true, ...opts });
  const closeModal = () => setModal(p => ({ ...p, isOpen: false }));

  const removeMember = (userId: string, username: string) =>
    openModal({
      title: "Remove Member",
      message: `Remove @${username} from this workspace? They'll need a new invite to rejoin.`,
      confirmText: "Remove",
      type: "danger",
      onConfirm: async () => {
        setActionInProgress(userId);
        await fetch("/api/workspace/member/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, targetUserId: userId }),
        });
        setMembers(prev => prev.filter(m => m.user._id !== userId));
        setActionInProgress(null);
      },
    });

  const changeRole = (userId: string, username: string, role: Role) => {
    const isPromotion = ROLE[role].rank > ROLE[currentUserRole ?? "MEMBER"].rank - 1;
    const isOwner     = role === "OWNER";
    openModal({
      title: isOwner ? "Transfer Ownership" : `Change Role to ${ROLE[role].label}`,
      message: isOwner
        ? `You will permanently transfer ownership to @${username}. You'll become an Admin. This cannot be undone.`
        : `Set @${username}'s role to ${ROLE[role].label}?`,
      confirmText: isOwner ? "Transfer Ownership" : `Set as ${ROLE[role].label}`,
      type: isOwner ? "gold" : isPromotion ? "primary" : "danger",
      onConfirm: async () => {
        setActionInProgress(userId);
        await fetch("/api/workspace/member/role", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, targetUserId: userId, role }),
        });
        setMembers(prev => prev.map(m => m.user._id === userId ? { ...m, role } : m));
        setActionInProgress(null);
      },
    });
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="h-full overflow-y-auto" style={{ background: "#080810" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* header skeleton */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="space-y-2">
              <div className="h-5 w-32 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-3.5 w-52 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          </div>
          {/* rows */}
          <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
                <SkeletonRow />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // framer-motion Variants typing can be strict about easing arrays; cast to any to avoid type mismatch
  const container: any = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const row: any = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } };

  /* ── render ── */
  return (
    <div className="h-full overflow-y-auto" style={{ background: "#080810", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      {/* ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-100, left:-80, width:420, height:420, borderRadius:"50%", background:"rgba(108,99,255,0.07)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", bottom:-60, right:-40, width:320, height:320, borderRadius:"50%", background:"rgba(245,158,11,0.05)", filter:"blur(100px)" }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, ease:[0.22,1,0.36,1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border:`1px solid ${T.accentMd}` }}>
                <Users size={18} style={{ color: T.accent }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>
                  Members
                </h1>
                <p className="text-sm" style={{ color: T.muted }}>
                  Manage roles and access in this workspace
                </p>
              </div>
            </div>

            <span
              className="text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: T.accentLo, color: T.accent, border:`1px solid ${T.accentMd}`, fontFamily:"'DM Sans',sans-serif" }}
            >
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
        </motion.div>

        {/* ── MEMBERS CARD ── */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5, ease:[0.22,1,0.36,1], delay:0.08 }}
          className="rounded-3xl overflow-hidden"
          style={{ background: T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)" }}
        >
          {/* top accent bar */}
          <div className="h-0.5" style={{ background:`linear-gradient(90deg,${T.accent},#8B5CF6,transparent)` }} />

          {members.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border:`1px solid ${T.accentMd}` }}>
                <Users size={22} style={{ color: T.accent }} />
              </div>
              <p className="text-base font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>No members yet</p>
              <p className="text-sm" style={{ color: T.muted }}>Invite people to get started.</p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show">
              {members.map((member, idx) => {
                const cfg           = ROLE[member.role];
                const isCurrentUser = member.user._id === session?.user?.id;
                const isProcessing  = actionInProgress === member.user._id;
                const isLast        = idx === members.length - 1;
                const canOwnerAct   = currentUserRole === "OWNER" && member.role !== "OWNER";
                const canAdminAct   = currentUserRole === "ADMIN" && member.role === "MEMBER";

                return (
                  <motion.div
                    variants={row}
                    key={member._id}
                    className="group flex items-center justify-between px-5 py-4 transition-colors duration-150"
                    style={{
                      borderBottom: isLast ? "none" : `1px solid ${T.border}`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* LEFT */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <Avatar name={member.user.username} role={member.role} />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold truncate" style={{ color: T.text, fontFamily:"'DM Sans',sans-serif" }}>
                            {member.user.username}
                          </span>
                          {isCurrentUser && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                              style={{ background: T.accentLo, color: T.accent, border:`1px solid ${T.accentMd}`, letterSpacing:"0.05em" }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: T.muted }}>
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <RoleBadge role={member.role} />

                      <div className="flex items-center gap-1.5">
                        {isProcessing ? (
                          <div className="w-8 h-8 flex items-center justify-center">
                            <Loader2 size={14} className="animate-spin" style={{ color: T.accent }} />
                          </div>
                        ) : (
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                              className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            >
                              {/* OWNER actions */}
                              {canOwnerAct && (
                                <>
                                  {member.role === "MEMBER" && (
                                    <ActionBtn
                                      onClick={() => changeRole(member.user._id, member.user.username, "ADMIN")}
                                      title="Promote to Admin"
                                      icon={ChevronUp}
                                      color={T.accent} lo={T.accentLo} md={T.accentMd}
                                    />
                                  )}
                                  {member.role === "ADMIN" && (
                                    <ActionBtn
                                      onClick={() => changeRole(member.user._id, member.user.username, "MEMBER")}
                                      title="Demote to Member"
                                      icon={ChevronDown}
                                      color={T.muted} lo="rgba(107,104,128,0.12)" md="rgba(107,104,128,0.22)"
                                    />
                                  )}
                                  <ActionBtn
                                    onClick={() => changeRole(member.user._id, member.user.username, "OWNER")}
                                    title="Transfer Ownership"
                                    icon={Crown}
                                    color={T.gold} lo={T.goldLo} md={T.goldMd}
                                  />
                                  <ActionBtn
                                    onClick={() => removeMember(member.user._id, member.user.username)}
                                    title="Remove Member"
                                    icon={Trash2}
                                    color={T.red} lo={T.redLo} md="rgba(255,77,109,0.22)"
                                  />
                                </>
                              )}

                              {/* ADMIN actions */}
                              {canAdminAct && (
                                <>
                                  <ActionBtn
                                    onClick={() => changeRole(member.user._id, member.user.username, "ADMIN")}
                                    title="Promote to Admin"
                                    icon={ChevronUp}
                                    color={T.accent} lo={T.accentLo} md={T.accentMd}
                                  />
                                  <ActionBtn
                                    onClick={() => removeMember(member.user._id, member.user.username)}
                                    title="Remove Member"
                                    icon={Trash2}
                                    color={T.red} lo={T.redLo} md="rgba(255,77,109,0.22)"
                                  />
                                </>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* legend */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4, duration:0.5 }}
          className="flex items-center gap-4 mt-5 flex-wrap"
        >
          {(["OWNER","ADMIN","MEMBER"] as Role[]).map(r => {
            const cfg  = ROLE[r];
            const Icon = cfg.icon;
            return (
              <div key={r} className="flex items-center gap-1.5 text-xs" style={{ color: T.muted }}>
                <Icon size={11} style={{ color: cfg.color }} />
                <span>{cfg.label}</span>
              </div>
            );
          })}
          <span className="text-xs ml-auto" style={{ color: T.muted }}>Hover a row to see actions</span>
        </motion.div>

      </div>

      <ConfirmModal modal={modal} onClose={closeModal} />
    </div>
  );
}