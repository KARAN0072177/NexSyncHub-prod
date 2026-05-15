"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save, Trash2, Loader2, Hash, AlertTriangle, Settings,
  Shield, Lock, Edit2, LogOut, X, Sparkles,
  Users, Bell, Check,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

/* ─── tiny design tokens ─────────────────────────────────────────────────── */
const TOKEN = {
  accent:   "#6C63FF",
  accentLo: "rgba(108,99,255,0.12)",
  accentMd: "rgba(108,99,255,0.25)",
  red:      "#FF4D6D",
  redLo:    "rgba(255,77,109,0.10)",
  surface:  "rgba(14,14,18,0.80)",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.14)",
  text:     "#E8E6F0",
  muted:    "#6B6880",
};

/* ─── reusable components ────────────────────────────────────────────────── */

function GlowOrb({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", borderRadius: "50%",
        background: color, filter: "blur(80px)",
        pointerEvents: "none", zIndex: 0,
        ...style,
      }}
    />
  );
}

function SectionCard({
  children, className = "", glowColor,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background: TOKEN.surface,
        border: `1px solid ${TOKEN.border}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {glowColor && (
        <GlowOrb
          color={glowColor}
          style={{ width: 220, height: 220, top: -60, right: -60, opacity: 0.55 }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function StyledInput({
  value, onChange, disabled, placeholder, className = "",
}: {
  value: string; onChange: (v: string) => void;
  disabled?: boolean; placeholder?: string; className?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 ${className}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${focused ? TOKEN.accentMd : TOKEN.border}`,
        boxShadow: focused ? `0 0 0 3px ${TOKEN.accentLo}` : "none",
      }}
    >
      <input
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-5 py-3.5 text-sm outline-none"
        style={{
          color: disabled ? TOKEN.muted : TOKEN.text,
          cursor: disabled ? "not-allowed" : "text",
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
    </div>
  );
}

function StyledTextarea({
  value, onChange, disabled, rows = 4,
}: {
  value: string; onChange: (v: string) => void;
  disabled?: boolean; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative rounded-2xl transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${focused ? TOKEN.accentMd : TOKEN.border}`,
        boxShadow: focused ? `0 0 0 3px ${TOKEN.accentLo}` : "none",
      }}
    >
      <textarea
        disabled={disabled}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-5 py-3.5 text-sm outline-none resize-none"
        style={{
          color: disabled ? TOKEN.muted : TOKEN.text,
          cursor: disabled ? "not-allowed" : "text",
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
    </div>
  );
}

function PillBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
      style={{
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}30`,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.06em",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ─── Confirm / Prompt Modal ─────────────────────────────────────────────── */

interface ModalState {
  isOpen: boolean; title: string; message: string;
  confirmText?: string; type?: "danger" | "primary";
  isPrompt?: boolean; onConfirm: (val?: string) => void;
}

function ConfirmModal({
  modal, promptValue, setPromptValue, onClose,
}: {
  modal: ModalState;
  promptValue: string;
  setPromptValue: (v: string) => void;
  onClose: () => void;
}) {
  const isPrimary = modal.type === "primary";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal.isPrompt && modal.isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [modal.isOpen, modal.isPrompt]);

  return (
    <AnimatePresence>
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: "rgba(5,5,8,0.75)", backdropFilter: "blur(8px)" }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2 } }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: "rgba(16,15,22,0.98)",
              border: `1px solid ${isPrimary ? TOKEN.accentMd : "rgba(255,77,109,0.22)"}`,
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-0.5 w-full"
              style={{
                background: isPrimary
                  ? `linear-gradient(90deg, ${TOKEN.accent}, #9F7AEA, transparent)`
                  : `linear-gradient(90deg, ${TOKEN.red}, #FF8C60, transparent)`,
              }}
            />

            <div className="p-7">
              {/* Icon + title */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      background: isPrimary ? TOKEN.accentLo : TOKEN.redLo,
                      border: `1px solid ${isPrimary ? TOKEN.accentMd : "rgba(255,77,109,0.25)"}`,
                    }}
                  >
                    {isPrimary
                      ? <Edit2 size={18} style={{ color: TOKEN.accent }} />
                      : <AlertTriangle size={18} style={{ color: TOKEN.red }} />
                    }
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {modal.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", color: TOKEN.muted }}
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm leading-relaxed mb-6" style={{ color: TOKEN.muted, fontFamily: "'DM Sans', sans-serif" }}>
                {modal.message}
              </p>

              {modal.isPrompt && (
                <div className="mb-6">
                  <div
                    className="relative rounded-2xl transition-all duration-300"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${TOKEN.accentMd}`,
                      boxShadow: `0 0 0 3px ${TOKEN.accentLo}`,
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") modal.onConfirm(promptValue); }}
                      className="w-full bg-transparent px-5 py-3.5 text-sm outline-none"
                      style={{ color: TOKEN.text, fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${TOKEN.border}`,
                    color: TOKEN.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => modal.onConfirm(modal.isPrompt ? promptValue : undefined)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-95"
                  style={{
                    background: isPrimary
                      ? `linear-gradient(135deg, ${TOKEN.accent}, #8B5CF6)`
                      : `linear-gradient(135deg, #FF4D6D, #FF6B35)`,
                    boxShadow: isPrimary
                      ? "0 4px 20px rgba(108,99,255,0.35)"
                      : "0 4px 20px rgba(255,77,109,0.35)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {modal.confirmText || "Confirm"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Channel Row ─────────────────────────────────────────────────────────── */

function ChannelRow({
  ch, onRename, onDelete, deleting,
}: {
  ch: any;
  onRename: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      key={ch._id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200"
      style={{
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? TOKEN.borderHi : TOKEN.border}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: TOKEN.accentLo, border: `1px solid ${TOKEN.accentMd}` }}
        >
          <Hash size={14} style={{ color: TOKEN.accent }} />
        </div>
        <span className="text-sm font-medium" style={{ color: TOKEN.text, fontFamily: "'DM Sans', sans-serif" }}>
          {ch.name}
        </span>
      </div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <button
          onClick={onRename}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${TOKEN.border}`,
            color: TOKEN.muted,
          }}
          title="Rename"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: TOKEN.redLo,
            border: `1px solid rgba(255,77,109,0.20)`,
            color: TOKEN.red,
          }}
          title="Delete"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */

export default function WorkspaceSettingsPage() {
  const router     = useRouter();
  const params     = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [role, setRole]           = useState("");
  const [channels, setChannels]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<string | null>(null);
  const [promptValue, setPromptValue]         = useState("");

  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen: false, title: "", message: "", type: "danger", onConfirm: () => {},
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  const normalizedRole = role?.toUpperCase?.() || "";
  const canManage      = normalizedRole === "OWNER" || normalizedRole === "ADMIN";

  /* ── fetch ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workspaceRes, channelRes] = await Promise.all([
          fetch(`/api/workspace/${workspaceId}`),
          fetch(`/api/channel/list?workspaceId=${workspaceId}`),
        ]);
        const workspaceData = await workspaceRes.json();
        const channelData   = await channelRes.json();
        if (workspaceRes.ok) { setWorkspace(workspaceData.workspace); setRole(workspaceData.role); }
        if (channelRes.ok)   { setChannels(channelData.channels); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [workspaceId]);

  /* ── save ── */
  const handleSave = async () => {
    try {
      setSaving(true);
      const res  = await fetch("/api/workspace/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: workspace.name, description: workspace.description }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error, "error");
      setSavedPulse(true);
      showToast("Workspace details updated successfully!", "success");
      setTimeout(() => setSavedPulse(false), 2000);
    } catch (err) { console.error(err); showToast("An unexpected error occurred.", "error"); }
    finally { setSaving(false); }
  };

  /* ── rename channel ── */
  const renameChannel = (channelId: string, currentName: string) => {
    setPromptValue(currentName);
    setConfirmModal({
      isOpen: true, title: "Rename Channel",
      message: "Enter a new name for this channel:",
      confirmText: "Rename", type: "primary", isPrompt: true,
      onConfirm: async (newName?: string) => {
        if (!newName || newName.trim() === "" || newName === currentName) {
          setConfirmModal(p => ({ ...p, isOpen: false })); return;
        }
        setConfirmModal(p => ({ ...p, isOpen: false }));
        try {
          const res  = await fetch("/api/channel/rename", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelId, name: newName.trim() }),
          });
          const data = await res.json();
          if (!res.ok) return showToast(data.error, "error");
          setChannels(prev => prev.map(ch => ch._id === channelId ? { ...ch, name: newName.trim() } : ch));
          showToast("Channel renamed successfully!", "success");
        } catch (err) { console.error(err); showToast("Failed to rename channel.", "error"); }
      },
    });
  };

  /* ── delete channel ── */
  const deleteChannel = (channelId: string) => {
    setConfirmModal({
      isOpen: true, title: "Delete Channel",
      message: "This channel and all its messages will be permanently removed. This action cannot be undone.",
      confirmText: "Delete", type: "danger",
      onConfirm: async () => {
        setConfirmModal(p => ({ ...p, isOpen: false }));
        try {
          setDeletingChannel(channelId);
          const res  = await fetch("/api/channel/delete", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelId }),
          });
          const data = await res.json();
          if (!res.ok) return showToast(data.error, "error");
          setChannels(prev => prev.filter(ch => ch._id !== channelId));
          showToast("Channel deleted successfully!", "success");
        } catch (err) { console.error(err); showToast("Failed to delete channel.", "error"); }
        finally { setDeletingChannel(null); }
      },
    });
  };

  /* ── delete workspace ── */
  const deleteWorkspace = () => {
    setConfirmModal({
      isOpen: true, title: "Delete Workspace",
      message: "All channels, messages, and member data will be permanently erased. This cannot be undone.",
      confirmText: "Delete Workspace", type: "danger",
      onConfirm: async () => {
        setConfirmModal(p => ({ ...p, isOpen: false }));
        try {
          const res  = await fetch("/api/workspace/delete", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId }),
          });
          const data = await res.json();
          if (!res.ok) return showToast(data.error, "error");
          router.push("/dashboard");
        } catch (err) { console.error(err); showToast("Failed to delete workspace.", "error"); }
      },
    });
  };

  /* ── leave workspace ── */
  const leaveWorkspace = () => {
    setConfirmModal({
      isOpen: true, title: "Leave Workspace",
      message: "You will lose access immediately. You'll need a new invite to rejoin.",
      confirmText: "Leave Workspace", type: "danger",
      onConfirm: async () => {
        setConfirmModal(p => ({ ...p, isOpen: false }));
        try {
          const res  = await fetch("/api/workspace/leave", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId }),
          });
          const data = await res.json();
          if (!res.ok) return showToast(data.error, "error");
          router.push("/dashboard");
        } catch (err) { console.error(err); showToast("Failed to leave workspace.", "error"); }
      },
    });
  };

  /* ── Loading ── */
  if (loading || !workspace) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ background: "#080810" }}
      >
        {/* Font imports */}
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');`}</style>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: TOKEN.accentLo, border: `1px solid ${TOKEN.accentMd}` }}
            >
              <Settings className="w-7 h-7 animate-spin" style={{ color: TOKEN.accent, animationDuration: "3s" }} />
            </div>
            <div
              className="absolute inset-0 rounded-2xl animate-ping"
              style={{ background: TOKEN.accentLo, animationDuration: "2s" }}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: TOKEN.muted, fontFamily: "'DM Sans', sans-serif" }}>
            Loading workspace settings…
          </p>
        </div>
      </div>
    );
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, easing: [0.22, 1, 0.36, 1] } },
  };

  /* ── Render ── */
  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "#080810", color: TOKEN.text }}
    >
      {/* Google fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-120, left:-100, width:480, height:480, borderRadius:"50%", background:"rgba(108,99,255,0.08)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", bottom:-80, right:-60, width:360, height:360, borderRadius:"50%", background:"rgba(255,77,109,0.06)", filter:"blur(100px)" }} />
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-10 pb-20">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── PAGE HEADER ── */}
          <motion.div variants={item} className="mb-10">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: TOKEN.accentLo, border: `1px solid ${TOKEN.accentMd}` }}
                  >
                    <Sparkles size={18} style={{ color: TOKEN.accent }} />
                  </div>
                  <h1
                    className="text-3xl sm:text-4xl font-bold tracking-tight"
                    style={{ fontFamily: "'Sora', sans-serif", color: "#fff" }}
                  >
                    Settings
                  </h1>
                </div>
                <p className="text-sm" style={{ color: TOKEN.muted }}>
                  Manage your workspace — <span style={{ color: TOKEN.accent, fontWeight: 600 }}>{workspace.name}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <PillBadge
                  label={normalizedRole || "MEMBER"}
                  color={normalizedRole === "OWNER" ? "#F59E0B" : normalizedRole === "ADMIN" ? TOKEN.accent : TOKEN.muted}
                />
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">

              {/* ── GENERAL ── */}
              <SectionCard glowColor="rgba(108,99,255,0.15)">
                <div className="p-7 sm:p-8">
                  {/* section label */}
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: TOKEN.accentLo, border: `1px solid ${TOKEN.accentMd}` }}>
                      <Shield size={14} style={{ color: TOKEN.accent }} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                        General Details
                      </h2>
                      <p className="text-xs" style={{ color: TOKEN.muted }}>Name, description and workspace identity</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: TOKEN.muted }}>
                        Workspace Name
                      </label>
                      <StyledInput
                        value={workspace.name}
                        onChange={(v) => setWorkspace({ ...workspace, name: v })}
                        disabled={!canManage}
                        placeholder="My Awesome Workspace"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: TOKEN.muted }}>
                        Description
                      </label>
                      <StyledTextarea
                        value={workspace.description}
                        onChange={(v) => setWorkspace({ ...workspace, description: v })}
                        disabled={!canManage}
                      />
                    </div>

                    {!canManage && (
                      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${TOKEN.border}`, color: TOKEN.muted }}>
                        <Lock size={13} style={{ color: TOKEN.muted }} />
                        <span>Only owners and admins can modify workspace details.</span>
                      </div>
                    )}

                    {canManage && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="relative flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 overflow-hidden"
                          style={{
                            background: savedPulse
                              ? "linear-gradient(135deg, #10B981, #059669)"
                              : `linear-gradient(135deg, ${TOKEN.accent}, #8B5CF6)`,
                            boxShadow: savedPulse
                              ? "0 4px 20px rgba(16,185,129,0.35)"
                              : "0 4px 20px rgba(108,99,255,0.35)",
                            transition: "background 0.4s ease, box-shadow 0.4s ease",
                            fontFamily: "'DM Sans', sans-serif",
                            opacity: saving ? 0.8 : 1,
                          }}
                        >
                          {saving ? (
                            <><Loader2 size={15} className="animate-spin" /> Saving…</>
                          ) : savedPulse ? (
                            <><Check size={15} /> Saved!</>
                          ) : (
                            <><Save size={15} /> Save Changes</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* ── CHANNELS ── */}
              <SectionCard glowColor="rgba(108,99,255,0.08)">
                <div className="p-7 sm:p-8">
                  <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: TOKEN.accentLo, border: `1px solid ${TOKEN.accentMd}` }}>
                        <Hash size={14} style={{ color: TOKEN.accent }} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                          Channels
                        </h2>
                        <p className="text-xs" style={{ color: TOKEN.muted }}>{channels.length} channel{channels.length !== 1 ? "s" : ""} in this workspace</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: TOKEN.accentLo, color: TOKEN.accent, border: `1px solid ${TOKEN.accentMd}` }}
                    >
                      {channels.length}
                    </span>
                  </div>

                  <div className="relative">
                    {/* Restricted overlay */}
                    {!canManage && (
                      <div
                        className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center"
                        style={{ background: "rgba(8,8,16,0.82)", backdropFilter: "blur(12px)" }}
                      >
                        <div
                          className="flex flex-col items-center gap-3 p-6 rounded-3xl max-w-xs text-center"
                          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${TOKEN.border}` }}
                        >
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${TOKEN.border}` }}>
                            <Lock size={18} style={{ color: TOKEN.muted }} />
                          </div>
                          <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Restricted Access</p>
                          <p className="text-xs leading-relaxed" style={{ color: TOKEN.muted }}>
                            Only workspace owners and admins can manage channels.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5 min-h-[80px]">
                      <AnimatePresence mode="popLayout">
                        {channels.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-2 py-10 text-center"
                          >
                            <Hash size={28} style={{ color: TOKEN.muted, opacity: 0.4 }} />
                            <p className="text-sm" style={{ color: TOKEN.muted }}>No channels yet</p>
                          </motion.div>
                        ) : channels.map((ch) => (
                          <ChannelRow
                            key={ch._id}
                            ch={ch}
                            onRename={() => renameChannel(ch._id, ch.name)}
                            onDelete={() => deleteChannel(ch._id)}
                            deleting={deletingChannel === ch._id}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ── DANGER ZONE ── */}
              <SectionCard glowColor="rgba(255,77,109,0.10)">
                <div
                  className="p-7 sm:p-8"
                  style={{ borderTop: `2px solid ${TOKEN.red}22` }}
                >
                  {/* top danger bar */}
                  <div
                    className="h-0.5 w-full absolute top-0 left-0 right-0"
                    style={{ background: `linear-gradient(90deg, ${TOKEN.red}, #FF8C60, transparent)` }}
                  />

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: TOKEN.redLo, border: `1px solid rgba(255,77,109,0.22)` }}>
                      <AlertTriangle size={14} style={{ color: TOKEN.red }} />
                    </div>
                    <h2 className="text-base font-bold" style={{ fontFamily: "'Sora', sans-serif", color: TOKEN.red }}>
                      Danger Zone
                    </h2>
                  </div>
                  <p className="text-xs mb-7 ml-11" style={{ color: "rgba(255,77,109,0.55)" }}>
                    These actions are permanent and irreversible. Proceed with extreme caution.
                  </p>

                  {normalizedRole === "OWNER" ? (
                    <div
                      className="flex items-center justify-between p-5 rounded-2xl gap-4 flex-wrap"
                      style={{ background: TOKEN.redLo, border: `1px solid rgba(255,77,109,0.18)` }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Delete this workspace
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,77,109,0.6)" }}>
                          Permanently removes all channels, members, and data.
                        </p>
                      </div>
                      <button
                        onClick={deleteWorkspace}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #FF4D6D, #FF6B35)",
                          boxShadow: "0 4px 20px rgba(255,77,109,0.30)",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        <Trash2 size={14} />
                        Delete Workspace
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between p-5 rounded-2xl gap-4 flex-wrap"
                      style={{ background: TOKEN.redLo, border: `1px solid rgba(255,77,109,0.18)` }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Leave this workspace
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,77,109,0.6)" }}>
                          You'll need a new invite to regain access.
                        </p>
                      </div>
                      <button
                        onClick={leaveWorkspace}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-95 shrink-0"
                        style={{
                          background: "rgba(255,77,109,0.12)",
                          border: `1px solid rgba(255,77,109,0.30)`,
                          color: TOKEN.red,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        <LogOut size={14} />
                        Leave Workspace
                      </button>
                    </div>
                  )}
                </div>
              </SectionCard>

          </div>

        </motion.div>
      </div>

      {/* ── MODAL ── */}
      <ConfirmModal
        modal={confirmModal}
        promptValue={promptValue}
        setPromptValue={setPromptValue}
        onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
      />

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