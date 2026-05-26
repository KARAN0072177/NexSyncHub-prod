"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  ShieldAlert, Loader2, Trash2, Eye, EyeOff, Maximize,
  Shield, Image as ImageIcon, X, ChevronLeft, ChevronRight,
  Mail, Tag, Clock, AlertTriangle, Zap, Activity,
} from "lucide-react";

/* ─── Design Tokens ───────────────────────────────────────────────────────── */
const T = {
  bg: "#05070F",
  bgDeep: "#020408",
  glass: "rgba(10,14,30,0.60)",
  glassMid: "rgba(14,20,44,0.70)",
  glassHi: "rgba(18,26,58,0.80)",
  border: "rgba(255,80,110,0.08)",
  borderMid: "rgba(255,80,110,0.15)",
  borderHi: "rgba(255,80,110,0.28)",
  borderGlow: "rgba(255,80,110,0.45)",
  rose: "#FF3D5E",
  roseBright: "#FF6B85",
  roseDeep: "#CC1F3A",
  roseGlow: "rgba(255,61,94,0.18)",
  roseGlowBright: "rgba(255,61,94,0.35)",
  amber: "#F59E0B",
  amberLo: "rgba(245,158,11,0.12)",
  violet: "#8B5CF6",
  violetLo: "rgba(139,92,246,0.12)",
  cyan: "#06B6D4",
  cyanLo: "rgba(6,182,212,0.12)",
  accent: "#4F8EFF",
  accentLo: "rgba(79,142,255,0.10)",
  accentMid: "rgba(79,142,255,0.20)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  text: "#F0F4FF",
  textMuted: "#5A6480",
  textDim: "#8892AA",
};

/* ─── Source Config ──────────────────────────────────────────────────────── */
const SOURCE = {
  unsafe_avatar_upload: { label: "Avatar", color: T.accent, icon: "👤", gradient: "from-blue-500 to-indigo-600" },
  unsafe_workspace_avatar_upload: { label: "Workspace", color: T.violet, icon: "🏢", gradient: "from-violet-500 to-purple-700" },
  unsafe_support_attachment: { label: "Support", color: T.amber, icon: "🎫", gradient: "from-amber-400 to-orange-600" },
  unsafe_chat_attachment: { label: "Chat", color: "#F97316", icon: "💬", gradient: "from-orange-400 to-rose-600" },
} as const;

function getSource(action: string) {
  return SOURCE[action as keyof typeof SOURCE] ?? { label: "Unknown", color: T.textMuted, icon: "❓", gradient: "from-gray-600 to-gray-800" };
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface UnsafeLog {
  _id: string;
  action: string;
  signedEvidenceUrl?: string;
  metadata: {
    filename?: string;
    evidenceUrl?: string;
    evidenceKey?: string;
    evidenceExpiresAt?: string;
    moderationLabels?: { name: string; confidence: number; parentName?: string }[];
  };
  user?: { username?: string; email: string; avatar?: string; role: string };
  createdAt: string;
}

/* ─── Animated Threat Score Ring ─────────────────────────────────────────── */
function ThreatRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 80 ? T.rose : score > 50 ? T.amber : T.emerald;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        style={{ transformOrigin: `${size/2}px ${size/2}px`, rotate: "-90deg" }}
        filter={`drop-shadow(0 0 4px ${color})`}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color}
        style={{ fontSize: size > 48 ? "12px" : "10px", fontWeight: 700, fontFamily: "monospace" }}>
        {Math.round(score)}
      </text>
    </svg>
  );
}

/* ─── Confidence Bar ─────────────────────────────────────────────────────── */
function ConfidenceBar({ label, confidence, parentName }: { label: string; confidence: number; parentName?: string }) {
  const color = confidence > 90 ? T.rose : confidence > 70 ? T.amber : T.textDim;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative overflow-hidden rounded-xl px-3.5 py-2.5"
      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid rgba(255,255,255,0.06)` }}
    >
      <motion.div
        className="absolute left-0 top-0 bottom-0 rounded-l-xl"
        style={{ background: `linear-gradient(90deg, ${color}25, transparent)` }}
        initial={{ width: 0 }}
        animate={{ width: `${confidence}%` }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
      />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white/90 truncate">{label}</p>
          {parentName && <p className="text-[9px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{parentName}</p>}
        </div>
        <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color, fontFamily: "monospace" }}>
          {Math.round(confidence)}%
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton Card ──────────────────────────────────────────────────────── */
function SkeletonCard({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.5 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: T.glass, border: `1px solid ${T.border}` }}
    >
      <div className="aspect-[16/9] w-full relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "rgba(255,61,94,0.04)" }} />
        <div className="absolute inset-0 shimmer-bg" />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-2xl shrink-0" style={{ background: "rgba(255,61,94,0.07)" }} />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 w-2/3 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-2.5 w-1/2 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        </div>
        <div className="space-y-2 pt-1">
          {[0.7, 0.5, 0.8].map((w, i) => (
            <div key={i} className="h-8 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Magnetic Card Component ────────────────────────────────────────────── */
function MagneticCard({ children, onClick, className = "", style = {} }: {
  children: React.ReactNode; onClick?: () => void; className?: string; style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 150, damping: 20 });
  const springY = useSpring(rotY, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotX.set(((e.clientY - cy) / rect.height) * -10);
    rotY.set(((e.clientX - cx) / rect.width) * 10);
  }, []);

  const handleMouseLeave = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d", ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Media Card ─────────────────────────────────────────────────────────── */
function MediaCard({
  log, onOpen, onDelete, isDeleting, visible, onToggleVisible
}: {
  log: UnsafeLog; onOpen: () => void; onDelete: () => void;
  isDeleting: boolean; visible: boolean; onToggleVisible: (e: React.MouseEvent) => void;
}) {
  const src = getSource(log.action);
  const topScore = log.metadata?.moderationLabels?.[0]?.confidence ?? 0;
  const [hovered, setHovered] = useState(false);

  return (
    <MagneticCard>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: -12 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={onOpen}
        className="cursor-pointer rounded-3xl overflow-hidden flex flex-col relative group"
        style={{
          background: T.glass,
          border: `1px solid ${hovered ? T.borderHi : T.borderMid}`,
          backdropFilter: "blur(24px) saturate(180%)",
          boxShadow: hovered
            ? `0 20px 60px -10px rgba(255,61,94,0.25), 0 0 0 1px ${T.borderHi}, inset 0 1px 0 rgba(255,255,255,0.06)`
            : `0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* Scan line animation */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ top: "-10%", opacity: 0.6 }}
              animate={{ top: "110%", opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "linear" }}
              className="absolute left-0 right-0 h-px z-30 pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${T.rose}, transparent)` }}
            />
          )}
        </AnimatePresence>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${src.color}60, transparent)` }} />

        {/* Image Area */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-black/60 shrink-0">
          {log.signedEvidenceUrl ? (
            <>
              <img src={log.signedEvidenceUrl} alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                style={{ filter: "blur(24px) saturate(80%)", transform: "scale(1.15)" }}
              />
              <img src={log.signedEvidenceUrl} alt="Evidence"
                className={`relative z-10 w-full h-full object-contain transition-all duration-700 ease-out ${visible ? "scale-100 blur-0" : "blur-[28px] scale-105"}`}
              />
              <motion.div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
                initial={false}
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ background: "rgba(2,4,12,0.65)", backdropFilter: hovered ? "blur(4px)" : "none" }}
              >
                <div className="flex items-center gap-3">
                  {[
                    { icon: visible ? <EyeOff size={20} /> : <Eye size={20} />, onClick: onToggleVisible, color: "rgba(255,255,255,0.12)", label: visible ? "Hide" : "Reveal" },
                    { icon: <Maximize size={20} />, onClick: (e: React.MouseEvent) => { e.stopPropagation(); onOpen(); }, color: "rgba(255,255,255,0.12)", label: "Expand" },
                    { icon: isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />, onClick: (e: React.MouseEvent) => { e.stopPropagation(); onDelete(); }, color: T.rose, label: "Delete" },
                  ].map((btn, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={btn.onClick}
                      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl"
                      style={{
                        background: btn.color,
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fff",
                        boxShadow: i === 2 ? `0 4px 20px rgba(255,61,94,0.4)` : undefined,
                      }}
                    >
                      {btn.icon}
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">{btn.label}</span>
                    </motion.button>
                  ))}
                </div>
                {!visible && (
                  <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/40 mt-2 flex items-center gap-1.5">
                    <AlertTriangle size={10} />
                    Sensitive Content Hidden
                  </p>
                )}
              </motion.div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ImageIcon size={22} style={{ color: T.textMuted }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: T.textMuted }}>Media unavailable</p>
            </div>
          )}

          {/* Threat score badge */}
          <div className="absolute top-3 right-3 z-20">
            <ThreatRing score={topScore} size={46} />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: `${src.color}15`,
                  color: src.color,
                  border: `1px solid ${src.color}30`,
                }}>
                <span className="text-[10px]">{src.icon}</span>
                {src.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: T.textMuted }}>
              <Clock size={10} />
              {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
            </div>
          </div>

          {/* User row */}
          {log.user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {log.user.avatar ? (
                <img src={log.user.avatar} alt="Avatar"
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMid}` }}>
                  {(log.user.username || log.user.email)[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white/90 truncate leading-tight"
                  style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  {log.user.username || "Unnamed"}
                </p>
                <p className="text-[10px] truncate mt-0.5" style={{ color: T.textMuted }}>
                  {log.user.email}
                </p>
              </div>
            </div>
          )}

          {/* Labels */}
          <div className="space-y-1.5 mb-auto">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5" style={{ color: T.textMuted }}>
              <Tag size={9} />
              Detected Labels
            </p>
            {log.metadata?.moderationLabels?.slice(0, 3).map((label, i) => (
              <ConfidenceBar key={i} label={label.name} confidence={label.confidence} parentName={label.parentName} />
            ))}
            {(log.metadata?.moderationLabels?.length ?? 0) > 3 && (
              <p className="text-[10px] text-center py-1 font-medium" style={{ color: T.textMuted }}>
                +{(log.metadata!.moderationLabels!.length) - 3} more signals
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </MagneticCard>
  );
}

/* ─── Stat Pill ──────────────────────────────────────────────────────────── */
function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <span className="text-base font-black tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>{label}</span>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function UnsafeMediaPage() {
  const [logs, setLogs] = useState<UnsafeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<UnsafeLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [mounted, setMounted] = useState(false);
  const [visibleImages, setVisibleImages] = useState<Record<string, boolean>>({});
  const [filterAction, setFilterAction] = useState<string>("all");

  const toggleImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleImages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    setMounted(true);
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/unsafe-media");
        const data = await res.json();
        if (res.ok) setLogs(data.logs);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  const handleDelete = async (logId: string) => {
    if (!confirm("Permanently delete this evidence record?")) return;
    setDeletingId(logId);
    try {
      const res = await fetch(`/api/admin/unsafe-media/${logId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setLogs((p) => p.filter((l) => l._id !== logId));
      if (selectedLog?._id === logId) setSelectedLog(null);
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const filteredLogs = filterAction === "all" ? logs : logs.filter(l => l.action === filterAction);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const actionCounts = Object.keys(SOURCE).reduce((acc, key) => {
    acc[key] = logs.filter(l => l.action === key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,61,94,0.3); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,61,94,0.5); }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .shimmer-bg { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%); animation: shimmer 2s infinite; }
        @keyframes pulse-ring { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        .pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
        @keyframes data-stream {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 100%; }
        }
        .data-stream {
          background: repeating-linear-gradient(to bottom, transparent 0px, transparent 8px, rgba(255,61,94,0.03) 8px, rgba(255,61,94,0.03) 9px);
          background-size: 100% 9px;
          animation: data-stream 6s linear infinite;
        }
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>

      {/* ── Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {/* Deep gradient base */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 10% 0%, rgba(255,40,70,0.07) 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at 90% 100%, rgba(139,92,246,0.05) 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 40% at 50% 50%, rgba(79,142,255,0.03) 0%, transparent 70%)` }} />

        {/* Noise texture overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.4,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }} />

        {/* Data stream grid */}
        <div className="data-stream" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />

        {/* Fine grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(255,61,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,61,94,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Large glowing orbs */}
        <div className="pulse-ring" style={{
          position: "absolute", top: -200, left: -200, width: 700, height: 700,
          borderRadius: "50%", background: "rgba(255,40,70,0.05)", filter: "blur(100px)",
        }} />
        <div style={{
          position: "absolute", bottom: -150, right: -100, width: 600, height: 600,
          borderRadius: "50%", background: "rgba(139,92,246,0.04)", filter: "blur(90px)",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "20%", width: 400, height: 400,
          borderRadius: "50%", background: "rgba(79,142,255,0.03)", filter: "blur(80px)",
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-5"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: T.roseGlow, border: `1px solid ${T.borderMid}` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.rose }} />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: T.rose }}>
                Live Monitoring
              </span>
            </div>
            <Activity size={12} style={{ color: T.textMuted }} />
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            {/* Title block */}
            <div>
              <div className="flex items-center gap-5 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl animate-pulse"
                    style={{ background: T.roseGlow, filter: "blur(12px)" }} />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,61,94,0.3) 0%, rgba(204,31,58,0.4) 100%)",
                      border: `1px solid ${T.borderHi}`,
                      boxShadow: `0 8px 32px rgba(255,61,94,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}>
                    <ShieldAlert size={26} style={{ color: T.rose }} />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-white leading-none"
                    style={{ fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.03em" }}>
                    Unsafe Media
                  </h1>
                  <p className="text-sm mt-1.5 font-medium" style={{ color: T.textMuted }}>
                    Content moderation evidence vault
                  </p>
                </div>
              </div>

              {/* Stats row */}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 flex-wrap"
                >
                  <StatPill label="Total" value={logs.length} color={T.rose} />
                  <StatPill label="Avatar" value={actionCounts["unsafe_avatar_upload"] ?? 0} color={T.accent} />
                  <StatPill label="Workspace" value={actionCounts["unsafe_workspace_avatar_upload"] ?? 0} color={T.violet} />
                  <StatPill label="Chat" value={actionCounts["unsafe_chat_attachment"] ?? 0} color="#F97316" />
                  <StatPill label="Support" value={actionCounts["unsafe_support_attachment"] ?? 0} color={T.amber} />
                </motion.div>
              )}
            </div>

            {/* Controls */}
            {!loading && logs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 flex-wrap lg:flex-nowrap"
              >
                {/* Filter tabs */}
                <div className="flex items-center gap-1 p-1 rounded-2xl"
                  style={{ background: T.glass, border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
                  {[
                    { key: "all", label: "All" },
                    ...Object.entries(SOURCE).map(([key, val]) => ({ key, label: val.label }))
                  ].map(({ key, label }) => (
                    <button key={key}
                      onClick={() => { setFilterAction(key); setCurrentPage(1); }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200"
                      style={filterAction === key ? {
                        background: T.roseGlowBright,
                        color: T.rose,
                        border: `1px solid ${T.borderHi}`,
                      } : {
                        color: T.textMuted,
                        border: "1px solid transparent",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                  style={{ background: T.glass, border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-transparent text-[11px] font-black text-white outline-none cursor-pointer"
                    style={{ fontFamily: "'JetBrains Mono',monospace" }}
                  >
                    {[12, 24, 48].map(n => (
                      <option key={n} value={n} style={{ background: "#0A0E1C" }}>{n}</option>
                    ))}
                  </select>
                  <div className="w-px h-5" style={{ background: T.border }} />
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-25"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[11px] font-black min-w-[3.5rem] text-center tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono',monospace", color: T.textDim }}>
                    {currentPage} / {Math.max(1, totalPages)}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-25"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
          </div>
        ) : filteredLogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 py-28 text-center rounded-3xl relative overflow-hidden"
            style={{ background: T.glass, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}
          >
            <div className="absolute inset-0 data-stream opacity-30 pointer-events-none" />
            <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: T.emeraldLo, border: `1px solid ${T.emerald}30` }}>
              <Shield size={32} style={{ color: T.emerald }} />
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                All Clear
              </p>
              <p className="text-sm font-medium" style={{ color: T.textMuted }}>
                No unsafe media flagged for review
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedLogs.map((log) => (
                <MediaCard
                  key={log._id}
                  log={log}
                  onOpen={() => setSelectedLog(log)}
                  onDelete={() => handleDelete(log._id)}
                  isDeleting={deletingId === log._id}
                  visible={visibleImages[log._id] ?? false}
                  onToggleVisible={(e) => toggleImage(log._id, e)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── MODAL ── */}
      {mounted && createPortal(
        <AnimatePresence>
          {selectedLog && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[9998]"
                style={{ background: "rgba(2,4,12,0.90)", backdropFilter: "blur(20px)" }}
                onClick={() => setSelectedLog(null)}
              />

              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: 20 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-5xl max-h-[92vh] rounded-[2rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(12,18,40,0.95) 0%, rgba(8,12,28,0.98) 100%)`,
                    border: `1px solid ${T.borderHi}`,
                    backdropFilter: "blur(60px) saturate(200%)",
                    boxShadow: `0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px ${T.borderMid}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal scan line */}
                  <motion.div
                    initial={{ top: 0, opacity: 0.8 }}
                    animate={{ top: "100%", opacity: 0 }}
                    transition={{ duration: 2, ease: "linear", delay: 0.4, repeat: Infinity, repeatDelay: 4 }}
                    className="absolute left-0 right-0 h-[2px] z-30 pointer-events-none"
                    style={{ background: `linear-gradient(90deg, transparent, ${T.rose}80, ${T.rose}, ${T.rose}80, transparent)` }}
                  />

                  {/* Top glow line */}
                  <div className="absolute top-0 left-0 right-0 h-px z-20 pointer-events-none"
                    style={{ background: `linear-gradient(90deg, transparent 0%, ${T.rose}60 50%, transparent 100%)` }} />

                  {/* Corner decorations */}
                  {[
                    "top-0 left-0 border-t-2 border-l-2 rounded-tl-[2rem]",
                    "top-0 right-0 border-t-2 border-r-2 rounded-tr-[2rem]",
                    "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-[2rem]",
                    "bottom-0 right-0 border-b-2 border-r-2 rounded-br-[2rem]",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-8 h-8 ${cls} pointer-events-none z-20`}
                      style={{ borderColor: `${T.rose}40` }} />
                  ))}

                  {/* Close */}
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="absolute top-4 right-4 z-30 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-95"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <X size={18} color="white" />
                  </button>

                  {/* LEFT — Image */}
                  <div className="relative lg:w-[55%] h-64 sm:h-80 lg:h-auto flex items-center justify-center overflow-hidden bg-black/60">
                    <div className="data-stream absolute inset-0 opacity-20 pointer-events-none" />

                    {selectedLog.signedEvidenceUrl ? (
                      <>
                        <img src={selectedLog.signedEvidenceUrl} alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-20"
                          style={{ filter: "blur(30px) saturate(60%)", transform: "scale(1.2)" }}
                        />
                        <img src={selectedLog.signedEvidenceUrl} alt="Evidence"
                          className="relative z-10 w-full h-full object-contain p-8 sm:p-12"
                        />

                        {/* Bottom overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 z-20"
                          style={{ background: "linear-gradient(to top, rgba(5,7,15,0.9), transparent)" }}>
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                              style={{
                                background: `${getSource(selectedLog.action).color}20`,
                                color: getSource(selectedLog.action).color,
                                border: `1px solid ${getSource(selectedLog.action).color}35`,
                              }}>
                              {getSource(selectedLog.action).icon} {getSource(selectedLog.action).label}
                            </span>
                            <span className="text-[10px] font-mono" style={{ color: T.textMuted }}>
                              {new Date(selectedLog.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Threat score overlay */}
                        <div className="absolute top-5 left-5 z-20">
                          <ThreatRing score={selectedLog.metadata?.moderationLabels?.[0]?.confidence ?? 0} size={60} />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 z-10">
                        <ImageIcon size={44} style={{ color: T.textMuted }} />
                        <p className="text-sm" style={{ color: T.textMuted }}>Media unavailable</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT — Details */}
                  <div className="lg:w-[45%] overflow-y-auto p-6 sm:p-8 space-y-6 relative"
                    style={{ borderLeft: `1px solid ${T.border}` }}>

                    {/* Evidence ID badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: T.textMuted }}>
                        Evidence Record
                      </span>
                      <div className="flex-1 h-px" style={{ background: T.border }} />
                      <span className="text-[9px] font-mono" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                        #{selectedLog._id.slice(-8).toUpperCase()}
                      </span>
                    </div>

                    {/* User */}
                    {selectedLog.user && (
                      <div className="flex items-center gap-4 p-4 rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                        {selectedLog.user.avatar ? (
                          <img src={selectedLog.user.avatar} className="w-12 h-12 rounded-xl object-cover shrink-0"
                            style={{ border: "1px solid rgba(255,255,255,0.1)" }} alt="" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                            style={{ background: T.accentLo, color: T.accent, fontFamily: "'Space Grotesk',sans-serif" }}>
                            {(selectedLog.user.username || selectedLog.user.email)[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                            {selectedLog.user.username || "Unnamed User"}
                          </p>
                          <p className="text-xs flex items-center gap-1.5 mt-1 truncate" style={{ color: T.textMuted }}>
                            <Mail size={11} className="shrink-0" /> {selectedLog.user.email}
                          </p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest"
                            style={{ background: T.accentLo, color: T.accent }}>
                            {selectedLog.user.role}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Labels */}
                    {selectedLog.metadata?.moderationLabels?.length ? (
                      <div>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2" style={{ color: T.textMuted }}>
                          <Zap size={11} style={{ color: T.rose }} /> Threat Signals
                        </h3>
                        <div className="space-y-2">
                          {selectedLog.metadata.moderationLabels.map((label, i) => (
                            <ConfidenceBar key={i} label={label.name} confidence={label.confidence} parentName={label.parentName} />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Expiry */}
                    {selectedLog.metadata?.evidenceExpiresAt && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl text-xs"
                        style={{ background: T.amberLo, border: `1px solid ${T.amber}25`, color: T.amber }}>
                        <Clock size={13} className="shrink-0" />
                        <span>
                          Auto-deletes {new Date(selectedLog.metadata.evidenceExpiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    )}

                    {/* Delete */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleDelete(selectedLog._id)}
                      disabled={deletingId === selectedLog._id}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-white text-sm uppercase tracking-wider transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${T.rose} 0%, ${T.roseDeep} 100%)`,
                        boxShadow: `0 8px 32px rgba(255,61,94,0.35), inset 0 1px 0 rgba(255,255,255,0.15)`,
                        border: `1px solid rgba(255,255,255,0.1)`,
                        fontFamily: "'Space Grotesk',sans-serif",
                        letterSpacing: "0.05em",
                      }}>
                      {deletingId === selectedLog._id ? (
                        <><Loader2 size={17} className="animate-spin" /> Deleting...</>
                      ) : (
                        <><Trash2 size={17} /> Delete Permanently</>
                      )}
                    </motion.button>

                    {/* Warning note */}
                    <p className="text-[9px] text-center font-medium" style={{ color: T.textMuted }}>
                      This action is irreversible and removes the evidence from storage
                    </p>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}