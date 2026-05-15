"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Crown, Shield, User, Loader2, Trash2,
  ChevronUp, ChevronDown, Users, X, AlertTriangle, Check, Search,
  Download, Filter, ArrowUpDown, Calendar,
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
  createdAt?: string;
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
  const [searchQuery, setSearchQuery]     = useState("");
  const [roleFilter, setRoleFilter]       = useState<"ALL" | Role>("ALL");
  const [sortBy, setSortBy]               = useState<"NEWEST" | "OLDEST" | "ALPHABETICAL">("NEWEST");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const [modal, setModal]                 = useState<ModalState>({
    isOpen: false, title: "", message: "", confirmText: "Confirm", type: "danger", onConfirm: () => {},
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

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
        try {
          const res = await fetch("/api/workspace/member/remove", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, targetUserId: userId }),
          });
          const data = await res.json();
          if (!res.ok) return showToast(data.error || "Failed to remove member", "error");
          
          setMembers(prev => prev.filter(m => m.user._id !== userId));
          showToast(`Removed @${username} from the workspace`, "success");
        } catch (err) {
          console.error(err); showToast("An unexpected error occurred", "error");
        } finally { setActionInProgress(null); }
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
        try {
          const res = await fetch("/api/workspace/member/role", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, targetUserId: userId, role }),
          });
          const data = await res.json();
          if (!res.ok) return showToast(data.error || "Failed to change role", "error");
          
          setMembers(prev => prev.map(m => m.user._id === userId ? { ...m, role } : m));
          showToast(`Role updated to ${ROLE[role].label} for @${username}`, "success");
        } catch (err) {
          console.error(err); showToast("An unexpected error occurred", "error");
        } finally { setActionInProgress(null); }
      },
    });
  };

  // Helper: Extract date from MongoDB ObjectId if createdAt is missing
  const getMemberDate = (m: Member) => {
    if (m.createdAt) return new Date(m.createdAt).getTime();
    if (m._id && m._id.length === 24) return parseInt(m._id.substring(0, 8), 16) * 1000;
    return 0;
  };

  const formatDate = (m: Member) => {
    const timestamp = getMemberDate(m);
    if (!timestamp) return "Recently";
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const exportCSV = () => {
    const headers = ["Username", "Email", "Role", "Joined Date"];
    const rows = members.map(m => [
      m.user.username, m.user.email, ROLE[m.role].label, formatDate(m)
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `workspace_members_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Member list exported to CSV", "success");
  };

  const toggleSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleBulkRemove = () => {
    openModal({
      title: "Remove Multiple Members",
      message: `Are you sure you want to remove ${selectedUsers.size} members? This action cannot be undone.`,
      confirmText: "Remove All",
      type: "danger",
      onConfirm: async () => {
        setBulkActionInProgress(true);
        try {
          const promises = Array.from(selectedUsers).map(userId =>
            fetch("/api/workspace/member/remove", {
              method: "DELETE", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workspaceId, targetUserId: userId }),
            })
          );
          await Promise.all(promises);
          setMembers(prev => prev.filter(m => !selectedUsers.has(m.user._id)));
          showToast(`Successfully removed ${selectedUsers.size} members`, "success");
          setSelectedUsers(new Set());
        } catch (err) {
          console.error(err); showToast("Failed to remove some members", "error");
        } finally { setBulkActionInProgress(false); }
      }
    });
  };

  const handleBulkRoleChange = (newRole: Role) => {
    if (!newRole) return;
    openModal({
      title: `Change Role to ${ROLE[newRole].label}`,
      message: `Are you sure you want to change the role of ${selectedUsers.size} members to ${ROLE[newRole].label}?`,
      confirmText: `Set as ${ROLE[newRole].label}`,
      type: "primary",
      onConfirm: async () => {
        setBulkActionInProgress(true);
        try {
          const promises = Array.from(selectedUsers).map(userId =>
            fetch("/api/workspace/member/role", {
              method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workspaceId, targetUserId: userId, role: newRole }),
            })
          );
          await Promise.all(promises);
          setMembers(prev => prev.map(m => selectedUsers.has(m.user._id) ? { ...m, role: newRole } : m));
          showToast(`Successfully updated roles for ${selectedUsers.size} members`, "success");
          setSelectedUsers(new Set());
        } catch (err) {
          console.error(err); showToast("Failed to change some roles", "error");
        } finally { setBulkActionInProgress(false); }
      }
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

  let processedMembers = members.filter(m => {
    if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.user.username.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q);
  });

  processedMembers.sort((a, b) => {
    if (sortBy === "ALPHABETICAL") {
      return a.user.username.localeCompare(b.user.username);
    }
    const dateA = getMemberDate(a);
    const dateB = getMemberDate(b);
    if (sortBy === "NEWEST") return dateB - dateA;
    if (sortBy === "OLDEST") return dateA - dateB;
    return 0;
  });

  const currentUserIsAdminOrOwner = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const selectableMembers = processedMembers.filter(m => m.user._id !== session?.user?.id && m.role !== "OWNER");
  const allSelected = selectableMembers.length > 0 && selectableMembers.every(m => selectedUsers.has(m.user._id));

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

            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-xl shrink-0"
                style={{ background: T.accentLo, color: T.accent, border:`1px solid ${T.accentMd}`, fontFamily:"'DM Sans',sans-serif" }}
              >
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                style={{ border:`1px solid ${T.border}`, color: T.text, fontFamily:"'DM Sans',sans-serif" }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── FILTERS & SEARCH ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, ease:[0.22,1,0.36,1], delay:0.04 }} className="mb-6 flex flex-col sm:flex-row gap-3">
          <div
            className="relative flex-1 flex items-center rounded-2xl transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${T.border}`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.accentMd;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentLo}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Search size={16} className="absolute left-4" style={{ color: T.muted }} />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none py-3.5 pl-11 pr-4 text-sm"
              style={{ color: T.text, fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center rounded-2xl px-3 py-1.5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
              <Filter size={14} className="mr-2" style={{ color: T.muted }} />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="bg-transparent text-sm outline-none appearance-none cursor-pointer pr-4" style={{ color: T.text }}>
                <option value="ALL" className="bg-gray-900">All Roles</option>
                <option value="OWNER" className="bg-gray-900">Owners</option>
                <option value="ADMIN" className="bg-gray-900">Admins</option>
                <option value="MEMBER" className="bg-gray-900">Members</option>
              </select>
            </div>
            <div className="relative flex items-center rounded-2xl px-3 py-1.5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
              <ArrowUpDown size={14} className="mr-2" style={{ color: T.muted }} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent text-sm outline-none appearance-none cursor-pointer pr-4" style={{ color: T.text }}>
                <option value="NEWEST" className="bg-gray-900">Newest</option>
                <option value="OLDEST" className="bg-gray-900">Oldest</option>
                <option value="ALPHABETICAL" className="bg-gray-900">Alphabetical</option>
              </select>
            </div>
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

          {processedMembers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border:`1px solid ${T.accentMd}` }}>
                {searchQuery || roleFilter !== "ALL" ? <Search size={22} style={{ color: T.accent }} /> : <Users size={22} style={{ color: T.accent }} />}
              </div>
              <p className="text-base font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>{searchQuery || roleFilter !== "ALL" ? "No members found" : "No members yet"}</p>
              <p className="text-sm" style={{ color: T.muted }}>{searchQuery || roleFilter !== "ALL" ? `Adjust your filters to see more results.` : "Invite people to get started."}</p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show">
              {currentUserIsAdminOrOwner && processedMembers.length > 0 && (
                <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${T.borderHi}`, background: "rgba(255,255,255,0.01)" }}>
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) setSelectedUsers(new Set());
                      else setSelectedUsers(new Set(selectableMembers.map(m => m.user._id)));
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900/50 checked:bg-indigo-500 checked:border-indigo-500 transition-colors cursor-pointer accent-indigo-500"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
                    {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : "Select All"}
                  </span>
                </div>
              )}
              {processedMembers.map((member, idx) => {
                const cfg           = ROLE[member.role];
                const isCurrentUser = member.user._id === session?.user?.id;
                const isProcessing  = actionInProgress === member.user._id;
                const isLast        = idx === processedMembers.length - 1;
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
                      {currentUserIsAdminOrOwner && (
                        <input 
                          type="checkbox" 
                          disabled={member.user._id === session?.user?.id || member.role === "OWNER"}
                          checked={selectedUsers.has(member.user._id)}
                          onChange={() => toggleSelection(member.user._id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-900/50 disabled:opacity-30 cursor-pointer accent-indigo-500 shrink-0"
                        />
                      )}
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
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs truncate" style={{ color: T.muted }}>
                            {member.user.email}
                          </p>
                          <div className="w-1 h-1 rounded-full shrink-0" style={{ background: T.borderHi }} />
                          <p className="text-[11px] shrink-0 flex items-center gap-1" style={{ color: T.muted }}>
                            <Calendar size={10} /> Joined {formatDate(member)}
                          </p>
                        </div>
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

      {/* ── BULK ACTIONS FAB ── */}
      <AnimatePresence>
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl"
            style={{ background: T.surface, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >
            <span className="text-sm font-bold text-white whitespace-nowrap">
              {selectedUsers.size} Selected
            </span>
            <div className="w-px h-5" style={{ background: T.borderHi }} />
            
            <div className="flex items-center gap-2">
              <div className="relative flex items-center rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5" style={{ border: `1px solid ${T.border}` }}>
                <Shield size={14} className="mr-1.5" style={{ color: T.muted }} />
                <select 
                  onChange={e => { handleBulkRoleChange(e.target.value as Role); e.target.value = ""; }} 
                  defaultValue="" 
                  className="bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer pr-4" 
                  style={{ color: T.text }}
                >
                  <option value="" disabled className="bg-gray-900">Change Role...</option>
                  <option value="ADMIN" className="bg-gray-900">Set as Admin</option>
                  <option value="MEMBER" className="bg-gray-900">Set as Member</option>
                </select>
              </div>
              
              <button
                onClick={handleBulkRemove}
                disabled={bulkActionInProgress}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: T.red, background: T.redLo, border: `1px solid rgba(255,77,109,0.2)` }}
              >
                {bulkActionInProgress ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {toast.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}