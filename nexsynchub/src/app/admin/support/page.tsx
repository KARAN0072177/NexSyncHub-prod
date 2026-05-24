"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";
import {
  LifeBuoy, Search, Loader2, MessageSquareWarning,
  Clock3, CheckCircle2, AlertTriangle, Inbox,
  X, Paperclip, FileText, ExternalLink, ChevronDown,
  RefreshCw, User, Calendar, Tag, StickyNote,
  SendHorizonal, ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ─── tokens (matches admin panel) ──────────────────────────────────────── */
const T = {
  bg: "#050508",
  surface: "rgba(255,255,255,0.02)",
  surfaceHi: "rgba(14,14,20,0.85)",
  border: "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  accent: "#6C63FF",
  accentLo: "rgba(108,99,255,0.12)",
  accentMd: "rgba(108,99,255,0.25)",
  violet: "#8B5CF6",
  violetLo: "rgba(139,92,246,0.12)",
  violetMd: "rgba(139,92,246,0.25)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  emeraldMd: "rgba(16,185,129,0.25)",
  gold: "#F59E0B",
  goldLo: "rgba(245,158,11,0.12)",
  goldMd: "rgba(245,158,11,0.25)",
  rose: "#FF4D6D",
  roseLo: "rgba(255,77,109,0.12)",
  roseMd: "rgba(255,77,109,0.25)",
  text: "#F8FAFC",
  muted: "#8A8F9E",
};

type Ticket = {
  _id: string; category: string; subject: string;
  message: string; status: string; priority: string;
  attachments: any[]; createdAt: string;
  user?: { username?: string; email?: string; avatar?: string; role?: string };
  adminNotes?: string; handledBy?: { username?: string; email?: string };
  resolutionMessage?: string;
};

/* ─── status config ──────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { color: string; lo: string; md: string; label: string; icon: React.ElementType }> = {
  open: { color: T.rose, lo: T.roseLo, md: T.roseMd, label: "Open", icon: AlertTriangle },
  in_progress: { color: T.gold, lo: T.goldLo, md: T.goldMd, label: "In Progress", icon: Clock3 },
  resolved: { color: T.emerald, lo: T.emeraldLo, md: T.emeraldMd, label: "Resolved", icon: CheckCircle2 },
  closed: { color: T.muted, lo: "rgba(255,255,255,0.05)", md: "rgba(255,255,255,0.12)", label: "Closed", icon: ShieldCheck },
};

const PRIORITY_CFG: Record<string, { color: string; lo: string; md: string }> = {
  low: { color: T.emerald, lo: T.emeraldLo, md: T.emeraldMd },
  medium: { color: T.gold, lo: T.goldLo, md: T.goldMd },
  high: { color: T.rose, lo: T.roseLo, md: T.roseMd },
  urgent: { color: "#FF2D55", lo: "rgba(255,45,85,0.12)", md: "rgba(255,45,85,0.25)" },
};

function getStatusCfg(s: string) { return STATUS_CFG[s] ?? STATUS_CFG.closed; }
function getPriorityCfg(p: string) { return PRIORITY_CFG[p] ?? PRIORITY_CFG.medium; }

/* ─── StatusBadge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusCfg(status);
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}`, fontFamily: "'DM Sans',sans-serif" }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

/* ─── PriorityBadge ──────────────────────────────────────────────────────── */
function PriorityBadge({ priority }: { priority: string }) {
  const cfg = getPriorityCfg(priority);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase"
      style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}`, letterSpacing: "0.06em" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {priority}
    </span>
  );
}

/* ─── UserAvatar ─────────────────────────────────────────────────────────── */
function UserAvatar({ user, size = 9 }: { user?: Ticket["user"]; size?: number }) {
  const letter = (user?.username?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  const px = `${size * 4}px`;
  return user?.avatar ? (
    <img src={user.avatar} alt={user.username} className="rounded-2xl object-cover shrink-0"
      style={{ width: px, height: px, border: `1px solid ${T.accentMd}` }} />
  ) : (
    <div className="rounded-2xl flex items-center justify-center text-xs font-bold shrink-0"
      style={{ width: px, height: px, background: T.accentLo, border: `1px solid ${T.accentMd}`, color: T.accent, fontFamily: "'Sora',sans-serif" }}>
      {letter}
    </div>
  );
}

/* ─── StyledTextarea ─────────────────────────────────────────────────────── */
function StyledTextarea({ value, onChange, placeholder, rows = 5, accentColor = T.accent, accentLo = T.accentLo, accentMd = T.accentMd }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
  accentColor?: string; accentLo?: string; accentMd?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="rounded-2xl transition-all duration-300"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${focused ? accentMd : T.border}`, boxShadow: focused ? `0 0 0 3px ${accentLo}` : "none" }}>
      <textarea rows={rows} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-5 py-4 text-sm outline-none resize-none"
        style={{ color: T.text, fontFamily: "'DM Sans',sans-serif" }} />
    </div>
  );
}

/* ─── SkeletonCard ───────────────────────────────────────────────────────── */
function SkeletonCard({ idx }: { idx: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
      className="rounded-3xl p-6 animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-5 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
          <div className="h-4 w-3/4 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-3 w-1/2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }} />
        </div>
        <div className="h-8 w-24 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    </motion.div>
  );
}

/* ─── TICKET MODAL ───────────────────────────────────────────────────────── */
function TicketModal({ ticket, onClose, onSave }: {
  ticket: Ticket; onClose: () => void;
  onSave: (ticketId: string, status: string, adminNotes: string, resolutionMessage: string) => Promise<void>;
}) {
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes ?? "");
  const [resolutionMessage, setResolutionMessage] = useState(ticket.resolutionMessage ?? "");
  const [status, setStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);

  const [

    aiSummary,

    setAiSummary,

  ] = useState("");

  const [

    aiSummaryLoading,

    setAiSummaryLoading,

  ] = useState(false);

  const [

    enhancingNotes,

    setEnhancingNotes,

  ] = useState(false);

  const [

    enhancingResolution,

    setEnhancingResolution,

  ] = useState(false);

  const cfg = getStatusCfg(status);
  const priCfg = getPriorityCfg(ticket.priority);

  const generateAISummary =
    async () => {

      try {

        setAiSummaryLoading(true);

        const res =
          await fetch(

            "/api/admin/support/ai-summary",

            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  subject:
                    ticket.subject,

                  message:
                    ticket.message,

                  category:
                    ticket.category,

                  attachments:
                    ticket.attachments,

                }),

            }

          );

        const data =
          await res.json();

        if (!res.ok) {

          alert(
            data.error ||
            "Failed to generate AI summary"
          );

          return;

        }

        setAiSummary(
          data.summary
        );

      } catch (error) {

        console.error(error);

        alert(
          "AI summary failed"
        );

      } finally {

        setAiSummaryLoading(false);

      }

    };

  const enhanceAdminText =
    async (
      type:
        "notes"
        |
        "resolution"
    ) => {

      try {

        const targetText =
          type === "notes"

            ? adminNotes

            : resolutionMessage;

        if (
          !targetText.trim()
        ) {

          alert(
            "Please write something first."
          );

          return;

        }

        if (
          type === "notes"
        ) {

          setEnhancingNotes(
            true
          );

        } else {

          setEnhancingResolution(
            true
          );

        }

        const res =
          await fetch(

            "/api/admin/support/ai-enhance",

            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  type,

                  text:
                    targetText,

                }),

            }

          );

        const data =
          await res.json();

        if (!res.ok) {

          alert(
            data.error ||
            "AI enhancement failed"
          );

          return;

        }

        if (
          type === "notes"
        ) {

          setAdminNotes(
            data.enhancedText
          );

        } else {

          setResolutionMessage(
            data.enhancedText
          );

        }

      } catch (error) {

        console.error(error);

        alert(
          "AI enhancement failed"
        );

      } finally {

        setEnhancingNotes(
          false
        );

        setEnhancingResolution(
          false
        );

      }

    };

  const handleSave = async () => {
    setSaving(true);
    await onSave(ticket._id, status, adminNotes, resolutionMessage);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0"
        style={{ background: "rgba(5,5,8,0.80)", backdropFilter: "blur(12px)" }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2 } }}
        className="relative w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col"
        style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)", maxHeight: "92vh" }}
      >
        {/* top gradient bar */}
        <div className="h-0.5 shrink-0" style={{ background: `linear-gradient(90deg,${T.accent},${T.violet},transparent)` }} />

        {/* glow */}
        <div aria-hidden style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: T.accentLo, filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

        {/* MODAL HEADER */}
        <div className="relative z-10 flex items-start justify-between gap-4 p-6 sm:p-8 shrink-0"
          style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-start gap-4 min-w-0">
            <UserAvatar user={ticket.user} size={11} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge status={status} />
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs px-2 py-0.5 rounded-lg uppercase font-bold"
                  style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, letterSpacing: "0.05em" }}>
                  {ticket.category.replaceAll("_", " ")}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate"
                style={{ fontFamily: "'Sora',sans-serif" }}>
                {ticket.subject}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: T.muted }}>
                  <User size={10} /> {ticket.user?.username ?? "Unknown"} · {ticket.user?.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: T.muted }}>
                  <Calendar size={10} /> {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-2xl shrink-0 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.muted }}>
            <X size={16} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="relative z-10 overflow-y-auto flex-1 p-6 sm:p-8 space-y-7">

          {/* USER MESSAGE */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                <MessageSquareWarning size={12} style={{ color: T.accent }} />
              </div>
              <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>User Message</h3>
            </div>
            <div className="px-5 py-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
              <p className="text-sm leading-8 whitespace-pre-wrap" style={{ color: T.text, fontFamily: "'DM Sans',sans-serif" }}>
                {ticket.message}
              </p>
            </div>
          </div>

          {/* AI SUMMARY */}
          <div>

            <div className="flex items-center justify-between gap-3 mb-3">

              <div className="flex items-center gap-2">

                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{

                    background:
                      T.violetLo,

                    border:
                      `1px solid ${T.violetMd}`,

                  }}
                >

                  ✨

                </div>

                <h3
                  className="text-sm font-bold text-white"
                  style={{
                    fontFamily:
                      "'Sora',sans-serif",
                  }}
                >

                  AI Summary

                </h3>

              </div>

              <button

                onClick={generateAISummary}

                disabled={aiSummaryLoading}

                className="px-4 py-2 rounded-2xl text-xs font-semibold transition-all"

                style={{

                  background:
                    T.violetLo,

                  border:
                    `1px solid ${T.violetMd}`,

                  color:
                    T.violet,

                }}
              >

                {aiSummaryLoading

                  ? "Analyzing..."

                  : "Generate AI Summary"}

              </button>

            </div>

            <div
              className="rounded-2xl p-5 text-sm whitespace-pre-wrap leading-7"
              style={{

                background:
                  "rgba(255,255,255,0.03)",

                border:
                  `1px solid ${T.border}`,

                color:
                  aiSummary
                    ? T.text
                    : T.muted,

              }}
            >

              {aiSummary ||

                "AI will summarize the support request, uploaded screenshots, PDFs, logs, and suggest possible next actions."}

            </div>

          </div>

          {/* ATTACHMENTS */}
          {ticket.attachments?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: `1px solid ${T.goldMd}` }}>
                  <Paperclip size={12} style={{ color: T.gold }} />
                </div>
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>
                  Attachments
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-lg font-semibold" style={{ background: T.goldLo, color: T.gold }}>
                    {ticket.attachments.length}
                  </span>
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {ticket.attachments.map((file: any, i: number) => (
                  <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.border = `1px solid ${T.accentMd}`; el.style.background = T.accentLo; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.border = `1px solid ${T.border}`; el.style.background = "rgba(255,255,255,0.03)"; }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                      <FileText size={14} style={{ color: T.accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-white">{file.filename}</p>
                      <p className="text-xs" style={{ color: T.muted }}>{((file.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <ExternalLink size={13} style={{ color: T.muted }} className="shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {ticket.attachments?.length === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)` }}>
                  <Paperclip size={12} style={{ color: T.muted }} />
                </div>
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>Attachments</h3>
              </div>
              <p className="text-sm px-4 py-3 rounded-2xl" style={{ color: T.muted, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                No attachments uploaded.
              </p>
            </div>
          )}

          {/* STATUS SELECTOR */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: cfg.lo, border: `1px solid ${cfg.md}` }}>
                <Tag size={12} style={{ color: cfg.color }} />
              </div>
              <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>Update Status</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {(["open", "in_progress", "resolved", "closed"] as const).map(s => {
                const c = getStatusCfg(s);
                const Icon = c.icon;
                const active = status === s;
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: active ? c.lo : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? c.md : T.border}`,
                      color: active ? c.color : T.muted,
                      boxShadow: active ? `0 0 0 2px ${c.lo}` : "none",
                      fontFamily: "'DM Sans',sans-serif",
                    }}>
                    <Icon size={13} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ADMIN NOTES */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: T.violetLo, border: `1px solid ${T.violetMd}` }}>
                <StickyNote size={12} style={{ color: T.violet }} />
              </div>
              <div className="flex items-center justify-between gap-3 mb-3">

                <div className="flex items-center gap-2">

                  <h3
                    className="text-sm font-bold text-white"
                    style={{
                      fontFamily:
                        "'Sora',sans-serif",
                    }}
                  >

                    Admin Notes

                  </h3>

                </div>

                <button

                  onClick={() =>
                    enhanceAdminText(
                      "notes"
                    )
                  }

                  disabled={enhancingNotes}

                  className="px-4 py-2 rounded-2xl text-xs font-semibold transition-all"

                  style={{

                    background:
                      T.violetLo,

                    border:
                      `1px solid ${T.violetMd}`,

                    color:
                      T.violet,

                  }}
                >

                  {enhancingNotes

                    ? "Enhancing..."

                    : "✨ Enhance Notes"}

                </button>

              </div>
              <span className="text-xs ml-1" style={{ color: T.muted }}>(internal, not visible to user)</span>
            </div>
            <StyledTextarea value={adminNotes} onChange={setAdminNotes}
              placeholder="Internal notes about this ticket..."
              rows={5} accentColor={T.violet} accentLo={T.violetLo} accentMd={T.violetMd} />
          </div>

          {/* RESOLUTION MESSAGE */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: T.emeraldLo, border: `1px solid ${T.emeraldMd}` }}>
                <SendHorizonal size={12} style={{ color: T.emerald }} />
              </div>
              <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>Resolution Message</h3>
              <button

                onClick={() =>
                  enhanceAdminText(
                    "resolution"
                  )
                }

                disabled={
                  enhancingResolution
                }

                className="px-4 py-2 rounded-2xl text-xs font-semibold transition-all"

                style={{

                  background:
                    T.emeraldLo,

                  border:
                    `1px solid ${T.emeraldMd}`,

                  color:
                    T.emerald,

                }}
              >

                {enhancingResolution

                  ? "Enhancing..."

                  : "✨ Enhance Resolution"}

              </button>
              <span className="text-xs ml-1" style={{ color: T.muted }}>(sent to user)</span>
            </div>
            <StyledTextarea value={resolutionMessage} onChange={setResolutionMessage}
              placeholder="Explain how this was resolved or what the user should do..."
              rows={5} accentColor={T.emerald} accentLo={T.emeraldLo} accentMd={T.emeraldMd} />
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="relative z-10 flex items-center justify-end gap-3 px-6 sm:px-8 py-5 shrink-0"
          style={{ borderTop: `1px solid ${T.border}`, background: "rgba(0,0,0,0.20)" }}>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: "0 4px 20px rgba(61,123,255,0.35)", fontFamily: "'DM Sans',sans-serif" }}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={14} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── TICKET CARD ────────────────────────────────────────────────────────── */
function TicketCard({ ticket, index, onOpen }: { ticket: Ticket; index: number; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  const cfg = getStatusCfg(ticket.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: index < 15 ? index * 0.04 : 0 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden rounded-3xl transition-all duration-200"
      style={{
        background: T.surface,
        border: `1px solid ${hov ? cfg.md : T.border}`,
        backdropFilter: "blur(20px)",
        boxShadow: hov ? `0 6px 32px ${cfg.lo}` : "none",
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      {/* left color stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl" style={{ background: cfg.color, opacity: hov ? 1 : 0.4, transition: "opacity 0.3s" }} />

      <div className="pl-6 pr-5 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* LEFT */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <UserAvatar user={ticket.user} size={10} />

            <div className="min-w-0">
              {/* badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                  style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, letterSpacing: "0.04em" }}>
                  {ticket.category.replaceAll("_", " ")}
                </span>
              </div>

              {/* subject */}
              <h3 className="text-base font-bold text-white mb-1.5 truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
                {ticket.subject}
              </h3>

              {/* preview */}
              <p className="text-sm line-clamp-2 leading-6 mb-3" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>
                {ticket.message}
              </p>

              {/* meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: T.muted }}>
                <span className="flex items-center gap-1.5">
                  <User size={10} />
                  {ticket.user?.username ?? "Unknown"} · {ticket.user?.email}
                </span>
                {ticket.attachments?.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Paperclip size={10} />
                    {ticket.attachments.length} {ticket.attachments.length === 1 ? "file" : "files"}
                  </span>
                )}
                <span className="flex items-center gap-1.5 ml-auto">
                  <RefreshCw size={9} />
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center sm:items-start gap-2 shrink-0 sm:flex-col sm:items-end">
            <button onClick={onOpen}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-95"
              style={{
                background: hov ? `linear-gradient(135deg,${T.accent},${T.violet})` : T.accentLo,
                border: `1px solid ${T.accentMd}`,
                color: hov ? "#fff" : T.accent,
                boxShadow: hov ? `0 4px 16px ${T.accentMd}` : "none",
                fontFamily: "'DM Sans',sans-serif",
              }}>
              View Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/support");
      const data = await res.json();
      if (res.ok) setTickets(data.tickets);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTickets();
    socket.emit("join_admin_global");
    socket.on("support_ticket_created", fetchTickets);
    socket.on("support_ticket_updated", fetchTickets);
    return () => { socket.off("support_ticket_created"); socket.off("support_ticket_updated"); };
  }, []);

  const filteredTickets = useMemo(() => tickets.filter(t => {
    const q = query.toLowerCase();
    const matchSearch = !q
      || t.subject.toLowerCase().includes(q)
      || t.message.toLowerCase().includes(q)
      || (t.user?.email ?? "").toLowerCase().includes(q)
      || (t.user?.username ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  }), [tickets, query, statusFilter]);

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  const handleSave = async (ticketId: string, status: string, adminNotes: string, resolutionMessage: string) => {
    const res = await fetch("/api/admin/support/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status, adminNotes, resolutionMessage }),
    });
    const data = await res.json();
    if (res.ok) {
      setTickets(prev => prev.map(t => t._id === ticketId ? data.ticket : t));
      setSelectedTicket(null);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -160, left: -120, width: 600, height: 600, borderRadius: "50%", background: "rgba(108,99,255,0.06)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: 300, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,77,109,0.04)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: `0 4px 20px ${T.accentMd}` }}>
                <LifeBuoy size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
                  Support Tickets
                </h1>
                <p className="text-sm" style={{ color: T.muted }}>Manage support requests, bug reports, and user issues</p>
              </div>
            </div>

            {/* live indicator */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.emerald }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.emerald }} />
              </span>
              <span className="text-sm font-semibold" style={{ color: T.text }}>Live</span>
              <span className="text-sm" style={{ color: T.muted }}>{tickets.length} tickets</span>
            </div>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45 }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          {[
            { label: "Total Tickets", value: stats.total, icon: Inbox, color: T.accent, lo: T.accentLo, md: T.accentMd },
            { label: "Open", value: stats.open, icon: AlertTriangle, color: T.rose, lo: T.roseLo, md: T.roseMd },
            { label: "In Progress", value: stats.progress, icon: Clock3, color: T.gold, lo: T.goldLo, md: T.goldMd },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: T.emerald, lo: T.emeraldLo, md: T.emeraldMd },
          ].map(({ label, value, icon: Icon, color, lo, md }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.06 }}
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
              <p className="relative z-10 text-sm font-medium" style={{ color: T.muted }}>{label}</p>
              {/* micro bar */}
              <div className="relative z-10 mt-3 h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.total ? (value / stats.total) * 100 : 0}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.06 }}
                  className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${color},${color}80)` }} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FILTERS */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tickets, users, or subjects…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{ background: T.surface, border: `1px solid ${query ? T.accentMd : T.border}`, color: T.text, backdropFilter: "blur(20px)", boxShadow: query ? `0 0 0 3px ${T.accentLo}` : "none", fontFamily: "'DM Sans',sans-serif" }} />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: T.muted }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* status tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            {[
              { val: "all", label: "All" },
              { val: "open", label: "Open" },
              { val: "in_progress", label: "In Progress" },
              { val: "resolved", label: "Resolved" },
              { val: "closed", label: "Closed" },
            ].map(({ val, label }) => {
              const active = statusFilter === val;
              const cfg = val === "all" ? null : getStatusCfg(val);
              return (
                <button key={val} onClick={() => setStatusFilter(val)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: active ? (cfg ? cfg.lo : "rgba(255,255,255,0.08)") : "transparent",
                    color: active ? (cfg ? cfg.color : T.text) : T.muted,
                    border: active ? `1px solid ${cfg ? cfg.md : "rgba(255,255,255,0.14)"}` : "1px solid transparent",
                    fontFamily: "'DM Sans',sans-serif",
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* CONTENT */}
        {loading ? (
          <div className="space-y-4">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} idx={i} />)}</div>
        ) : filteredTickets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center rounded-3xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
              <MessageSquareWarning size={22} style={{ color: T.accent }} />
            </div>
            <p className="text-base font-semibold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>No tickets found</p>
            <p className="text-sm" style={{ color: T.muted }}>Support requests will appear here in real time.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredTickets.map((ticket, i) => (
                <TicketCard key={ticket._id} ticket={ticket} index={i}
                  onOpen={() => setSelectedTicket(ticket)} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* footer count */}
        {!loading && filteredTickets.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center text-xs mt-8" style={{ color: T.muted }}>
            Showing <span style={{ color: T.text, fontWeight: 600 }}>{filteredTickets.length}</span> of{" "}
            <span style={{ color: T.text, fontWeight: 600 }}>{tickets.length}</span> tickets · Updates in real time
          </motion.p>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </main>
  );
}