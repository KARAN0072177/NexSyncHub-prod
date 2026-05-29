// src/app/admin/moderation/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import {
  ShieldAlert, AlertTriangle,
  Search, X, RefreshCw, FileImage,
  Eye, User, Zap, Shield, ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg: "#03060F",
  surface: "rgba(8,16,40,0.70)",
  border: "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent: "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  rose: "#FF4D6D",
  roseLo: "rgba(255,77,109,0.10)",
  roseMd: "rgba(255,77,109,0.22)",
  amber: "#F97316",
  amberLo: "rgba(249,115,22,0.10)",
  amberMd: "rgba(249,115,22,0.22)",
  violet: "#7C3AED",
  emerald: "#10B981",
  text: "#E2E8F8",
  muted: "#4A5578",
};

interface ModerationLog {
  _id: string;
  action: string;
  signedEvidenceUrl?: string;
  createdAt: string;
  metadata?: {
    filename?: string;
    mimeType?: string;
    contentType?: string;
    size?: number;
    evidenceUrl?: string;
    evidenceKey?: string;
    moderationLabels?: { name: string; confidence: number; parentName?: string }[];
    workspaceName?: string;
    moderationReason?: string;
    aiTriggered?: boolean;
  };
  user?: { username?: string; email?: string; avatar?: string; role?: string };
}

const MODERATION_ACTIONS = [
  "unsafe_avatar_upload",
  "unsafe_workspace_name",
  "unsafe_workspace_avatar_upload",
  "unsafe_support_attachment",
  "unsafe_chat_attachment",
] as const;

function isModerationLog(value: unknown): value is ModerationLog {
  return (
    !!value &&
    typeof value === "object" &&
    "_id" in value &&
    "action" in value &&
    typeof (value as { _id?: unknown })._id === "string" &&
    typeof (value as { action?: unknown }).action === "string" &&
    MODERATION_ACTIONS.includes(
      (value as { action: string }).action as typeof MODERATION_ACTIONS[number]
    )
  );
}

function normalizeModerationLog(log: ModerationLog): ModerationLog {
  const metadata = log.metadata ?? {};
  const moderationLabels =
    metadata.moderationLabels?.map((label) => ({
      name: label.name,
      confidence: label.confidence ?? 0,
      parentName: label.parentName,
    })) ?? [];

  return {
    ...log,
    signedEvidenceUrl:
      log.signedEvidenceUrl ||
      metadata.evidenceUrl,
    metadata: {
      ...metadata,
      mimeType:
        metadata.mimeType ||
        metadata.contentType,
      moderationLabels,
    },
  };
}

function mergeUniqueLogs(
  incomingLogs: ModerationLog[],
  existingLogs: ModerationLog[] = []
) {
  const byId = new Map<string, ModerationLog>();

  [...incomingLogs, ...existingLogs].forEach((log) => {
    byId.set(
      log._id,
      normalizeModerationLog(log)
    );
  });

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );
}

/* ─── confidence → severity colour ──────────────────────────────────────── */
function severityColor(confidence: number) {
  if (confidence >= 90) return { color: T.rose, lo: T.roseLo, md: T.roseMd, label: "Critical" };
  if (confidence >= 70) return { color: T.amber, lo: T.amberLo, md: T.amberMd, label: "High" };
  return { color: "#EAB308", lo: "rgba(234,179,8,0.10)", md: "rgba(234,179,8,0.22)", label: "Medium" };
}

/* ─── format file size ───────────────────────────────────────────────────── */
function fmtSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ─── avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ user }: { user?: ModerationLog["user"] }) {
  const letter = (user?.username?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  return user?.avatar ? (
    <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-2xl object-cover shrink-0"
      style={{ border: `1px solid ${T.roseMd}` }} />
  ) : (
    <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: T.roseLo, border: `1px solid ${T.roseMd}`, color: T.rose, fontFamily: "'Sora',sans-serif" }}>
      {letter}
    </div>
  );
}

/* ─── label pill ──────────────────────────────────────────────────────────── */
function LabelPill({ label }: { label: { name: string; confidence: number } }) {
  const sev = severityColor(label.confidence);
  const pct = Math.round(label.confidence);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-1.5 px-3.5 py-3 rounded-2xl min-w-[120px]"
      style={{ background: sev.lo, border: `1px solid ${sev.md}` }}
    >
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={11} style={{ color: sev.color }} />
        <span className="text-xs font-bold uppercase" style={{ color: sev.color, letterSpacing: "0.05em" }}>
          {sev.label}
        </span>
      </div>
      <p className="text-sm font-semibold text-white leading-tight" style={{ fontFamily: "'DM Sans',sans-serif" }}>
        {label.name}
      </p>
      {/* confidence bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg,${sev.color},${sev.color}99)` }}
        />
      </div>
      <p className="text-xs font-bold tabular-nums" style={{ color: sev.color }}>{pct}% confidence</p>
    </motion.div>
  );
}

/* ─── skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard({ idx }: { idx: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 } }}
      exit={{ opacity: 0, x: 20, scale: 0.97, transition: { duration: 0.2 } }}
      className="relative flex items-start gap-4 group"
    >
      <div className="relative z-10 shrink-0 mt-0.5">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: "rgba(255,77,109,0.08)", border: `1px solid ${T.roseMd}` }} />
      </div>
      <div className="flex-1 rounded-3xl p-5 space-y-4 animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl" style={{ background: "rgba(255,77,109,0.08)" }} />
          <div className="space-y-2">
            <div className="h-3.5 w-36 rounded-lg" style={{ background: "rgba(255,77,109,0.08)" }} />
            <div className="h-3 w-24 rounded-lg" style={{ background: "rgba(255,77,109,0.05)" }} />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 w-28 rounded-2xl" style={{ background: "rgba(255,77,109,0.06)" }} />)}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function ModerationPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [liveCount, setLiveCount] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginating, setIsPaginating] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/security/moderation");
        const data = await res.json();
        if (res.ok) {
          setLogs(
            mergeUniqueLogs(
              Array.isArray(data.logs)
                ? data.logs.filter(isModerationLog)
                : []
            )
          );
        }
      } catch (err) { console.error("MODERATION FETCH ERROR:", err); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    socket.emit("join_admin_global");

    const handleModerationLog = (newLog: unknown) => {
      if (!isModerationLog(newLog)) return;

      setLogs((prev) => {
        const exists = prev.some(
          (log) => log._id === newLog._id
        );

        if (exists) {
          return mergeUniqueLogs(
            [newLog],
            prev
          );
        }

        setLiveCount((c) => c + 1);

        return mergeUniqueLogs(
          [newLog],
          prev
        );
      });

      setCurrentPage(1);
    };

    socket.on(
      "admin_security_log_created",
      handleModerationLog
    );

    return () => {
      socket.off(
        "admin_security_log_created",
        handleModerationLog
      );
    };
  }, []);

  // Reset page when filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return !q
      || (l.user?.username ?? "").toLowerCase().includes(q)
      || (l.user?.email ?? "").toLowerCase().includes(q)
      || (
        l.metadata?.filename
        ?? ""
      ).toLowerCase().includes(q)

      || (
        l.metadata?.workspaceName
        ?? ""
      ).toLowerCase().includes(q)
  });

  // CSV Export Function
  const exportToCSV = () => {
    const headers = ["Log ID", "Action", "User", "Email", "Filename", "MIME Type", "Size", "Detected Labels", "Date"];
    const rows = filtered.map(l => {
      const escapeCSV = (str?: string) => `"${(str || "").replace(/"/g, '""')}"`;
      const labelsStr = (l.metadata?.moderationLabels || []).map(lb => `${lb.name} (${Math.round(lb.confidence)}%)`).join(" | ");

      return [
        escapeCSV(l._id),
        escapeCSV(l.action),
        escapeCSV(l.user?.username || "Unknown"),
        escapeCSV(l.user?.email || "N/A"),
        escapeCSV(l.metadata?.filename
          ||
          l.metadata?.workspaceName
          ||
          "Unknown"),
        escapeCSV(l.metadata?.mimeType || "N/A"),
        escapeCSV(fmtSize(l.metadata?.size)),
        escapeCSV(labelsStr || "None"),
        escapeCSV(new Date(l.createdAt).toISOString())
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `moderation_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print / PDF Export Function
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Moderation Logs Report - NexSyncHub</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; padding: 40px; line-height: 1.6; max-width: 1000px; margin: 0 auto; }
            h1 { color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 8px; }
            .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 32px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.875rem; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: 600; }
            .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-right: 4px; }
            .tag-Critical { background: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }
            .tag-High { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
            .tag-Medium { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            @media print { body { padding: 0; } table { page-break-inside: auto; } tr { page-break-inside: avoid; page-break-after: auto; } }
          </style>
        </head>
        <body>
          <h1>Moderation Logs Report</h1>
          <div class="meta">Generated on ${date} • NexSyncHub Platform</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>User</th>
                <th>File Info</th>
                <th>Detected Labels</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(l => {
      const name = l.user?.username || l.user?.email || "Unknown User";
      const fileInfo =

        l.metadata?.workspaceName

        ||

        (
          l.metadata?.filename

            ? `${l.metadata.filename} (${fmtSize(l.metadata.size)})`

            : "—"
        );
      const labelsHtml = (l.metadata?.moderationLabels || []).map(lb => {
        const sev = severityColor(lb.confidence);
        return `<span class="tag tag-${sev.label}">${lb.name} (${Math.round(lb.confidence)}%)</span>`;
      }).join("");

      return `
                  <tr>
                    <td>${new Date(l.createdAt).toLocaleString()}</td>
                    <td>${l.action}</td>
                    <td>${name}</td>
                    <td>${fileInfo}</td>
                    <td>${labelsHtml || "None"}</td>
                  </tr>
                `;
    }).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLogs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setIsPaginating(true);
    setCurrentPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setIsPaginating(false), 400); // Wait briefly for skeleton effect
  };

  /* top-label stats */
  const allLabels = logs.flatMap(l => l.metadata?.moderationLabels ?? []);
  const critCount = allLabels.filter(lb => lb.confidence >= 90).length;
  const highCount = allLabels.filter(lb => lb.confidence >= 70 && lb.confidence < 90).length;
  const totalBlocked = logs.length;

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: T.roseLo, border: `1px solid ${T.roseMd}` }}>
              <ShieldAlert size={28} style={{ color: T.rose }} className="animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping" style={{ background: T.roseLo, animationDuration: "2s" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Loading moderation logs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,77,109,0.20); border-radius:4px; }
      `}</style>

      {/* ambient — rose-tinted for danger feel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -180, left: -140, width: 640, height: 640, borderRadius: "50%", background: "rgba(61,123,255,0.06)", filter: "blur(130px)" }} />
        <div style={{ position: "absolute", top: 100, right: -100, width: 520, height: 520, borderRadius: "50%", background: "rgba(255,77,109,0.06)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -80, left: "35%", width: 400, height: 400, borderRadius: "50%", background: "rgba(249,115,22,0.04)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20" ref={topRef}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#FF4D6D,#F97316)", boxShadow: "0 4px 20px rgba(255,77,109,0.35)" }}>
                <ShieldAlert size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
                  Moderation Center
                </h1>
                <p className="text-sm" style={{ color: T.muted }}>
                  Realtime trust &amp; safety monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* export buttons */}
              <button onClick={exportToPDF} disabled={filtered.length === 0 || loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)", color: T.text }}>
                <Download size={14} />
                <span className="font-semibold hidden sm:block">Export PDF</span>
              </button>

              <button onClick={exportToCSV} disabled={filtered.length === 0 || loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)", color: T.text }}>
                <Download size={14} />
                <span className="font-semibold hidden sm:block">Export CSV</span>
              </button>

              {/* live pill */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl"
                style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.rose }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.rose }} />
                </span>
                <span className="text-sm font-semibold" style={{ color: T.text }}>Live</span>
                {liveCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg text-xs font-bold" style={{ background: T.roseLo, color: T.rose }}>
                    +{liveCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── stat strip ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Blocked Uploads", value: totalBlocked, color: T.rose, lo: T.roseLo, md: T.roseMd, icon: ShieldAlert },
              { label: "Critical Detections", value: critCount, color: T.rose, lo: T.roseLo, md: T.roseMd, icon: AlertTriangle },
              { label: "High Severity", value: highCount, color: T.amber, lo: T.amberLo, md: T.amberMd, icon: Zap },
            ].map(({ label, value, color, lo, md, icon: Icon }, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: lo, border: `1px solid ${md}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>{value}</p>
                  <p className="text-xs" style={{ color, fontFamily: "'DM Sans',sans-serif" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── SEARCH ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mb-6">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by user, email, filename or workspace name…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{ background: T.surface, border: `1px solid ${search ? T.roseMd : T.border}`, color: T.text, backdropFilter: "blur(20px)", boxShadow: search ? `0 0 0 3px ${T.roseLo}` : "none", fontFamily: "'DM Sans',sans-serif" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: T.muted }}>
                <X size={12} />
              </button>
            )}
          </div>
        </motion.div>

        {/* PAGINATION (TOP) */}
        {!loading && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
            <div className="flex items-center gap-3">
              <p className="text-sm" style={{ color: T.muted }}>
                Showing <span style={{ color: T.text, fontWeight: 600 }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ color: T.text, fontWeight: 600 }}>{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span style={{ color: T.text, fontWeight: 600 }}>{filtered.length}</span> events
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="text-sm rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text }}
              >
                <option value={5} style={{ background: T.bg }}>5 per page</option>
                <option value={10} style={{ background: T.bg }}>10 per page</option>
                <option value={50} style={{ background: T.bg }}>50 per page</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || isPaginating} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5" style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-sm font-semibold text-white">{currentPage}</span>
                  <span className="text-sm text-gray-500">/</span>
                  <span className="text-sm text-gray-500">{totalPages}</span>
                </div>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || isPaginating} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5" style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── EMPTY ── */}
        {!loading && !isPaginating && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24 text-center rounded-3xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.roseLo, border: `1px solid ${T.roseMd}` }}>
              <Shield size={22} style={{ color: T.rose }} />
            </div>
            <p className="text-base font-semibold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>All clear</p>
            <p
              className="text-sm"
              style={{
                color: T.muted,
              }}
            >

              No moderation events recorded.
              Unsafe uploads and blocked workspace names will appear here.

            </p>
          </motion.div>
        )}

        {/* ── FEED ── */}
        <div className="relative">
          {/* timeline line */}
          {filtered.length > 0 && (
            <div className="absolute left-[21px] top-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg,${T.rose},${T.amber},transparent)`, opacity: 0.22 }} />
          )}

          <div className="space-y-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {(loading || isPaginating) ? (
                Array.from({ length: paginatedLogs.length || 1 }).map((_, idx) => (
                  <SkeletonCard key={`skel-${idx}`} idx={idx} />
                ))
              ) : paginatedLogs.map((log, idx) => {
                const isExpanded = expanded.has(log._id);
                const labels = log.metadata?.moderationLabels ?? [];
                const topLabel = labels[0];
                const topSev = topLabel ? severityColor(topLabel.confidence) : null;
                const name = log.user?.username || log.user?.email || "Unknown User";
                const previewLabels = isExpanded ? labels : labels.slice(0, 3);
                const evidenceUrl =
                  log.signedEvidenceUrl ||
                  log.metadata?.evidenceUrl;

                return (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: idx < 15 ? idx * 0.03 : 0 } }}
                    exit={{ opacity: 0, x: 20, scale: 0.97, transition: { duration: 0.2 } }}
                    className="relative flex items-start gap-4"
                  >
                    {/* dot */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: T.roseLo, border: `1px solid ${T.roseMd}`, boxShadow: `0 0 0 3px ${T.bg}` }}>
                        <ShieldAlert size={16} style={{ color: T.rose }} />
                      </div>
                    </div>

                    {/* card */}
                    <div className="flex-1 rounded-3xl overflow-hidden transition-all duration-200"
                      style={{ background: T.surface, border: `1px solid rgba(255,77,109,0.18)`, backdropFilter: "blur(20px)" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = `1px solid ${T.roseMd}`; el.style.boxShadow = `0 6px 32px ${T.roseLo}`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = `1px solid rgba(255,77,109,0.18)`; el.style.boxShadow = "none"; }}
                    >
                      {/* red top accent bar */}
                      <div className="h-0.5" style={{ background: "linear-gradient(90deg,#FF4D6D,#F97316,transparent)" }} />

                      <div className="p-5 sm:p-6">
                        {/* ── TOP ROW ── */}
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar user={log.user} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color: T.text, fontFamily: "'DM Sans',sans-serif" }}>{name}</span>
                                {log.user?.role && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg uppercase" style={{ background: T.accentLo, color: T.accent, letterSpacing: "0.06em" }}>
                                    {log.user.role}
                                  </span>
                                )}
                              </div>
                              {log.user?.email && log.user.email !== name && (
                                <p className="text-xs mt-0.5" style={{ color: T.muted }}>{log.user.email}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {topSev && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase"
                                style={{ background: topSev.lo, color: topSev.color, border: `1px solid ${topSev.md}`, letterSpacing: "0.07em" }}>
                                {topSev.label} RISK
                              </span>
                            )}
                            <span className="text-xs flex items-center gap-1" style={{ color: T.muted }}>
                              <RefreshCw size={9} />
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* ── TITLE ── */}
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle size={14} style={{ color: T.rose }} />
                          <p className="text-sm font-semibold" style={{ color: "#FFCDD5", fontFamily: "'DM Sans',sans-serif" }}>
                            {
                              log.action ===
                                "unsafe_workspace_name"

                                ? "Unsafe workspace name blocked"

                                : log.action ===
                                  "unsafe_workspace_avatar_upload"

                                  ? "Unsafe workspace avatar blocked"

                                  : log.action ===
                                    "unsafe_support_attachment"

                                    ? "Unsafe support attachment blocked"

                                    : log.action ===
                                      "unsafe_chat_attachment"

                                      ? "Unsafe chat attachment blocked"

                                      : "Unsafe profile avatar blocked"
                            }
                          </p>
                        </div>

                        {/* Workspace moderation */}
                        {
                          log.action ===
                          "unsafe_workspace_name"

                          &&

                          log.metadata
                            ?.workspaceName && (

                            <div
                              className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
                              style={{

                                background:
                                  "rgba(255,255,255,0.03)",

                                border:
                                  `1px solid ${T.border}`,

                              }}
                            >

                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{

                                  background:
                                    T.roseLo,

                                  border:
                                    `1px solid ${T.roseMd}`,

                                }}
                              >

                                <ShieldAlert
                                  size={14}
                                  style={{
                                    color: T.rose,
                                  }}
                                />

                              </div>

                              <div>

                                <p
                                  className="text-sm font-medium"
                                  style={{
                                    color: T.text,
                                  }}
                                >

                                  {
                                    log.metadata
                                      .workspaceName
                                  }

                                </p>

                                <p
                                  className="text-xs"
                                  style={{
                                    color: T.muted,
                                  }}
                                >

                                  AI moderation blocked unsafe workspace name

                                </p>

                              </div>

                            </div>

                          )}

                        {/* ── FILE INFO ── */}
                        {(log.metadata?.filename || log.metadata?.mimeType || log.metadata?.size) && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                            {evidenceUrl ? (
                              <div
                                className="w-12 h-12 rounded-2xl overflow-hidden shrink-0"
                                style={{ border: `1px solid ${T.roseMd}` }}
                              >
                                <img
                                  src={evidenceUrl}
                                  alt=""
                                  className="w-full h-full object-cover blur-[8px] scale-110"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: T.roseLo, border: `1px solid ${T.roseMd}` }}>
                                <FileImage size={14} style={{ color: T.rose }} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: T.text }}>
                                {log.metadata?.filename ?? "Unknown file"}
                              </p>
                              <p className="text-xs" style={{ color: T.muted }}>
                                {log.metadata?.mimeType ?? "—"}
                                {log.metadata?.size ? ` · ${fmtSize(log.metadata.size)}` : ""}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ── DETECTED LABELS ── */}
                        {labels.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Eye size={13} style={{ color: T.rose }} />
                                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.rose, letterSpacing: "0.07em" }}>
                                  Detected Labels
                                </p>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg" style={{ background: T.roseLo, color: T.rose }}>
                                  {labels.length}
                                </span>
                              </div>
                              {labels.length > 3 && (
                                <button onClick={() => toggleExpand(log._id)}
                                  className="text-xs font-semibold flex items-center gap-1 transition-colors"
                                  style={{ color: T.accent, fontFamily: "'DM Sans',sans-serif" }}>
                                  {isExpanded ? "Show less" : `+${labels.length - 3} more`}
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <AnimatePresence>
                                {previewLabels.map((label, i) => (
                                  <LabelPill key={`${log._id}-${i}`} label={label} />
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {/* ── FOOTER ── */}
                        <div className="flex items-center justify-between mt-4 pt-4 flex-wrap gap-2"
                          style={{ borderTop: `1px solid ${T.border}` }}>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: T.muted }}>
                            <User size={10} />
                            <span>{log.user?.email ?? "—"}</span>
                          </div>
                          <div className="text-xs" style={{ color: T.muted }}>
                            {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* footer */}
        {!loading && !isPaginating && filtered.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-center text-xs mt-10" style={{ color: T.muted }}>
            Showing <span style={{ color: T.text, fontWeight: 600 }}>{paginatedLogs.length}</span> on this page out of{" "}
            <span style={{ color: T.text, fontWeight: 600 }}>{filtered.length}</span> total filtered events · Updates in real time
          </motion.p>
        )}
      </div>
    </div>
  );
}
