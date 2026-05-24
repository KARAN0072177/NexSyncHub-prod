"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save, Trash2, Loader2, Hash, AlertTriangle,
  Shield, Lock, Edit2, LogOut, X, Sparkles, Check,
  ImagePlus, Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageCropModal from "@/components/ImageCropModal";

/* ─── design tokens ──────────────────────────────────────────────────────── */
const T = {
  accent:   "#6C63FF",
  accentLo: "rgba(108,99,255,0.12)",
  accentMd: "rgba(108,99,255,0.25)",
  red:      "#FF4D6D",
  redLo:    "rgba(255,77,109,0.10)",
  surface:  "rgba(14,14,20,0.80)",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.13)",
  text:     "#E8E6F0",
  muted:    "#6B6880",
  gold:     "#F59E0B",
  emerald:  "#10B981",
};

/* ─── SectionCard ────────────────────────────────────────────────────────── */
function SectionCard({ children, glowColor, accentBar }: {
  children: React.ReactNode; glowColor?: string; accentBar?: string;
}) {
  return (
    <motion.div
      variants={{ hidden:{ opacity:0, y:22 }, show:{ opacity:1, y:0, transition:{ duration:0.5, ease:[0.22,1,0.36,1] } } }}
      className="relative overflow-hidden rounded-3xl"
      style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)" }}
    >
      {accentBar && <div className="h-0.5" style={{ background:accentBar }} />}
      {glowColor && (
        <div aria-hidden style={{ position:"absolute", width:240, height:240, top:-60, right:-60, borderRadius:"50%", background:glowColor, filter:"blur(80px)", opacity:0.5, pointerEvents:"none", zIndex:0 }} />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ─── StyledInput ────────────────────────────────────────────────────────── */
function StyledInput({ value, onChange, disabled, placeholder }: {
  value:string; onChange:(v:string)=>void; disabled?:boolean; placeholder?:string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="rounded-2xl transition-all duration-300"
      style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${focused ? T.accentMd : T.border}`, boxShadow:focused ? `0 0 0 3px ${T.accentLo}` : "none" }}>
      <input disabled={disabled} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-5 py-3.5 text-sm outline-none"
        style={{ color:disabled ? T.muted : T.text, cursor:disabled ? "not-allowed" : "text", fontFamily:"'DM Sans',sans-serif" }} />
    </div>
  );
}

/* ─── StyledTextarea ─────────────────────────────────────────────────────── */
function StyledTextarea({ value, onChange, disabled, rows=4 }: {
  value:string; onChange:(v:string)=>void; disabled?:boolean; rows?:number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="rounded-2xl transition-all duration-300"
      style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${focused ? T.accentMd : T.border}`, boxShadow:focused ? `0 0 0 3px ${T.accentLo}` : "none" }}>
      <textarea disabled={disabled} value={value} rows={rows}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-5 py-3.5 text-sm outline-none resize-none"
        style={{ color:disabled ? T.muted : T.text, cursor:disabled ? "not-allowed" : "text", fontFamily:"'DM Sans',sans-serif" }} />
    </div>
  );
}

/* ─── PillBadge ──────────────────────────────────────────────────────────── */
function PillBadge({ label, color }: { label:string; color:string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ background:`${color}18`, color, border:`1px solid ${color}30`, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.06em" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:color }} />
      {label}
    </span>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ toast, onClose }: {
  toast: { message:string; type:"success"|"error" } | null; onClose:()=>void;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity:0, y:60, scale:0.92 }}
          animate={{ opacity:1, y:0, scale:1, transition:{ duration:0.35, ease:[0.22,1,0.36,1] } }}
          exit={{ opacity:0, y:30, scale:0.92, transition:{ duration:0.2 } }}
          className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl"
          style={{
            background: toast.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(255,77,109,0.12)",
            border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(255,77,109,0.25)"}`,
            backdropFilter: "blur(20px)",
            boxShadow: toast.type === "success" ? "0 8px 32px rgba(16,185,129,0.15)" : "0 8px 32px rgba(255,77,109,0.15)",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: toast.type === "success" ? "rgba(16,185,129,0.20)" : "rgba(255,77,109,0.20)" }}>
            {toast.type === "success"
              ? <Check size={14} style={{ color:T.emerald }} />
              : <AlertTriangle size={14} style={{ color:T.red }} />
            }
          </div>
          <span className="text-sm font-semibold" style={{ color:T.text }}>{toast.message}</span>
          <button onClick={onClose} className="ml-1 w-5 h-5 flex items-center justify-center rounded-lg opacity-50 hover:opacity-100 transition-opacity" style={{ color:T.muted }}>
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── ConfirmModal ───────────────────────────────────────────────────────── */
interface ModalState {
  isOpen:boolean; title:string; message:string;
  confirmText?:string; type?:"danger"|"primary";
  isPrompt?:boolean; onConfirm:(val?:string)=>void;
}

function ConfirmModal({ modal, promptValue, setPromptValue, onClose }:{
  modal:ModalState; promptValue:string; setPromptValue:(v:string)=>void; onClose:()=>void;
}) {
  const isPrimary = modal.type === "primary";
  const color     = isPrimary ? T.accent : T.red;
  const lo        = isPrimary ? T.accentLo : T.redLo;
  const gradient  = isPrimary ? `linear-gradient(135deg,${T.accent},#8B5CF6)` : "linear-gradient(135deg,#FF4D6D,#FF6B35)";
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal.isPrompt && modal.isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [modal.isOpen, modal.isPrompt]);

  return (
    <AnimatePresence>
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose} className="absolute inset-0"
            style={{ background:"rgba(5,5,8,0.78)", backdropFilter:"blur(10px)" }} />
          <motion.div
            initial={{ opacity:0, y:28, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1, transition:{ duration:0.32, ease:[0.22,1,0.36,1] } }}
            exit={{ opacity:0, y:16, scale:0.97, transition:{ duration:0.18 } }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background:"rgba(16,15,22,0.98)", border:`1px solid ${color}30`, backdropFilter:"blur(40px)" }}
          >
            <div className="h-0.5" style={{ background:`linear-gradient(90deg,${color},transparent)` }} />
            <div className="p-7">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background:lo, border:`1px solid ${color}30` }}>
                    {isPrimary ? <Edit2 size={16} style={{ color }} /> : <AlertTriangle size={16} style={{ color }} />}
                  </div>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>{modal.title}</h3>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background:"rgba(255,255,255,0.04)", color:T.muted }}>
                  <X size={15} />
                </button>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>{modal.message}</p>
              {modal.isPrompt && (
                <div className="mb-7">
                  <div className="rounded-2xl" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.accentMd}`, boxShadow:`0 0 0 3px ${T.accentLo}` }}>
                    <input ref={inputRef} type="text" value={promptValue}
                      onChange={e => setPromptValue(e.target.value)}
                      onKeyDown={e => { if (e.key==="Enter") modal.onConfirm(promptValue); }}
                      className="w-full bg-transparent px-5 py-3.5 text-sm outline-none"
                      style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }} />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
                  style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>
                  Cancel
                </button>
                <button onClick={() => modal.onConfirm(modal.isPrompt ? promptValue : undefined)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background:gradient, boxShadow:`0 4px 20px ${color}40`, fontFamily:"'DM Sans',sans-serif" }}>
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

/* ─── ChannelRow ─────────────────────────────────────────────────────────── */
function ChannelRow({ ch, onRename, onDelete, deleting }:{
  ch:any; onRename:()=>void; onDelete:()=>void; deleting:boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div layout key={ch._id}
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20, transition:{ duration:0.18 } }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200"
      style={{ background:hov ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", border:`1px solid ${hov ? T.borderHi : T.border}` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
          <Hash size={13} style={{ color:T.accent }} />
        </div>
        <span className="text-sm font-medium" style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }}>{ch.name}</span>
      </div>
      <motion.div className="flex items-center gap-1.5" initial={{ opacity:0 }} animate={{ opacity:hov ? 1 : 0 }} transition={{ duration:0.15 }}>
        <button onClick={onRename} title="Rename"
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.muted }}>
          <Edit2 size={12} />
        </button>
        <button onClick={onDelete} disabled={deleting} title="Delete"
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background:T.redLo, border:`1px solid rgba(255,77,109,0.20)`, color:T.red }}>
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── WorkspaceAvatar ────────────────────────────────────────────────────── */
function WorkspaceAvatar({ workspace, canManage, uploading, onChange }: {
  workspace: any; canManage: boolean; uploading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [hov, setHov] = useState(false);
  const name     = workspace?.name ?? "";
  const initials = name.slice(0, 2).toUpperCase();
  const hue      = name.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360;

  return (
    <div className="flex items-center gap-5">
      {/* Avatar */}
      <div className="relative shrink-0"
        onMouseEnter={() => canManage && setHov(true)}
        onMouseLeave={() => setHov(false)}>
        <div
          className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center transition-all duration-300"
          style={{
            background: workspace.avatar ? "transparent" : `hsla(${hue},60%,45%,0.15)`,
            border: `2px solid ${hov && canManage ? T.accentMd : T.border}`,
            boxShadow: hov && canManage ? `0 0 0 3px ${T.accentLo}` : "none",
          }}
        >
          {workspace.avatar ? (
            <img src={workspace.avatar} alt="Workspace logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold" style={{ color:`hsl(${hue},65%,65%)`, fontFamily:"'Sora',sans-serif" }}>
              {initials || "WS"}
            </span>
          )}

          {/* hover overlay */}
          {canManage && (
            <AnimatePresence>
              {(hov || uploading) && (
                <motion.label
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer rounded-3xl"
                  style={{ background:"rgba(8,8,16,0.75)", backdropFilter:"blur(4px)" }}
                >
                  <input type="file" accept="image/*" hidden onChange={onChange} />
                  {uploading
                    ? <Loader2 size={18} style={{ color:T.accent }} className="animate-spin" />
                    : <Camera size={18} style={{ color:T.accent }} />
                  }
                  <span className="text-[10px] mt-1 font-semibold" style={{ color:T.accent }}>
                    {uploading ? "Uploading" : "Change"}
                  </span>
                </motion.label>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Info */}
      <div>
        <p className="text-sm font-semibold text-white mb-1" style={{ fontFamily:"'DM Sans',sans-serif" }}>
          Workspace Logo
        </p>
        <p className="text-xs mb-3" style={{ color:T.muted }}>
          Recommended: 256×256 px, PNG or JPG
        </p>
        {canManage && (
          <label className="cursor-pointer inline-flex">
            <input type="file" accept="image/*" hidden onChange={onChange} />
            <span
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-80"
              style={{ background:T.accentLo, border:`1px solid ${T.accentMd}`, color:T.accent, fontFamily:"'DM Sans',sans-serif" }}
            >
              <ImagePlus size={13} />
              {uploading ? "Uploading…" : workspace.avatar ? "Change Logo" : "Upload Logo"}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function WorkspaceSettingsPage() {
  const router      = useRouter();
  const params      = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace]             = useState<any>(null);
  const [role, setRole]                       = useState("");
  const [channels, setChannels]               = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [savedPulse, setSavedPulse]           = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<string|null>(null);
  const [promptValue, setPromptValue]         = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen]     = useState(false);
  const [selectedImage, setSelectedImage]     = useState<string|null>(null);
  const [toast, setToast]                     = useState<{ message:string; type:"success"|"error" }|null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen:false, title:"", message:"", type:"danger", onConfirm:()=>{},
  });

  const normalizedRole = role?.toUpperCase?.() || "";
  const canManage      = normalizedRole === "OWNER" || normalizedRole === "ADMIN";

  const showToast = (message:string, type:"success"|"error"="success") => {
    setToast({ message, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3200);
  };

  /* ── fetch ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wRes, cRes] = await Promise.all([
          fetch(`/api/workspace/${workspaceId}`),
          fetch(`/api/channel/list?workspaceId=${workspaceId}`),
        ]);
        const wData = await wRes.json();
        const cData = await cRes.json();
        if (wRes.ok) { setWorkspace(wData.workspace); setRole(wData.role); }
        if (cRes.ok) { setChannels(cData.channels); }
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
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ workspaceId, name:workspace.name, description:workspace.description }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error, "error");
      setSavedPulse(true);
      showToast("Workspace updated successfully!", "success");
      setTimeout(() => setSavedPulse(false), 2200);
    } catch (err) { console.error(err); showToast("An unexpected error occurred.", "error"); }
    finally { setSaving(false); }
  };

  /* ── avatar upload ── */
  const handleWorkspaceAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setSelectedImage(reader.result as string); setCropModalOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadCroppedAvatar = async (croppedBlob: Blob) => {
    setCropModalOpen(false); setSelectedImage(null);
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "workspace_avatar.jpg");
      formData.append("workspaceId", workspaceId);
      const res  = await fetch("/api/workspace/avatar", { method:"POST", body:formData });
      const data = await res.json();
      if (!res.ok) return showToast(data.error, "error");
      setWorkspace({ ...workspace, avatar:data.avatar });
      showToast("Workspace logo updated!", "success");
    } catch (err) { console.error(err); showToast("Failed to upload workspace logo.", "error"); }
    finally { setUploadingAvatar(false); }
  };

  /* ── rename channel ── */
  const renameChannel = (channelId:string, currentName:string) => {
    setPromptValue(currentName);
    setConfirmModal({
      isOpen:true, title:"Rename Channel", message:"Enter a new name for this channel:",
      confirmText:"Rename", type:"primary", isPrompt:true,
      onConfirm: async (newName?:string) => {
        if (!newName || newName.trim()==="" || newName===currentName) { setConfirmModal(p=>({...p,isOpen:false})); return; }
        setConfirmModal(p=>({...p,isOpen:false}));
        try {
          const res  = await fetch("/api/channel/rename", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ channelId, name:newName.trim() }) });
          const data = await res.json();
          if (!res.ok) return showToast(data.error, "error");
          setChannels(prev => prev.map(ch => ch._id===channelId ? { ...ch, name:newName.trim() } : ch));
          showToast("Channel renamed successfully!", "success");
        } catch (err) { console.error(err); showToast("Failed to rename channel.", "error"); }
      },
    });
  };

  /* ── delete channel ── */
  const deleteChannel = (channelId:string) => {
    setConfirmModal({
      isOpen:true, title:"Delete Channel",
      message:"This channel and all its messages will be permanently removed. This cannot be undone.",
      confirmText:"Delete", type:"danger",
      onConfirm: async () => {
        setConfirmModal(p=>({...p,isOpen:false}));
        try {
          setDeletingChannel(channelId);
          const res  = await fetch("/api/channel/delete", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ channelId }) });
          const data = await res.json();
          if (!res.ok) return showToast(data.error, "error");
          setChannels(prev => prev.filter(ch => ch._id!==channelId));
          showToast("Channel deleted.", "success");
        } catch (err) { console.error(err); showToast("Failed to delete channel.", "error"); }
        finally { setDeletingChannel(null); }
      },
    });
  };

  /* ── delete workspace ── */
  const deleteWorkspace = () => {
    setConfirmModal({
      isOpen:true, title:"Delete Workspace",
      message:"All channels, messages, and member data will be permanently erased. This cannot be undone.",
      confirmText:"Delete Workspace", type:"danger",
      onConfirm: async () => {
        setConfirmModal(p=>({...p,isOpen:false}));
        try {
          const res  = await fetch("/api/workspace/delete", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ workspaceId }) });
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
      isOpen:true, title:"Leave Workspace",
      message:"You will lose access immediately. You'll need a new invite to rejoin.",
      confirmText:"Leave Workspace", type:"danger",
      onConfirm: async () => {
        setConfirmModal(p=>({...p,isOpen:false}));
        try {
          const res  = await fetch("/api/workspace/leave", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ workspaceId }) });
          const data = await res.json();
          if (!res.ok) return showToast(data.error, "error");
          router.push("/dashboard");
        } catch (err) { console.error(err); showToast("Failed to leave workspace.", "error"); }
      },
    });
  };

  /* ── loading ── */
  if (loading || !workspace) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background:"#080810" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
              <Sparkles className="w-6 h-6 animate-pulse" style={{ color:T.accent }} />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping" style={{ background:T.accentLo, animationDuration:"2s" }} />
          </div>
          <p className="text-sm font-medium" style={{ color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>Loading settings…</p>
        </div>
      </div>
    );
  }

  const container = { hidden:{}, show:{ transition:{ staggerChildren:0.10 } } };

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#080810", color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-120, left:-100, width:480, height:480, borderRadius:"50%", background:"rgba(108,99,255,0.08)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", bottom:-80, right:-60, width:360, height:360, borderRadius:"50%", background:"rgba(255,77,109,0.05)", filter:"blur(100px)" }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* HEADER */}
          <motion.div variants={{ hidden:{opacity:0,y:16}, show:{opacity:1,y:0,transition:{duration:0.45,ease:[0.22,1,0.36,1]}} }} className="mb-8">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                  <Sparkles size={18} style={{ color:T.accent }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>Settings</h1>
                  <p className="text-sm" style={{ color:T.muted }}>
                    Manage <span style={{ color:T.accent, fontWeight:600 }}>{workspace.name}</span>
                  </p>
                </div>
              </div>
              <PillBadge
                label={normalizedRole || "MEMBER"}
                color={normalizedRole==="OWNER" ? T.gold : normalizedRole==="ADMIN" ? T.accent : T.muted}
              />
            </div>
          </motion.div>

          {/* GENERAL */}
          <SectionCard glowColor="rgba(108,99,255,0.15)" accentBar={`linear-gradient(90deg,${T.accent},#8B5CF6,transparent)`}>
            <div className="p-7 sm:p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                  <Shield size={14} style={{ color:T.accent }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>General Details</h2>
                  <p className="text-xs" style={{ color:T.muted }}>Name, logo and workspace identity</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* AVATAR */}
                <div>
                  <label className="block text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color:T.muted }}>
                    Workspace Logo
                  </label>
                  <WorkspaceAvatar
                    workspace={workspace}
                    canManage={canManage}
                    uploading={uploadingAvatar}
                    onChange={handleWorkspaceAvatar}
                  />
                </div>

                <div className="h-px" style={{ background:T.border }} />

                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color:T.muted }}>Workspace Name</label>
                  <StyledInput value={workspace.name} onChange={v => setWorkspace({...workspace,name:v})} disabled={!canManage} placeholder="My Workspace" />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color:T.muted }}>Description</label>
                  <StyledTextarea value={workspace.description} onChange={v => setWorkspace({...workspace,description:v})} disabled={!canManage} />
                </div>

                {!canManage && (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, color:T.muted }}>
                    <Lock size={12} /> Only owners and admins can modify workspace details.
                  </div>
                )}

                {canManage && (
                  <div className="flex justify-end pt-1">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-300 active:scale-95"
                      style={{
                        background: savedPulse ? "linear-gradient(135deg,#10B981,#059669)" : `linear-gradient(135deg,${T.accent},#8B5CF6)`,
                        boxShadow: savedPulse ? "0 4px 20px rgba(16,185,129,0.35)" : "0 4px 20px rgba(108,99,255,0.35)",
                        opacity: saving ? 0.8 : 1, fontFamily:"'DM Sans',sans-serif",
                      }}>
                      {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                       : savedPulse ? <><Check size={14} /> Saved!</>
                       : <><Save size={14} /> Save Changes</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* CHANNELS */}
          <div className="mt-6">
            <SectionCard glowColor="rgba(108,99,255,0.07)">
              <div className="p-7 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                      <Hash size={14} style={{ color:T.accent }} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>Channels</h2>
                      <p className="text-xs" style={{ color:T.muted }}>{channels.length} channel{channels.length!==1?"s":""} in this workspace</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl" style={{ background:T.accentLo, color:T.accent, border:`1px solid ${T.accentMd}` }}>
                    {channels.length}
                  </span>
                </div>

                <div className="relative">
                  {!canManage && (
                    <div className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center"
                      style={{ background:"rgba(8,8,16,0.82)", backdropFilter:"blur(12px)" }}>
                      <div className="flex flex-col items-center gap-3 p-6 rounded-3xl max-w-xs text-center"
                        style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}` }}>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}` }}>
                          <Lock size={18} style={{ color:T.muted }} />
                        </div>
                        <p className="text-sm font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>Restricted Access</p>
                        <p className="text-xs leading-relaxed" style={{ color:T.muted }}>Only owners and admins can manage channels.</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 min-h-[80px]">
                    <AnimatePresence mode="popLayout">
                      {channels.length === 0 ? (
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-2 py-10 text-center">
                          <Hash size={26} style={{ color:T.muted, opacity:0.4 }} />
                          <p className="text-sm" style={{ color:T.muted }}>No channels yet</p>
                        </motion.div>
                      ) : channels.map(ch => (
                        <ChannelRow key={ch._id} ch={ch}
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
          </div>

          {/* DANGER */}
          <div className="mt-6">
            <SectionCard glowColor="rgba(255,77,109,0.10)" accentBar={`linear-gradient(90deg,${T.red},#FF8C60,transparent)`}>
              <div className="p-7 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:T.redLo, border:`1px solid rgba(255,77,109,0.22)` }}>
                    <AlertTriangle size={14} style={{ color:T.red }} />
                  </div>
                  <h2 className="text-base font-bold" style={{ fontFamily:"'Sora',sans-serif", color:T.red }}>Danger Zone</h2>
                </div>
                <p className="text-xs mb-6 ml-11" style={{ color:"rgba(255,77,109,0.5)" }}>These actions are permanent and irreversible.</p>

                {normalizedRole === "OWNER" ? (
                  <div className="flex items-center justify-between p-5 rounded-2xl gap-4 flex-wrap" style={{ background:T.redLo, border:`1px solid rgba(255,77,109,0.18)` }}>
                    <div>
                      <p className="text-sm font-semibold text-white">Delete this workspace</p>
                      <p className="text-xs mt-0.5" style={{ color:"rgba(255,77,109,0.55)" }}>Permanently removes all channels, members, and data.</p>
                    </div>
                    <button onClick={deleteWorkspace}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 shrink-0"
                      style={{ background:"linear-gradient(135deg,#FF4D6D,#FF6B35)", boxShadow:"0 4px 20px rgba(255,77,109,0.30)", fontFamily:"'DM Sans',sans-serif" }}>
                      <Trash2 size={13} /> Delete Workspace
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-5 rounded-2xl gap-4 flex-wrap" style={{ background:T.redLo, border:`1px solid rgba(255,77,109,0.18)` }}>
                    <div>
                      <p className="text-sm font-semibold text-white">Leave this workspace</p>
                      <p className="text-xs mt-0.5" style={{ color:"rgba(255,77,109,0.55)" }}>You'll need a new invite to regain access.</p>
                    </div>
                    <button onClick={leaveWorkspace}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 shrink-0"
                      style={{ background:"rgba(255,77,109,0.12)", border:`1px solid rgba(255,77,109,0.30)`, color:T.red, fontFamily:"'DM Sans',sans-serif" }}>
                      <LogOut size={13} /> Leave Workspace
                    </button>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

        </motion.div>
      </div>

      <ConfirmModal modal={confirmModal} promptValue={promptValue} setPromptValue={setPromptValue}
        onClose={() => setConfirmModal(p=>({...p,isOpen:false}))} />

      <Toast toast={toast} onClose={() => setToast(null)} />

      {selectedImage && (
        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => { setCropModalOpen(false); setSelectedImage(null); }}
          imageSrc={selectedImage}
          onCropComplete={uploadCroppedAvatar}
          aspectRatio={1}
        />
      )}
    </div>
  );
}