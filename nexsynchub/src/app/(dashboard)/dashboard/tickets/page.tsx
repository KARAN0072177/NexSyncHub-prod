"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle, CheckCircle2, Clock3, ExternalLink,
  FileText, Inbox, Loader2, MailQuestion, MessageSquare,
  Paperclip, RefreshCw, SendHorizonal, ShieldCheck, User, LifeBuoy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const T = {
  bg: "#03060F",
  surface: "rgba(8,16,40,0.70)",
  surfaceHi: "rgba(10,22,52,0.86)",
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
  roseLo: "rgba(255,77,109,0.12)",
  roseMd: "rgba(255,77,109,0.25)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

type SupportAttachment = {
  filename?: string;
  url?: string;
  size?: number;
  mimeType?: string;
};

type TicketMessage = {
  _id?: string;
  message: string;
  sentAt: string;
};

type Ticket = {
  _id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  attachments?: SupportAttachment[];
  adminNotes?: string;
  resolutionMessage?: string;
  adminFollowUps?: TicketMessage[];
  userReplies?: TicketMessage[];
  handledBy?: { username?: string; email?: string };
  createdAt: string;
  updatedAt?: string;
};

const STATUS_CFG: Record<string, { label: string; color: string; lo: string; md: string; icon: React.ElementType }> = {
  open: { label: "Open", color: T.rose, lo: T.roseLo, md: T.roseMd, icon: AlertTriangle },
  in_progress: { label: "In Progress", color: T.gold, lo: T.goldLo, md: T.goldMd, icon: Clock3 },
  resolved: { label: "Resolved", color: T.emerald, lo: T.emeraldLo, md: T.emeraldMd, icon: CheckCircle2 },
  closed: { label: "Closed", color: T.muted, lo: "rgba(255,255,255,0.05)", md: "rgba(255,255,255,0.12)", icon: ShieldCheck },
};

function statusConfig(status: string) {
  return STATUS_CFG[status] ?? STATUS_CFG.open;
}

function formatSize(bytes?: number) {
  if (!bytes) return "0 KB";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig(status);
  const Icon = cfg.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
      style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}` }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function renderInlineMessage(value: string) {
  const parts = value.split(/(\*\*.+?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function renderFormattedMessage(value: string): ReactNode {
  const normalized =
    value
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\s+\*\*([^*]+):\*\*/g, "\n\n**$1:**")
      .replace(/\s+(\d+\.\s+)/g, "\n$1")
      .replace(/\s+-\s+/g, "\n- ");

  return normalized
    .split(/\n{2,}/)
    .map((block, blockIndex) => {
      const lines =
        block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

      if (!lines.length) {
        return null;
      }

      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return (
          <ol key={blockIndex} className="list-decimal pl-5 space-y-2">
            {lines.map((line, lineIndex) => (
              <li key={lineIndex} className="leading-7">
                {renderInlineMessage(line.replace(/^\d+\.\s+/, ""))}
              </li>
            ))}
          </ol>
        );
      }

      if (lines.every((line) => /^-\s+/.test(line))) {
        return (
          <ul key={blockIndex} className="list-disc pl-5 space-y-2">
            {lines.map((line, lineIndex) => (
              <li key={lineIndex} className="leading-7">
                {renderInlineMessage(line.replace(/^-\s+/, ""))}
              </li>
            ))}
          </ul>
        );
      }

      return (
        <p key={blockIndex} className="leading-7">
          {lines.map((line, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 && <br />}
              {renderInlineMessage(line)}
            </span>
          ))}
        </p>
      );
    });
}

function TimelineItem({
  label,
  message,
  date,
  tone,
}: {
  label: string;
  message: string;
  date: string;
  tone: "user" | "admin" | "system";
}) {
  const cfg =
    tone === "admin"
      ? { color: T.gold, lo: T.goldLo, md: T.goldMd, icon: MailQuestion }
      : tone === "system"
        ? { color: T.emerald, lo: T.emeraldLo, md: T.emeraldMd, icon: CheckCircle2 }
        : { color: T.accent, lo: T.accentLo, md: T.accentMd, icon: MessageSquare };
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: cfg.lo, border: `1px solid ${cfg.md}` }}
      >
        <Icon size={14} style={{ color: cfg.color }} />
      </div>
      <div
        className="flex-1 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
            {label}
          </p>
          <p className="text-xs shrink-0" style={{ color: T.muted }}>
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </p>
        </div>
        <div className="text-sm space-y-4" style={{ color: T.text }}>
          {renderFormattedMessage(message)}
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const selectedTicket =
    tickets.find((ticket) => ticket._id === selectedId) ??
    tickets[0] ??
    null;

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/support/tickets");
      const data = await res.json();

      if (res.ok) {
        setTickets(data.tickets ?? []);
        setSelectedId((current) => current ?? data.tickets?.[0]?._id ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const timeline = useMemo(() => {
    if (!selectedTicket) return [];

    return [
      {
        id: "initial",
        label: "Your request",
        message: selectedTicket.message,
        date: selectedTicket.createdAt,
        tone: "user" as const,
      },
      ...(selectedTicket.adminFollowUps ?? []).map((item, index) => ({
        id: item._id ?? `admin-${index}`,
        label: "Support asked",
        message: item.message,
        date: item.sentAt,
        tone: "admin" as const,
      })),
      ...(selectedTicket.userReplies ?? []).map((item, index) => ({
        id: item._id ?? `reply-${index}`,
        label: "Your reply",
        message: item.message,
        date: item.sentAt,
        tone: "user" as const,
      })),
      ...(selectedTicket.resolutionMessage
        ? [{
          id: "resolution",
          label: "Resolution",
          message: selectedTicket.resolutionMessage,
          date: selectedTicket.updatedAt ?? selectedTicket.createdAt,
          tone: "system" as const,
        }]
        : []),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedTicket]);

  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;

    setSending(true);

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket._id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: reply,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Unable to send reply.");
        return;
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === selectedTicket._id
            ? {
              ...data.ticket,
              attachments:
                data.ticket.attachments?.length
                  ? data.ticket.attachments
                  : ticket.attachments,
            }
            : ticket
        )
      );
      setReply("");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(61,123,255,0.18); border-radius:4px; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -180, left: -120, width: 620, height: 620, borderRadius: "50%", background: "rgba(61,123,255,0.06)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -120, right: -80, width: 480, height: 480, borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg,${T.accent},${T.violet})` }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted }}>
                Support Center
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Sora',sans-serif" }}>
              Your Tickets
            </h1>
            <p className="text-sm mt-2 max-w-xl" style={{ color: T.muted }}>
              Track support requests, view admin follow-ups, and reply with requested details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/support-center"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: T.violetLo, border: `1px solid ${T.violetMd}`, color: T.violet }}
            >
              <LifeBuoy size={14} />
              Support Center
            </Link>
            <button
              onClick={fetchTickets}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: T.accentLo, border: `1px solid ${T.accentMd}`, color: T.accent }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin" size={28} style={{ color: T.accent }} />
          </div>
        ) : tickets.length === 0 ? (
          <div
            className="flex flex-col items-center text-center gap-5 py-28 rounded-3xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}
          >
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
              <Inbox size={26} style={{ color: T.accent }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Sora',sans-serif" }}>
                No tickets yet
              </h2>
              <p className="text-sm" style={{ color: T.muted }}>
                Tickets you submit from support will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[380px_1fr] gap-5">
            <div className="space-y-3">
              {tickets.map((ticket, index) => {
                const active = selectedTicket?._id === ticket._id;
                const cfg = statusConfig(ticket.status);

                return (
                  <motion.button
                    key={ticket._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => setSelectedId(ticket._id)}
                    className="w-full text-left rounded-3xl p-5 transition-all"
                    style={{
                      background: active ? T.surfaceHi : T.surface,
                      border: `1px solid ${active ? cfg.md : T.border}`,
                      boxShadow: active ? `0 8px 30px ${cfg.lo}` : "none",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <StatusBadge status={ticket.status} />
                      <span className="text-xs" style={{ color: T.muted }}>
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-2 mb-2" style={{ fontFamily: "'Sora',sans-serif" }}>
                      {ticket.subject}
                    </h3>
                    <p className="text-sm line-clamp-2 leading-6" style={{ color: T.muted }}>
                      {ticket.message}
                    </p>
                    {(ticket.adminFollowUps?.length || ticket.userReplies?.length) ? (
                      <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: T.accent }}>
                        <MessageSquare size={12} />
                        {(ticket.adminFollowUps?.length ?? 0) + (ticket.userReplies?.length ?? 0)} follow-up messages
                      </div>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>

            {selectedTicket && (
              <div
                className="rounded-3xl overflow-hidden"
                style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(28px)" }}
              >
                <div className="h-0.5" style={{ background: `linear-gradient(90deg,${T.accent},${T.violet},transparent)` }} />
                <div className="p-6 sm:p-7 border-b" style={{ borderColor: T.border }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <StatusBadge status={selectedTicket.status} />
                      <h2 className="text-2xl font-black text-white mt-3" style={{ fontFamily: "'Sora',sans-serif" }}>
                        {selectedTicket.subject}
                      </h2>
                      <p className="text-sm mt-2" style={{ color: T.muted }}>
                        {selectedTicket.category.replaceAll("_", " ")} · {selectedTicket.priority} priority
                      </p>
                    </div>
                  </div>

                  {selectedTicket.attachments?.length ? (
                    <div className="flex flex-wrap gap-2 mt-5">
                      {selectedTicket.attachments.map((file, index) => (
                        <a
                          key={`${file.filename}-${index}`}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs"
                          style={{ background: T.accentLo, border: `1px solid ${T.accentMd}`, color: T.accent }}
                        >
                          <FileText size={13} />
                          <span className="max-w-[180px] truncate">{file.filename}</span>
                          <span style={{ color: T.muted }}>{formatSize(file.size)}</span>
                          <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-5 text-xs" style={{ color: T.muted }}>
                      <Paperclip size={13} />
                      No attachments
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-7 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {timeline.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <TimelineItem
                          label={item.label}
                          message={item.message}
                          date={item.date}
                          tone={item.tone}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div
                    className="rounded-3xl p-5 mt-6"
                    style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                        <User size={14} style={{ color: T.accent }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>
                          Reply to Support
                        </h3>
                        <p className="text-xs" style={{ color: T.muted }}>
                          Share requested details, screenshots context, or reproduction steps.
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={5}
                      placeholder="Write your reply..."
                      className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.text }}
                    />

                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleSendReply}
                        disabled={sending || !reply.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 transition-all active:scale-95"
                        style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: "0 5px 20px rgba(61,123,255,0.28)" }}
                      >
                        {sending
                          ? <><Loader2 size={14} className="animate-spin" /> Sending...</>
                          : <><SendHorizonal size={14} /> Send Reply</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
