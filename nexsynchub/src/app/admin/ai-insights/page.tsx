"use client";

import { useEffect, useState, useRef } from "react";
import { Brain, Sparkles, Loader2, RefreshCcw, Zap, TrendingUp, AlertTriangle, CheckCircle, Info, ChevronRight, ChevronLeft, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
    bg: "#03060F",
    surface: "rgba(8,16,40,0.70)",
    border: "rgba(99,140,255,0.10)",
    borderHi: "rgba(99,140,255,0.22)",
    accent: "#3D7BFF",
    accentLo: "rgba(61,123,255,0.12)",
    accentMd: "rgba(61,123,255,0.25)",
    violet: "#7C3AED",
    violetLo: "rgba(124,58,237,0.12)",
    violetMd: "rgba(124,58,237,0.25)",
    cyan: "#22D3EE",
    cyanLo: "rgba(34,211,238,0.10)",
    cyanMd: "rgba(34,211,238,0.22)",
    emerald: "#10B981",
    emeraldLo: "rgba(16,185,129,0.10)",
    emeraldMd: "rgba(16,185,129,0.22)",
    amber: "#F59E0B",
    amberLo: "rgba(245,158,11,0.10)",
    amberMd: "rgba(245,158,11,0.22)",
    rose: "#FF4D6D",
    roseLo: "rgba(255,77,109,0.10)",
    text: "#E2E8F8",
    muted: "#4A5578",
};

interface InsightsResponse { success: boolean; insights: string; }

/* ─── classify a line → visual theme ────────────────────────────────────── */
function classifyLine(line: string): {
    icon: React.ElementType; color: string; lo: string; md: string;
    gradient: string; tag: string;
} {
    const l = line.toLowerCase();

    // warning / risk signals
    if (/warn|risk|concern|alert|unsafe|danger|drop|declin|decreas|fell|low|poor|below/.test(l))
        return { icon: AlertTriangle, color: T.amber, lo: T.amberLo, md: T.amberMd, gradient: `linear-gradient(135deg,${T.amber},#D97706)`, tag: "Warning" };

    // positive / growth
    if (/grow|increas|improv|high|strong|active|engag|success|top|best|great|well|positive/.test(l))
        return { icon: TrendingUp, color: T.emerald, lo: T.emeraldLo, md: T.emeraldMd, gradient: `linear-gradient(135deg,${T.emerald},#059669)`, tag: "Positive" };

    // action / recommendation
    if (/recommend|suggest|consider|should|could|action|implement|focus|priorit|opportunit/.test(l))
        return { icon: Zap, color: T.violet, lo: T.violetLo, md: T.violetMd, gradient: `linear-gradient(135deg,${T.violet},#6D28D9)`, tag: "Action" };

    // general stat / data
    if (/total|count|number|percent|ratio|rate|average|median|stat|metric/.test(l))
        return { icon: CheckCircle, color: T.cyan, lo: T.cyanLo, md: T.cyanMd, gradient: `linear-gradient(135deg,${T.cyan},#0891B2)`, tag: "Metric" };

    // default → AI insight
    return { icon: Sparkles, color: T.accent, lo: T.accentLo, md: T.accentMd, gradient: `linear-gradient(135deg,${T.accent},${T.violet})`, tag: "Insight" };
}

/* ─── strip leading bullet / number ─────────────────────────────────────── */
function cleanLine(line: string): string {
    return line.replace(/^(\d+\.|-|•)\s+/, "").trim();
}

/* ─── skeleton ───────────────────────────────────────────────────────────── */
function SkeletonCard({ idx }: { idx: number }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 } }}
            exit={{ opacity: 0, x: 20, scale: 0.97, transition: { duration: 0.2 } }}
            className="rounded-3xl p-6 flex items-center gap-5 w-full animate-pulse"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            <div className="w-11 h-11 rounded-2xl shrink-0" style={{ background: "rgba(99,140,255,0.08)" }} />
            <div className="flex-1 space-y-2.5">
                <div className="h-3 rounded-full" style={{ background: "rgba(99,140,255,0.09)", width: `${60 + (idx * 7) % 35}%` }} />
                <div className="h-3 rounded-full" style={{ background: "rgba(99,140,255,0.06)", width: `${40 + (idx * 11) % 40}%` }} />
            </div>
        </motion.div>
    );
}

/* ─── insight card ───────────────────────────────────────────────────────── */
function InsightCard({ item, index }: { item: { line: string; clean: string; cfg: ReturnType<typeof classifyLine> }; index: number }) {
    const [hov, setHov] = useState(false);
    const cfg = item.cfg;
    const Icon = cfg.icon;
    const clean = item.clean;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97, transition: { duration: 0.2 } }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: index < 15 ? index * 0.04 : 0 }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            className="relative overflow-hidden rounded-3xl transition-all duration-300"
            style={{
                background: T.surface,
                border: `1px solid ${hov ? cfg.md : T.border}`,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: hov ? `0 8px 36px ${cfg.lo}, 0 0 0 1px ${cfg.md}` : "none",
                transform: hov ? "translateY(-2px)" : "none",
            }}
        >
            {/* top accent bar */}
            <div className="h-0.5 transition-opacity duration-300" style={{ background: cfg.gradient, opacity: hov ? 1 : 0.4 }} />

            {/* glow blob */}
            <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: cfg.lo, filter: "blur(50px)", opacity: hov ? 1 : 0.5, transition: "opacity 0.4s", pointerEvents: "none", zIndex: 0 }} />

            <div className="relative z-10 flex items-start gap-5 p-5 sm:p-6">
                {/* icon */}
                <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{
                        background: hov ? cfg.gradient : cfg.lo,
                        border: `1px solid ${cfg.md}`,
                        boxShadow: hov ? `0 4px 16px ${cfg.lo}` : "none",
                    }}
                >
                    <Icon size={18} style={{ color: hov ? "#fff" : cfg.color }} />
                </div>

                {/* text */}
                <div className="flex-1 min-w-0 pt-0.5">
                    {/* tag */}
                    <div className="flex items-center gap-2 mb-2.5">
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase"
                            style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}`, letterSpacing: "0.07em" }}
                        >
                            {cfg.tag}
                        </span>
                        <span className="text-xs" style={{ color: T.muted }}>#{String(index + 1).padStart(2, "0")}</span>
                    </div>

                    <div 
                        className="prose prose-sm prose-invert max-w-none break-words leading-relaxed prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-white prose-strong:font-semibold" 
                        style={{ color: "rgba(232,230,240,0.85)" }}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {clean}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* chevron */}
                <ChevronRight size={14} className="shrink-0 mt-1 transition-all duration-200"
                    style={{ color: hov ? cfg.color : T.muted, transform: hov ? "translateX(2px)" : "none" }} />
            </div>
        </motion.div>
    );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AIInsightsPage() {
    const [insights, setInsights] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const FILTERS = ["All", "Warning", "Positive", "Action", "Metric", "Insight"] as const;
    const [filter, setFilter] = useState<string>("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isPaginating, setIsPaginating] = useState(false);
    const topRef = useRef<HTMLDivElement>(null);

    const fetchInsights = async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const res = await fetch(
                `/api/admin/ai-insights?refresh=${isRefresh}`
            );
            const data: InsightsResponse = await res.json();
            if (res.ok) {
                setInsights(data.insights);
                setCurrentPage(1);
            }
        } catch (err) { console.error("AI INSIGHTS FETCH ERROR:", err); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchInsights(); }, []);

    // Reset page when filtering changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, itemsPerPage]);

    // Split by double newline to support multi-line markdown blocks per card
    const allInsights = insights.split(/(?:\r?\n){2,}/).map(l => l.trim()).filter(Boolean).map(line => {
        return {
            line,
            clean: cleanLine(line),
            cfg: classifyLine(line)
        };
    });

    const filtered = allInsights.filter(item => filter === "All" || item.cfg.tag === filter);

    /* ── tag distribution for header summary ── */
    const tagCounts = allInsights.reduce<Record<string, number>>((acc, item) => {
        const tag = item.cfg.tag;
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
    }, {});

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedLogs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages || p === currentPage) return;
        setIsPaginating(true);
        setCurrentPage(p);
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => setIsPaginating(false), 400); // Wait briefly for skeleton effect
    };

    // Print / PDF Export Function
    const exportToPDF = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

        // Very basic markdown parsing for the print view
        const formatMD = (text: string) => {
            return text
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/`(.*?)`/g, "<code style='background:#f3f4f6;padding:2px 4px;border-radius:4px;'>$1</code>");
        };

        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Insights Report - NexSyncHub</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 8px; }
            .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 32px; }
            .insight { margin-bottom: 20px; padding: 16px 20px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; background: #fff; }
            .tag { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
            .tag-Warning { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .tag-Positive { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
            .tag-Action { background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; }
            .tag-Metric { background: #cffafe; color: #0891b2; border: 1px solid #a5f3fc; }
            .tag-Insight { background: #dbeafe; color: #2563eb; border: 1px solid #bfdbfe; }
            .content { font-size: 0.95rem; }
            @media print { body { padding: 0; } .insight { box-shadow: none; border: 1px solid #d1d5db; } }
          </style>
        </head>
        <body>
          <h1>AI Operations Report</h1>
          <div class="meta">Generated on ${date} • NexSyncHub Platform</div>
          ${filtered.map(item => `
            <div class="insight">
              <span class="tag tag-${item.cfg.tag}">${item.cfg.tag}</span>
              <div class="content">${formatMD(item.clean)}</div>
            </div>
          `).join("")}
        </body>
      </html>
    `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 250);
    };

    /* ── loading screen ── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>
                <div className="flex flex-col items-center gap-6">
                    {/* animated brain */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg,${T.accentLo},${T.violetLo})`, border: `1px solid ${T.accentMd}` }}>
                            <Brain size={36} style={{ color: T.accent }} className="animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-3xl animate-ping" style={{ background: T.accentLo, animationDuration: "2.5s" }} />
                        {/* orbiting dot */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0"
                            style={{ transformOrigin: "50% 50%" }}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                                style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: `0 0 8px ${T.accent}` }} />
                        </motion.div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <p className="text-base font-semibold text-white" style={{ fontFamily: "'Sora',sans-serif" }}>Generating AI Insights</p>
                        <p className="text-sm" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Analyzing platform data…</p>
                    </div>
                    {/* shimmer dots */}
                    <div className="flex items-center gap-2">
                        {[0, 1, 2].map(i => (
                            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                                className="w-2 h-2 rounded-full" style={{ background: T.accent }} />
                        ))}
                    </div>
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
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

            {/* ambient — richer on this page: blue + violet + cyan */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
                <div style={{ position: "absolute", top: -200, left: -150, width: 700, height: 700, borderRadius: "50%", background: "rgba(61,123,255,0.09)", filter: "blur(140px)" }} />
                <div style={{ position: "absolute", top: 100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.08)", filter: "blur(120px)" }} />
                <div style={{ position: "absolute", bottom: -60, left: "30%", width: 450, height: 450, borderRadius: "50%", background: "rgba(34,211,238,0.05)", filter: "blur(110px)" }} />
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20" ref={topRef}>

                {/* ── HEADER ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                        <div className="flex items-center gap-4">
                            {/* animated icon */}
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: `linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow: `0 4px 24px rgba(61,123,255,0.40)` }}>
                                    <Brain size={22} className="text-white" />
                                </div>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0" style={{ transformOrigin: "50% 50%" }}>
                                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                                        style={{ background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />
                                </motion.div>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
                                    AI Insights
                                </h1>
                                <p className="text-sm" style={{ color: T.muted }}>Operational intelligence powered by AI</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* export button */}
                            <button
                                onClick={exportToPDF}
                                disabled={loading || refreshing || filtered.length === 0}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: T.surface, border: `1px solid ${T.borderHi}`, color: T.text, backdropFilter: "blur(20px)" }}
                            >
                                <Download size={14} />
                                <span className="hidden sm:block">Export PDF</span>
                            </button>

                            {/* refresh button */}
                            <button
                                onClick={() => fetchInsights(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-60"
                                style={{
                                    background: refreshing ? T.accentLo : `linear-gradient(135deg,${T.accent},${T.violet})`,
                                    border: refreshing ? `1px solid ${T.accentMd}` : "none",
                                    boxShadow: refreshing ? "none" : "0 4px 20px rgba(61,123,255,0.35)",
                                    color: refreshing ? T.accent : "#fff",
                                    fontFamily: "'DM Sans',sans-serif",
                                }}
                            >
                                {refreshing
                                    ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                                    : <><RefreshCcw size={14} /> Refresh Insights</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* ── insight summary strip ── */}
                    {!loading && allInsights.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}
                            className="flex items-center gap-3 flex-wrap p-4 rounded-2xl"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
                            <div className="flex items-center gap-2 mr-2">
                                <Sparkles size={13} style={{ color: T.accent }} />
                                <span className="text-xs font-semibold" style={{ color: T.muted }}>
                                    {allInsights.length} insights generated
                                </span>
                            </div>
                            <div className="w-px h-4" style={{ background: T.border }} />
                            {Object.entries(tagCounts).map(([tag, count]) => {
                                const cfg = classifyLine(tag);
                                return (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
                                        style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.md}` }}>
                                        {count} {tag}
                                    </span>
                                );
                            })}
                        </motion.div>
                    )}
                </motion.div>

                {/* ── CONTROLS ── */}
                {!loading && allInsights.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row gap-3 mb-6">
                        {/* filter tabs */}
                        <div className="flex items-center gap-1 p-1 rounded-2xl flex-wrap" style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
                            {FILTERS.map(f => {
                                const isActive = filter === f;
                                const fcfg = f !== "All" ? classifyLine(f) : { color: T.text, lo: "rgba(255,255,255,0.06)", md: "transparent", tag: "All" };
                                return (
                                    <button key={f} onClick={() => setFilter(f)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                                        style={{
                                            background: isActive ? fcfg.lo : "transparent",
                                            color: isActive ? fcfg.color : T.muted,
                                            border: isActive ? `1px solid ${fcfg.md}` : "1px solid transparent",
                                            fontFamily: "'DM Sans',sans-serif",
                                        }}>
                                        {f}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* PAGINATION (TOP) */}
                {!loading && filtered.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
                        <div className="flex items-center gap-3">
                            <p className="text-sm" style={{ color: T.muted }}>
                                Showing <span style={{ color: T.text, fontWeight: 600 }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ color: T.text, fontWeight: 600 }}>{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span style={{ color: T.text, fontWeight: 600 }}>{filtered.length}</span> insights
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
                {!loading && !refreshing && !isPaginating && filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-5 py-28 text-center rounded-3xl"
                        style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                            style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                            <Brain size={28} style={{ color: T.accent }} />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-white mb-1" style={{ fontFamily: "'Sora',sans-serif" }}>No insights found</p>
                            <p className="text-sm" style={{ color: T.muted }}>Try adjusting your filters or generating new insights.</p>
                        </div>
                    </motion.div>
                )}

                {/* ── INSIGHTS GRID ── */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {(refreshing || isPaginating) ? (
                            <>
                                {Array.from({ length: paginatedLogs.length || 5 }).map((_, idx) => (
                                    <SkeletonCard key={`skel-${idx}`} idx={idx} />
                                ))}
                                {refreshing && (
                                    <motion.div key="refresh-loader" className="flex flex-col items-center gap-3 py-8">
                                        <div className="flex items-center gap-2">
                                            {[0, 1, 2].map(i => (
                                                <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                                                    className="w-2 h-2 rounded-full" style={{ background: T.accent }} />
                                            ))}
                                        </div>
                                        <p className="text-xs" style={{ color: T.muted }}>AI is analyzing your platform data…</p>
                                    </motion.div>
                                )}
                            </>
                        ) : paginatedLogs.map((item, i) => (
                            <InsightCard key={`${currentPage}-${i}-${item.clean.slice(0, 20)}`} item={item} index={i} />
                        ))}
                    </AnimatePresence>
                </div>

                {/* footer */}
                {!loading && !isPaginating && filtered.length > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                        className="text-center text-xs mt-10 flex items-center justify-center gap-1.5" style={{ color: T.muted }}>
                        <Brain size={10} style={{ color: T.accent }} />
                        AI-generated insights based on current platform data
                    </motion.p>
                )}

            </div>
        </div>
    );
}