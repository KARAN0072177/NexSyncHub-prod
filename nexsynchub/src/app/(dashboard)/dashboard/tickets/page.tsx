"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle, CheckCircle2, Clock3, ExternalLink,
  FileText, Inbox, Loader2, MailQuestion, MessageSquare,
  Paperclip, RefreshCw, SendHorizonal, ShieldCheck, User, LifeBuoy, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { socket } from "@/lib/socket";

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
  user?: string | { _id?: string };
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  attachments?: SupportAttachment[];
  adminNotes?: string;
  resolutionMessage?: string;
  hasUnreadAdminReply?: boolean;
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
        className="flex-1 rounded-2xl p-4 transition-all"
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

function TicketListSkeleton() {
  return (
    <div className="rounded-3xl p-5 animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-6 w-20 rounded-xl" style={{ background: "rgba(99,140,255,0.08)" }} />
        <div className="h-4 w-16 rounded-lg" style={{ background: "rgba(99,140,255,0.05)" }} />
      </div>
      <div className="h-5 w-3/4 rounded-lg mb-2" style={{ background: "rgba(99,140,255,0.08)" }} />
      <div className="h-4 w-1/2 rounded-lg" style={{ background: "rgba(99,140,255,0.05)" }} />
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden flex flex-col h-full min-h-[500px] animate-pulse" style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}` }}>
      <div className="h-0.5 shrink-0" style={{ background: `linear-gradient(90deg,${T.accent}40,${T.violet}40,transparent)` }} />
      <div className="p-6 sm:p-7 border-b shrink-0" style={{ borderColor: T.border }}>
        <div className="h-6 w-24 rounded-xl mb-4" style={{ background: "rgba(99,140,255,0.08)" }} />
        <div className="h-8 w-3/4 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-4 w-1/3 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
      <div className="flex-1 p-6 sm:p-7 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
             <div className="w-9 h-9 rounded-2xl shrink-0" style={{ background: "rgba(99,140,255,0.08)" }} />
             <div className="flex-1 h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [initialTicketId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get("ticketId");
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [isLive, setIsLive] = useState(socket.connected);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<string | null>(null);
  const [updatedTicketIds, setUpdatedTicketIds] = useState<Set<string>>(new Set());

  const selectedTicket =
    tickets.find((ticket) => ticket._id === selectedId) ??
    (tickets.length > 0 ? tickets[0] : null);

  const { data: session } = useSession();

  const mergeTicketUpdate = (
    currentTicket: Ticket,
    updatedTicket: Ticket
  ): Ticket => ({
    ...currentTicket,
    ...updatedTicket,
    attachments:
      updatedTicket.attachments?.some((file) => file.url)
        ? updatedTicket.attachments
        : currentTicket.attachments,
  });

  const sortTickets = (items: Ticket[]) =>
    [...items].sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime()
    );

  const getTicketUserId = (ticket: Ticket) => {
    if (typeof ticket.user === "string") {
      return ticket.user;
    }

    return ticket.user?._id;
  };


  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/support/tickets");
      const data = await res.json();

      if (res.ok) {
        const nextTickets =
          data.tickets ?? [];

        setTickets(nextTickets);
        setSelectedId((current) =>
          current ??
          (
            nextTickets.some((ticket: Ticket) => ticket._id === initialTicketId)
              ? initialTicketId
              : nextTickets[0]?._id ?? null
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, [initialTicketId]);

  useEffect(() => {
    if (
      initialTicketId &&
      tickets.some((ticket) => ticket._id === initialTicketId)
    ) {
      setSelectedId(initialTicketId);
    }
  }, [initialTicketId, tickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!session?.user?.id) return;

    socket.emit(
      "join_channel",
      session.user.id
    );

    const handleConnect = () => {
      setIsLive(true);
      socket.emit(
        "join_channel",
        session.user.id
      );
    };

    const handleDisconnect = () => {
      setIsLive(false);
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      if (!updatedTicket?._id) return;

      const updatedTicketUserId =
        getTicketUserId(updatedTicket);

      setTickets(prev => {
        const exists = prev.some(t => t._id === updatedTicket._id);

        if (
          !exists &&
          updatedTicketUserId &&
          updatedTicketUserId !== session.user.id
        ) {
          return prev;
        }

        if (exists) {
          return sortTickets(
            prev.map((ticket) =>
              ticket._id === updatedTicket._id
                ? mergeTicketUpdate(
                  ticket,
                  updatedTicket
                )
                : ticket
            )
          );
        } else {
          return sortTickets([updatedTicket, ...prev]);
        }
      });

      setUpdatedTicketIds((current) => {
        const next = new Set(current);
        next.add(updatedTicket._id);
        return next;
      });

      setLastLiveUpdate(
        updatedTicket.status === "resolved"
          ? "Ticket resolved by support"
          : updatedTicket.adminFollowUps?.length
            ? "New support follow-up received"
            : "Ticket updated"
      );
    };

    socket.on(
      "connect",
      handleConnect
    );
    socket.on(
      "disconnect",
      handleDisconnect
    );
    socket.on("support_ticket_updated", handleTicketUpdated);
    
    return () => {
      socket.off(
        "connect",
        handleConnect
      );
      socket.off(
        "disconnect",
        handleDisconnect
      );
      socket.off("support_ticket_updated", handleTicketUpdated);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!selectedId) return;

    setUpdatedTicketIds((current) => {
      if (!current.has(selectedId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(selectedId);
      return next;
    });
  }, [selectedId]);

  useEffect(() => {
    if (selectedTicket?.hasUnreadAdminReply) {
      fetch(`/api/support/tickets/${selectedTicket._id}/mark-read`, { method: "POST" })
        .then(res => {
          if (res.ok) {
            setTickets(prev => prev.map(t => 
              t._id === selectedTicket._id ? { ...t, hasUnreadAdminReply: false } : t
            ));
          }
        })
        .catch(console.error);
    }
  }, [selectedTicket?._id, selectedTicket?.hasUnreadAdminReply]);

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

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === "open" || t.status === "in_progress").length,
      resolved: tickets.filter(t => t.status === "resolved").length,
    };
  }, [tickets]);

  return (
    <main className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(61,123,255,0.18); border-radius:4px; }
      `}</style>

      {/* ambient background matching dashboard */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -180, left: -140, width: 700, height: 700, borderRadius: "50%", background: "rgba(61,123,255,0.07)", filter: "blur(140px)" }} />
        <div style={{ position: "absolute", top: "40%", right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
        
        {/* ── HEADER HERO ── */}
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

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg,${T.accentLo},${T.violetLo})`, border: `2px solid ${T.accentMd}`, boxShadow: `0 0 0 4px ${T.accentLo}` }}>
                <LifeBuoy size={32} style={{ color: T.accent }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}`, letterSpacing: "0.04em" }}>
                    <Sparkles size={11} />
                    Support Center
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
                  Your Tickets
                </h1>
                <p className="text-sm mt-2 max-w-xl" style={{ color: T.muted }}>
                  Track support requests, view admin follow-ups, and reply with requested details.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold"
                style={{
                  background:
                    isLive ? T.emeraldLo : T.roseLo,
                  border:
                    `1px solid ${isLive ? T.emeraldMd : T.roseMd}`,
                  color:
                    isLive ? T.emerald : T.rose,
                }}
              >
                <span className="relative flex h-2 w-2">
                  {isLive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.emerald }} />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: isLive ? T.emerald : T.rose }} />
                </span>
                {isLive ? "Live" : "Reconnecting"}
              </div>
              <Link
                href="/support-center"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: T.violetLo, border: `1px solid ${T.violetMd}`, color: T.violet }}
              >
                <LifeBuoy size={14} />
                New Ticket
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
        </motion.div>

        {/* ── STATS ── */}
        <AnimatePresence>
          {lastLiveUpdate && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
              style={{ background: T.emeraldLo, border: `1px solid ${T.emeraldMd}`, color: T.emerald }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 size={15} />
                {lastLiveUpdate}
              </div>
              <button
                onClick={() => setLastLiveUpdate(null)}
                className="text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && tickets.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Tickets" value={stats.total} icon={Inbox} color={T.accent} lo={T.accentLo} md={T.accentMd} delay={0.05} />
              <StatCard label="Active" value={stats.open} icon={AlertTriangle} color={T.rose} lo={T.roseLo} md={T.roseMd} delay={0.10} />
              <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color={T.emerald} lo={T.emeraldLo} md={T.emeraldMd} delay={0.15} />
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid lg:grid-cols-[380px_1fr] gap-5">
            <div className="space-y-3">
              {[1, 2, 3].map(i => <TicketListSkeleton key={i} />)}
            </div>
            <div className="hidden lg:block h-[600px]">
               <TicketDetailSkeleton />
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center gap-5 py-28 rounded-3xl"
            style={{ background: T.surface, border: `1px dashed ${T.borderHi}`, backdropFilter: "blur(20px)" }}
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
            <Link
              href="/support-center"
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-semibold text-white mt-2 transition-all hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: "0 6px 24px rgba(61,123,255,0.35)", fontFamily: "'DM Sans',sans-serif" }}
            >
              <LifeBuoy size={15} /> Submit Request
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }} className="grid lg:grid-cols-[380px_1fr] gap-5">
            {/* Left Column: Ticket List */}
            <div className="space-y-3 h-full max-h-[800px] overflow-y-auto pr-1">
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
                    className="w-full text-left rounded-3xl p-5 transition-all group relative overflow-hidden flex flex-col"
                    style={{
                      background: active ? T.surfaceHi : T.surface,
                      border: `1px solid ${active ? cfg.md : T.border}`,
                      boxShadow: active ? `0 8px 30px ${cfg.lo}` : "none",
                      backdropFilter: "blur(20px)",
                      transform: active ? "scale(1)" : "scale(0.98)",
                    }}
                  >
                    {active && (
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: cfg.color }} />
                    )}
                    <div className="flex items-start justify-between gap-3 mb-3 w-full">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={ticket.status} />
                        {(ticket.hasUnreadAdminReply || updatedTicketIds.has(ticket._id)) && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.gold }}></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: T.gold }}></span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium" style={{ color: T.muted }}>
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-2 mb-2 transition-colors" style={{ fontFamily: "'Sora',sans-serif" }}>
                      {ticket.subject}
                    </h3>
                    <p className="text-sm line-clamp-2 leading-6" style={{ color: T.muted }}>
                      {ticket.message}
                    </p>
                    {(ticket.adminFollowUps?.length || ticket.userReplies?.length) ? (
                      <div className="flex items-center gap-2 mt-4 text-xs font-semibold" style={{ color: T.accent }}>
                        <MessageSquare size={12} />
                        {(ticket.adminFollowUps?.length ?? 0) + (ticket.userReplies?.length ?? 0)} follow-ups
                      </div>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>

            {/* Right Column: Ticket Details */}
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                {selectedTicket ? (
                  <motion.div
                    key={selectedTicket._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="rounded-3xl overflow-hidden flex flex-col max-h-[800px] h-full"
                    style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(28px)" }}
                  >
                    <div className="h-0.5 shrink-0" style={{ background: `linear-gradient(90deg,${T.accent},${T.violet},transparent)` }} />
                    <div className="p-6 sm:p-7 border-b shrink-0" style={{ borderColor: T.border }}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <StatusBadge status={selectedTicket.status} />
                          <h2 className="text-2xl font-black text-white mt-3" style={{ fontFamily: "'Sora',sans-serif" }}>
                            {selectedTicket.subject}
                          </h2>
                          <p className="text-sm mt-2 font-medium" style={{ color: T.muted }}>
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
                              className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs hover:opacity-80 transition-opacity"
                              style={{ background: T.accentLo, border: `1px solid ${T.accentMd}`, color: T.accent }}
                            >
                              <FileText size={13} />
                              <span className="max-w-[180px] truncate font-semibold">{file.filename}</span>
                              <span style={{ color: T.accent }}>{formatSize(file.size)}</span>
                              <ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-5 text-xs font-semibold" style={{ color: T.muted }}>
                          <Paperclip size={13} />
                          No attachments
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-4">
                      {timeline.length > 0 && (
                         <div className="space-y-4">
                           {timeline.map((item) => (
                             <TimelineItem
                               key={item.id}
                               label={item.label}
                               message={item.message}
                               date={item.date}
                               tone={item.tone}
                             />
                           ))}
                         </div>
                      )}

                      {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
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
                            rows={4}
                            placeholder="Write your reply..."
                            className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 transition-all"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.text, "--tw-ring-color": T.accentLo } as React.CSSProperties}
                          />

                          <div className="flex justify-end mt-3">
                            <button
                              onClick={handleSendReply}
                              disabled={sending || !reply.trim()}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 transition-all active:scale-95 hover:scale-105 disabled:hover:scale-100"
                              style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: "0 5px 20px rgba(61,123,255,0.28)" }}
                            >
                              {sending
                                ? <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                : <><SendHorizonal size={14} /> Send Reply</>}
                            </button>
                          </div>
                        </div>
                      )}
                      {(selectedTicket.status === "resolved" || selectedTicket.status === "closed") && (
                         <div className="mt-6 flex items-center justify-center gap-2 p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.1)", border: `1px solid ${T.emeraldMd}`, color: T.emerald }}>
                           <CheckCircle2 size={16} />
                           <span className="text-sm font-semibold">This ticket has been marked as {selectedTicket.status}. Replies are disabled.</span>
                         </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl flex flex-col items-center justify-center text-center p-10 h-full min-h-[500px]"
                    style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(28px)" }}
                  >
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                      <Inbox size={26} style={{ color: T.muted }} />
                    </div>
                    <p className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Sora',sans-serif" }}>No Ticket Selected</p>
                    <p className="text-sm" style={{ color: T.muted }}>Select a ticket from the left panel to view its details.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
