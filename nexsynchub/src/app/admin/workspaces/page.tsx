"use client";

import { useEffect, useState, useRef } from "react";
import {
  Building2, Users, Hash, CheckSquare,
  Search, X, ChevronUp, ChevronDown, Crown, ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── design tokens ──────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.70)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  cyan:     "#22D3EE",
  violet:   "#7C3AED",
  emerald:  "#10B981",
  gold:     "#F59E0B",
  rose:     "#FB7185",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

interface Workspace {
  _id: string;
  name: string;
  createdAt: string;
  members: number;
  channels: number;
  tasks: number;
  owner?: { username?: string; email?: string };
}

type SortKey = "name" | "members" | "channels" | "tasks" | "createdAt";

/* ─── workspace avatar ───────────────────────────────────────────────────── */
function WorkspaceIcon({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  // deterministic hue from name
  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0"
      style={{
        background: `hsla(${hue},65%,50%,0.15)`,
        border: `1px solid hsla(${hue},65%,50%,0.28)`,
        color: `hsl(${hue},70%,68%)`,
        fontFamily: "'Sora',sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

/* ─── stat chip ──────────────────────────────────────────────────────────── */
function StatChip({ icon: Icon, value, color, lo, md }: { icon: React.ElementType; value: number; color: string; lo: string; md: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
      style={{ background:lo, color, border:`1px solid ${md}` }}>
      <Icon size={10} />
      {value}
    </span>
  );
}

/* ─── skeleton row ───────────────────────────────────────────────────────── */
function SkeletonRow({ idx }: { idx: number }) {
  return (
    <motion.tr initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:idx*0.05 }}
      style={{ borderBottom:`1px solid ${T.border}` }}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl animate-pulse shrink-0" style={{ background:"rgba(99,140,255,0.07)" }} />
          <div className="h-3.5 w-32 rounded-lg animate-pulse" style={{ background:"rgba(99,140,255,0.07)" }} />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg animate-pulse shrink-0" style={{ background:"rgba(99,140,255,0.07)" }} />
          <div className="h-3.5 w-24 rounded-lg animate-pulse" style={{ background:"rgba(99,140,255,0.05)" }} />
        </div>
      </td>
      <td className="px-5 py-4"><div className="h-5 w-12 rounded-lg animate-pulse" style={{ background:"rgba(99,140,255,0.06)" }} /></td>
      <td className="px-5 py-4"><div className="h-5 w-12 rounded-lg animate-pulse" style={{ background:"rgba(99,140,255,0.06)" }} /></td>
      <td className="px-5 py-4"><div className="h-5 w-12 rounded-lg animate-pulse" style={{ background:"rgba(99,140,255,0.06)" }} /></td>
      <td className="px-5 py-4"><div className="h-4 w-20 rounded-lg animate-pulse" style={{ background:"rgba(99,140,255,0.05)" }} /></td>
    </motion.tr>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc]       = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isPaginating, setIsPaginating] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res  = await fetch("/api/admin/workspaces/list");
        const data = await res.json();
        if (res.ok) setWorkspaces(data.workspaces);
      } catch (error) {
        console.error("FETCH WORKSPACES ERROR:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(false); }
  };

  // Reset page when filtering/sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortKey, sortAsc, itemsPerPage]);

  const filtered = workspaces
    .filter(w => {
      const q = search.toLowerCase();
      return !q
        || w.name.toLowerCase().includes(q)
        || (w.owner?.username ?? "").toLowerCase().includes(q)
        || (w.owner?.email ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortKey === "name")      { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortKey === "members")  { va = a.members;  vb = b.members; }
      else if (sortKey === "channels") { va = a.channels; vb = b.channels; }
      else if (sortKey === "tasks")    { va = a.tasks;    vb = b.tasks; }
      else                             { va = a.createdAt; vb = b.createdAt; }
      if (typeof va === "number") return sortAsc ? va - (vb as number) : (vb as number) - va;
      return sortAsc ? (va as string).localeCompare(vb as string) : (vb as string).localeCompare(va as string);
    });

  // CSV Export Function
  const exportToCSV = () => {
    const headers = ["Workspace ID", "Name", "Owner Username", "Owner Email", "Members", "Channels", "Tasks", "Created Date"];
    const rows = filtered.map(w => {
      const escapeCSV = (str?: string) => `"${(str || "").replace(/"/g, '""')}"`;
      return [
        escapeCSV(w._id),
        escapeCSV(w.name),
        escapeCSV(w.owner?.username || "Unknown"),
        escapeCSV(w.owner?.email || "N/A"),
        w.members,
        w.channels,
        w.tasks,
        escapeCSV(new Date(w.createdAt).toISOString())
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `workspaces_export_${new Date().toISOString().split("T")[0]}.csv`);
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
          <title>Platform Workspaces Report - NexSyncHub</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; max-width: 1000px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .title-section h1 { color: #111827; font-size: 24px; margin: 0 0 8px 0; letter-spacing: -0.025em; }
            .meta { color: #6b7280; font-size: 0.875rem; }
            .brand { font-weight: 700; font-size: 1.25rem; color: #3B82F6; letter-spacing: -0.025em; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.875rem; }
            th, td { border: 1px solid #e5e7eb; padding: 12px 16px; text-align: left; vertical-align: top; }
            th { background-color: #f9fafb; font-weight: 600; color: #374151; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 0.75rem; color: #9ca3af; }
            @media print { body { padding: 0; } table { page-break-inside: auto; } tr { page-break-inside: avoid; page-break-after: auto; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-section">
              <h1>Platform Workspaces Report</h1>
              <div class="meta">Generated on ${date}</div>
            </div>
            <div class="brand">NexSyncHub</div>
          </div>
          <table>
            <thead><tr><th>Created Date</th><th>Workspace</th><th>Owner</th><th>Members</th><th>Channels</th><th>Tasks</th></tr></thead>
            <tbody>
              ${filtered.map(w => {
                const owner = w.owner?.username || w.owner?.email || "Unknown";
                return `<tr><td>${new Date(w.createdAt).toLocaleString()}</td><td>${w.name}</td><td>${owner}</td><td>${w.members}</td><td>${w.channels}</td><td>${w.tasks}</td></tr>`;
              }).join("")}
            </tbody>
          </table>
          <div class="footer">Confidential & Proprietary • NexSyncHub Admin Portal</div>
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
  const paginatedWorkspaces = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setIsPaginating(true);
    setCurrentPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setIsPaginating(false), 400); // Wait briefly for skeleton effect
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
              <Building2 size={28} style={{ color:T.accent }} className="animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping" style={{ background:T.accentLo, animationDuration:"2s" }} />
          </div>
          <p className="text-sm font-medium" style={{ color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>Loading workspaces…</p>
        </div>
      </div>
    );
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1" style={{ opacity: sortKey === col ? 1 : 0.3 }}>
      <ChevronUp  size={10} style={{ color: sortKey===col && sortAsc  ? T.accent : T.muted, marginBottom:-2 }} />
      <ChevronDown size={10} style={{ color: sortKey===col && !sortAsc ? T.accent : T.muted }} />
    </span>
  );

  /* ── totals ── */
  const totalMembers  = workspaces.reduce((s, w) => s + w.members,  0);
  const totalChannels = workspaces.reduce((s, w) => s + w.channels, 0);
  const totalTasks    = workspaces.reduce((s, w) => s + w.tasks,    0);

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
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
        <div style={{ position:"absolute", bottom:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(124,58,237,0.05)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20" ref={topRef}>

        {/* HEADER */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="mb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background:"linear-gradient(135deg,#3D7BFF,#7C3AED)", boxShadow:"0 4px 20px rgba(61,123,255,0.30)" }}>
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>Platform Workspaces</h1>
                <p className="text-sm" style={{ color:T.muted }}>Monitor and inspect all workspaces</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* export buttons */}
              <button onClick={exportToPDF} disabled={filtered.length === 0 || loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)", color:T.text }}>
                <Download size={14} />
                <span className="font-semibold hidden sm:block">Export PDF</span>
              </button>

              <button onClick={exportToCSV} disabled={filtered.length === 0 || loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)", color:T.text }}>
                <Download size={14} />
                <span className="font-semibold hidden sm:block">Export CSV</span>
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
                <span style={{ color:T.text, fontWeight:600 }}>{workspaces.length}</span>
                <span style={{ color:T.muted }}>workspaces</span>
              </div>
            </div>
          </div>

          {/* summary strip */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl" style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)" }}>
            {[
              { label:"Total Members",  value:totalMembers,  icon:Users,        color:T.accent,  lo:T.accentLo,                  md:T.accentMd },
              { label:"Total Channels", value:totalChannels, icon:Hash,         color:T.cyan,    lo:"rgba(34,211,238,0.10)",      md:"rgba(34,211,238,0.22)" },
              { label:"Total Tasks",    value:totalTasks,    icon:CheckSquare,  color:T.emerald, lo:"rgba(16,185,129,0.10)",      md:"rgba(16,185,129,0.22)" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:s.lo, border:`1px solid ${s.md}` }}>
                    <Icon size={14} style={{ color:s.color }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color:T.muted }}>{s.label}</p>
                    <p className="text-base font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>{s.value.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* SEARCH */}
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.45, ease:[0.22,1,0.36,1] }} className="mb-5">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:T.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by workspace name or owner…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{ background:T.surface, border:`1px solid ${search ? T.accentMd : T.border}`, color:T.text, backdropFilter:"blur(20px)", boxShadow:search ? `0 0 0 3px ${T.accentLo}` : "none", fontFamily:"'DM Sans',sans-serif" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg" style={{ background:"rgba(255,255,255,0.06)", color:T.muted }}>
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
                Showing <span style={{ color: T.text, fontWeight: 600 }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ color: T.text, fontWeight: 600 }}>{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span style={{ color: T.text, fontWeight: 600 }}>{filtered.length}</span> workspaces
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
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || isPaginating}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                  style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-sm font-semibold text-white">{currentPage}</span>
                  <span className="text-sm text-gray-500">/</span>
                  <span className="text-sm text-gray-500">{totalPages}</span>
                </div>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || isPaginating}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                  style={{ border: `1px solid ${T.borderHi}`, background: T.surface }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* TABLE CARD */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.5, ease:[0.22,1,0.36,1] }}
          className="rounded-3xl overflow-hidden"
          style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }}>

          <div className="h-0.5" style={{ background:`linear-gradient(90deg,${T.accent},${T.violet},transparent)` }} />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {[
                    { label:"Workspace", key:"name"      as SortKey },
                    { label:"Owner",     key:null },
                    { label:"Members",   key:"members"   as SortKey },
                    { label:"Channels",  key:"channels"  as SortKey },
                    { label:"Tasks",     key:"tasks"     as SortKey },
                    { label:"Created",   key:"createdAt" as SortKey },
                  ].map(col => (
                    <th key={col.label}
                      onClick={() => col.key && toggleSort(col.key as SortKey)}
                      className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest select-none"
                      style={{
                        color: col.key && sortKey===col.key ? T.accent : T.muted,
                        cursor: col.key ? "pointer" : "default",
                        background: "rgba(6,12,32,0.60)",
                        fontFamily: "'DM Sans',sans-serif",
                        letterSpacing: "0.07em",
                        whiteSpace: "nowrap",
                      }}>
                      <span className="inline-flex items-center gap-0.5">
                        {col.label}
                        {col.key && <SortIcon col={col.key as SortKey} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <AnimatePresence mode="popLayout">
                  {!loading && !isPaginating && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center gap-3 py-20 text-center">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                            <Building2 size={20} style={{ color:T.accent }} />
                          </div>
                          <p className="text-sm font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>No workspaces found</p>
                          <p className="text-xs" style={{ color:T.muted }}>Try adjusting your search.</p>
                        </div>
                      </td>
                    </tr>
                  ) : isPaginating ? (
                    Array.from({ length: paginatedWorkspaces.length || 1 }).map((_, idx) => (
                      <SkeletonRow key={`skel-${idx}`} idx={idx} />
                    ))
                  ) : (
                    paginatedWorkspaces.map((ws, idx) => {
                      const isLast = idx === paginatedWorkspaces.length - 1;
                      const hue    = ws.name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % 360;

                      return (
                        <motion.tr
                          key={ws._id}
                          layout
                          initial={{ opacity:0, y:8 }}
                          animate={{ opacity:1, y:0, transition:{ duration:0.32, ease:[0.22,1,0.36,1], delay: idx < 15 ? idx*0.03 : 0 } }}
                          exit={{ opacity:0, x:-16, transition:{ duration:0.18 } }}
                          className="group transition-colors duration-150"
                          style={{ borderBottom: isLast ? "none" : `1px solid ${T.border}` }}
                          onMouseEnter={e => (e.currentTarget.style.background="rgba(61,123,255,0.04)")}
                          onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                        >
                          {/* Workspace */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <WorkspaceIcon name={ws.name} />
                              <p className="text-sm font-semibold" style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }}>{ws.name}</p>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                                style={{ background:`hsla(${hue},65%,50%,0.12)`, border:`1px solid hsla(${hue},65%,50%,0.22)`, color:`hsl(${hue},70%,68%)`, fontFamily:"'Sora',sans-serif" }}>
                                {(ws.owner?.username?.[0] ?? "?").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color:T.text }}>{ws.owner?.username || "Unknown"}</p>
                                {ws.owner?.email && <p className="text-xs truncate" style={{ color:T.muted }}>{ws.owner.email}</p>}
                              </div>
                            </div>
                          </td>

                          {/* Members */}
                          <td className="px-5 py-4">
                            <StatChip icon={Users} value={ws.members} color={T.accent} lo={T.accentLo} md={T.accentMd} />
                          </td>

                          {/* Channels */}
                          <td className="px-5 py-4">
                            <StatChip icon={Hash} value={ws.channels} color={T.cyan} lo="rgba(34,211,238,0.10)" md="rgba(34,211,238,0.22)" />
                          </td>

                          {/* Tasks */}
                          <td className="px-5 py-4">
                            <StatChip icon={CheckSquare} value={ws.tasks} color={T.emerald} lo="rgba(16,185,129,0.10)" md="rgba(16,185,129,0.22)" />
                          </td>

                          {/* Created */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium" style={{ color:T.text }}>
                                {new Date(ws.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                              </span>
                              <span className="text-xs" style={{ color:T.muted }}>
                                {new Date(ws.createdAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
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
          {!loading && !isPaginating && filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop:`1px solid ${T.border}`, background:"rgba(6,12,32,0.40)" }}>
              <p className="text-xs" style={{ color:T.muted }}>
                Showing <span style={{ color:T.text, fontWeight:600 }}>{paginatedWorkspaces.length}</span> on this page out of <span style={{ color:T.text, fontWeight:600 }}>{filtered.length}</span> total workspaces
              </p>
              <div className="flex items-center gap-4 text-xs" style={{ color:T.muted }}>
                {[
                  { icon:Users,       val:totalMembers,  color:T.accent },
                  { icon:Hash,        val:totalChannels, color:T.cyan },
                  { icon:CheckSquare, val:totalTasks,    color:T.emerald },
                ].map(({ icon:Icon, val, color }, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Icon size={10} style={{ color }} />
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}