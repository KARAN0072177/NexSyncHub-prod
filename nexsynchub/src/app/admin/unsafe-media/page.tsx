"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { socket } from "@/lib/socket";
import {
  ShieldAlert, Loader2, Trash2, Eye, EyeOff, Maximize,
  Shield, Image as ImageIcon, X, ChevronLeft, ChevronRight,
  Mail, Tag, Clock, AlertTriangle, Zap, Activity, Check,
  Play, Pause, ZoomIn, ZoomOut, RotateCcw, Download, ExternalLink,
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

const UNSAFE_MEDIA_ACTIONS =
  Object.keys(SOURCE);

const REVIEW_REJECTION_REASONS = [
  {
    id: "explicit_content",
    label: "Explicit or adult content",
  },
  {
    id: "violent_or_graphic",
    label: "Violent, graphic, or disturbing content",
  },
  {
    id: "harassment_or_hate",
    label: "Harassment, hateful, or abusive material",
  },
  {
    id: "privacy_or_identity",
    label: "Privacy, identity, or impersonation concern",
  },
  {
    id: "platform_policy",
    label: "Does not meet platform safety standards",
  },
];

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
    moderationLabels?: {
      name?: string;
      Name?: string;
      confidence?: number;
      Confidence?: number;
      parentName?: string;
      parent?: string;
      ParentName?: string;
    }[];
    reviewNotice?: {
      decision: "approved" | "rejected";
      rejectionReasons?: string[];
      sentAt?: string;
    };
  };
  user?: { username?: string; email: string; avatar?: string; role: string };
  createdAt: string;
}

type NormalizedModerationLabel = {
  name: string;
  confidence: number;
  parentName?: string;
};

function normalizeModerationLabels(
  labels: UnsafeLog["metadata"]["moderationLabels"] = []
): NormalizedModerationLabel[] {
  return labels
    .map((label) => ({
      name:
        label.name ||
        label.Name ||
        "Unknown signal",
      confidence:
        label.confidence ??
        label.Confidence ??
        0,
      parentName:
        label.parentName ||
        label.parent ||
        label.ParentName,
    }))
    .filter((label) => label.name !== "Unknown signal" || label.confidence > 0);
}

function normalizeUnsafeLog(log: UnsafeLog): UnsafeLog {
  const metadata =
    log.metadata ?? {};

  return {
    ...log,
    signedEvidenceUrl:
      log.signedEvidenceUrl ||
      metadata.evidenceUrl,
    metadata: {
      ...metadata,
      moderationLabels:
        normalizeModerationLabels(
          metadata.moderationLabels
        ),
    },
  };
}

function getEvidenceUrl(log: UnsafeLog) {
  return log.signedEvidenceUrl ||
    log.metadata?.evidenceUrl ||
    "";
}

/* ─── Animated Threat Score Ring ─────────────────────────────────────────── */
function ThreatRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 80 ? T.rose : score > 50 ? T.amber : T.emerald;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        style={{ transformOrigin: `${size / 2}px ${size / 2}px`, rotate: "-90deg" }}
        filter={`drop-shadow(0 0 4px ${color})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={color}
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
  }, [rotX, rotY]);

  const handleMouseLeave = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
  }, [rotX, rotY]);

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
  log, onOpen, onDelete, isDeleting, visible, onToggleVisible, isSelected, onToggleSelect
}: {
  log: UnsafeLog; onOpen: () => void; onDelete: () => void;
  isDeleting: boolean; visible: boolean; onToggleVisible: (e: React.MouseEvent) => void;
  isSelected: boolean; onToggleSelect: (e: React.MouseEvent) => void;
}) {
  const src = getSource(log.action);
  const evidenceUrl =
    log.signedEvidenceUrl ||
    log.metadata?.evidenceUrl;
  const moderationLabels =
    normalizeModerationLabels(
      log.metadata?.moderationLabels
    );
  const topScore =
    moderationLabels[0]?.confidence ?? 0;
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
          border: `1px solid ${hovered || isSelected ? T.borderHi : T.borderMid}`,
          backdropFilter: "blur(24px) saturate(180%)",
          boxShadow: hovered || isSelected
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

        {/* Selection Indicator */}
        <button
          onClick={onToggleSelect}
          className={`absolute top-3 left-3 z-30 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}
          style={{
            background: isSelected ? T.rose : "rgba(0,0,0,0.5)",
            border: `1px solid ${isSelected ? T.roseBright : "rgba(255,255,255,0.2)"}`,
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
        >
          {isSelected && <Check size={16} strokeWidth={3} />}
        </button>

        {/* Image Area */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-black/60 shrink-0">
          {evidenceUrl ? (
            <>
              <img src={evidenceUrl} alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                style={{ filter: "blur(24px) saturate(80%)", transform: "scale(1.15)" }}
              />
              <img src={evidenceUrl} alt="Evidence"
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
            {moderationLabels.slice(0, 3).map((label, i) => (
              <ConfidenceBar key={i} label={label.name} confidence={label.confidence} parentName={label.parentName} />
            ))}
            {moderationLabels.length > 3 && (
              <p className="text-[10px] text-center py-1 font-medium" style={{ color: T.textMuted }}>
                +{moderationLabels.length - 3} more signals
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
function ImagesOnlyLightbox({
  logs,
  index,
  onClose,
  onNext,
  onPrev,
  onSelect,
}: {
  logs: UnsafeLog[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (index: number) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomState, setZoomState] = useState({
    logId: "",
    value: 1,
  });
  const activeLog = logs[index];
  const activeUrl = activeLog ? getEvidenceUrl(activeLog) : "";
  const canNavigate = logs.length > 1;
  const zoom =
    activeLog && zoomState.logId === activeLog._id
      ? zoomState.value
      : 1;

  useEffect(() => {
    if (!isPlaying || !canNavigate) return;

    const timer = window.setInterval(() => {
      onNext();
    }, 3600);

    return () => window.clearInterval(timer);
  }, [canNavigate, isPlaying, onNext]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && canNavigate) onNext();
      if (event.key === "ArrowLeft" && canNavigate) onPrev();
      if (event.key === " " && canNavigate) {
        event.preventDefault();
        setIsPlaying((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNavigate, onClose, onNext, onPrev]);

  if (!activeLog || !activeUrl) return null;

  const updateZoom = (nextZoom: number | ((current: number) => number)) => {
    setZoomState((current) => {
      const currentZoom =
        activeLog && current.logId === activeLog._id
          ? current.value
          : 1;
      const value =
        typeof nextZoom === "function"
          ? nextZoom(currentZoom)
          : nextZoom;

      return {
        logId: activeLog._id,
        value,
      };
    });
  };

  const zoomIn = () => updateZoom((current) => Math.min(current + 0.25, 3));
  const zoomOut = () => updateZoom((current) => Math.max(current - 0.25, 0.75));

  return (
    <motion.div
      className="fixed inset-0 z-[10020] flex items-center justify-center overflow-hidden p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(255,61,94,0.16), transparent 34%), rgba(2,4,12,0.94)",
          backdropFilter: "blur(18px)",
        }}
        onClick={onClose}
      />

      <motion.div
        className="relative flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[2rem]"
        initial={{ scale: 0.96, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        style={{
          background: "rgba(5,7,15,0.72)",
          border: `1px solid ${T.borderHi}`,
          boxShadow: "0 28px 90px rgba(0,0,0,0.72)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 p-4 sm:p-5">
          <div
            className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2"
            style={{ background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: T.roseGlow, color: T.rose, border: `1px solid ${T.borderHi}` }}
            >
              <ImageIcon size={17} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                Unsafe image {index + 1} of {logs.length}
              </p>
              <p className="truncate text-[10px] font-mono" style={{ color: T.textMuted }}>
                #{activeLog._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-2xl p-1.5"
            style={{ background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setIsPlaying((current) => !current)}
              disabled={!canNavigate}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 disabled:opacity-35"
              title={isPlaying ? "Pause slideshow" : "Start slideshow"}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button onClick={zoomOut} className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10" title="Zoom out">
              <ZoomOut size={17} />
            </button>
            <button onClick={zoomIn} className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10" title="Zoom in">
              <ZoomIn size={17} />
            </button>
            <button onClick={() => updateZoom(1)} className="hidden h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 sm:flex" title="Reset zoom">
              <RotateCcw size={17} />
            </button>
            <a href={activeUrl} download target="_blank" rel="noreferrer" className="hidden h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 sm:flex" title="Download image">
              <Download size={17} />
            </a>
            <a href={activeUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10" title="Open original">
              <ExternalLink size={17} />
            </a>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-20 sm:px-16">
          {canNavigate && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl text-white transition hover:bg-white/10 active:scale-95 sm:left-5"
                style={{ background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={onNext}
                className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl text-white transition hover:bg-white/10 active:scale-95 sm:right-5"
                style={{ background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.img
              key={activeLog._id}
              src={activeUrl}
              alt="Unsafe media evidence"
              className="max-h-full max-w-full select-none object-contain"
              initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: zoom, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ transformOrigin: "center", cursor: zoom > 1 ? "zoom-out" : "zoom-in" }}
              onClick={() => updateZoom((current) => current > 1 ? 1 : 1.6)}
              draggable={false}
            />
          </AnimatePresence>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 z-30 px-4 py-4"
          style={{ background: "linear-gradient(to top, rgba(2,4,12,0.92), transparent)" }}
        >
          <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto pb-1">
            {logs.map((log, thumbIndex) => {
              const thumbUrl = getEvidenceUrl(log);
              const isActive = thumbIndex === index;

              return (
                <button
                  key={log._id}
                  onClick={() => onSelect(thumbIndex)}
                  className="h-14 w-20 shrink-0 overflow-hidden rounded-xl transition-all"
                  style={{
                    border: `1px solid ${isActive ? T.roseBright : "rgba(255,255,255,0.12)"}`,
                    boxShadow: isActive ? `0 0 20px ${T.roseGlowBright}` : "none",
                    opacity: isActive ? 1 : 0.55,
                  }}
                  title={`Open image ${thumbIndex + 1}`}
                >
                  <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("rejected");
  const [rejectionReasons, setRejectionReasons] = useState<string[]>(["platform_policy"]);
  const [sendingReviewEmail, setSendingReviewEmail] = useState(false);
  const [reviewEmailMessage, setReviewEmailMessage] = useState("");
  const [imagesOnlyMode, setImagesOnlyMode] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
        if (res.ok) {
          setLogs(
            (data.logs ?? []).map(
              normalizeUnsafeLog
            )
          );
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    setReviewDecision("rejected");
    setRejectionReasons(["platform_policy"]);
    setReviewEmailMessage("");
  }, [selectedLog?._id]);

  useEffect(() => {
    socket.emit("join_admin_global");

    const handleUnsafeMediaLog = (
      newLog?: UnsafeLog
    ) => {
      if (
        !newLog?._id ||
        !UNSAFE_MEDIA_ACTIONS.includes(newLog.action)
      ) {
        return;
      }

      const liveLog =
        normalizeUnsafeLog(newLog);

      setLogs((currentLogs) => {
        if (
          currentLogs.some(
            (log) => log._id === liveLog._id
          )
        ) {
          return currentLogs;
        }

        return [liveLog, ...currentLogs];
      });

      setCurrentPage(1);
    };

    socket.on(
      "admin_security_log_created",
      handleUnsafeMediaLog
    );

    return () => {
      socket.off(
        "admin_security_log_created",
        handleUnsafeMediaLog
      );
    };
  }, []);

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("Permanently delete this evidence record?")) return;
    setDeletingId(logId);
    try {
      const res = await fetch(`/api/admin/unsafe-media/${logId}`, { method: "DELETE" });
      let data;

      try {

        data = await res.json();

      } catch {

        throw new Error(
          "Invalid server response"
        );

      }
      if (!res.ok) { alert(data.error); return; }
      setLogs((p) => p.filter((l) => l._id !== logId));
      if (selectedLog?._id === logId) setSelectedLog(null);
      setLightboxIndex(null);
      setSelectedIds((p) => { const next = new Set(p); next.delete(logId); return next; });
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const toggleRejectionReason = (reasonId: string) => {
    setRejectionReasons((current) =>
      current.includes(reasonId)
        ? current.filter((id) => id !== reasonId)
        : [...current, reasonId]
    );
  };

  const handleSendReviewEmail = async () => {
    if (!selectedLog) return;

    if (reviewDecision === "rejected" && rejectionReasons.length === 0) {
      setReviewEmailMessage("Select at least one rejection reason.");
      return;
    }

    setSendingReviewEmail(true);
    setReviewEmailMessage("");

    try {
      const res = await fetch(
        `/api/admin/unsafe-media/${selectedLog._id}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision:
              reviewDecision,
            rejectionReasons:
              reviewDecision === "rejected"
                ? rejectionReasons
                : [],
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setReviewEmailMessage(data.error || "Failed to send review email.");
        return;
      }

      const nextNotice = {
        decision:
          reviewDecision,
        rejectionReasons:
          reviewDecision === "rejected"
            ? rejectionReasons
            : [],
        sentAt:
          new Date().toISOString(),
      };

      setLogs((current) =>
        current.map((log) =>
          log._id === selectedLog._id
            ? {
              ...log,
              metadata: {
                ...log.metadata,
                reviewNotice:
                  nextNotice,
              },
            }
            : log
        )
      );

      setSelectedLog((current) =>
        current
          ? {
            ...current,
            metadata: {
              ...current.metadata,
              reviewNotice:
                nextNotice,
            },
          }
          : current
      );

      setReviewEmailMessage("Review email sent to user.");
    } catch (error) {
      console.error(error);
      setReviewEmailMessage("Failed to send review email.");
    } finally {
      setSendingReviewEmail(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} evidence records?`)) return;

    setIsBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/unsafe-media/${id}`, { method: "DELETE" })
        )
      );
      setLogs((p) => p.filter((l) => !selectedIds.has(l._id)));
      setSelectedIds(new Set());
      if (selectedLog && selectedIds.has(selectedLog._id)) setSelectedLog(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete some records");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const filteredLogs = filterAction === "all" ? logs : logs.filter(l => l.action === filterAction);
  const imageOnlyLogs = filteredLogs.filter((log) => Boolean(getEvidenceUrl(log)));
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const actionCounts = Object.keys(SOURCE).reduce((acc, key) => {
    acc[key] = logs.filter(l => l.action === key).length;
    return acc;
  }, {} as Record<string, number>);
  const selectedModerationLabels =
    selectedLog
      ? normalizeModerationLabels(
        selectedLog.metadata?.moderationLabels
      )
      : [];
  const selectedEvidenceUrl =
    selectedLog
      ? getEvidenceUrl(selectedLog)
      : "";

  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= imageOnlyLogs.length) {
      setLightboxIndex(null);
    }
  }, [imageOnlyLogs.length, lightboxIndex]);

  const openLightboxForLog = (logId: string) => {
    const nextIndex = imageOnlyLogs.findIndex((log) => log._id === logId);
    if (nextIndex >= 0) setLightboxIndex(nextIndex);
  };

  const showNextImage = useCallback(() => {
    setLightboxIndex((current) => {
      if (imageOnlyLogs.length === 0) return null;
      if (current === null) return 0;
      return (current + 1) % imageOnlyLogs.length;
    });
  }, [imageOnlyLogs.length]);

  const showPreviousImage = useCallback(() => {
    setLightboxIndex((current) => {
      if (imageOnlyLogs.length === 0) return null;
      if (current === null) return 0;
      return (current - 1 + imageOnlyLogs.length) % imageOnlyLogs.length;
    });
  }, [imageOnlyLogs.length]);

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
                <button
                  onClick={() => setImagesOnlyMode((current) => !current)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200"
                  style={{
                    background: imagesOnlyMode ? T.accentMid : T.glass,
                    color: imagesOnlyMode ? T.accent : T.textMuted,
                    border: `1px solid ${imagesOnlyMode ? T.accent : T.border}`,
                    boxShadow: imagesOnlyMode ? `0 0 24px ${T.accentLo}` : "none",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <ImageIcon size={14} />
                  {imagesOnlyMode ? "Evidence Cards" : "Images Only"}
                </button>

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

        {/* ── BULK ACTIONS ROW ── */}
        {!loading && !imagesOnlyMode && paginatedLogs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <button
              onClick={() => {
                if (selectedIds.size === paginatedLogs.length && paginatedLogs.length > 0) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(paginatedLogs.map(l => l._id)));
                }
              }}
              className="px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200"
              style={{
                background: selectedIds.size > 0 && selectedIds.size === paginatedLogs.length ? T.roseGlowBright : T.glass,
                color: selectedIds.size > 0 && selectedIds.size === paginatedLogs.length ? T.rose : T.textMuted,
                border: `1px solid ${selectedIds.size > 0 && selectedIds.size === paginatedLogs.length ? T.borderHi : T.border}`,
                backdropFilter: "blur(16px)"
              }}
            >
              {selectedIds.size > 0 && selectedIds.size === paginatedLogs.length ? "Deselect Page" : "Select Page"}
            </button>

            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-white text-[11px] uppercase tracking-widest transition-all whitespace-nowrap overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${T.rose} 0%, ${T.roseDeep} 100%)`,
                    border: `1px solid rgba(255,255,255,0.1)`,
                    boxShadow: `0 4px 15px ${T.roseGlowBright}`,
                  }}
                >
                  {isBulkDeleting ? <Loader2 size={14} className="animate-spin shrink-0" /> : <Trash2 size={14} className="shrink-0" />}
                  <span>Delete ({selectedIds.size})</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

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
        ) : imagesOnlyMode ? (
          imageOnlyLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5 py-28 text-center rounded-3xl relative overflow-hidden"
              style={{ background: T.glass, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}
            >
              <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: T.accentLo, border: `1px solid ${T.accent}30` }}>
                <ImageIcon size={32} style={{ color: T.accent }} />
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  No Images Available
                </p>
                <p className="text-sm font-medium" style={{ color: T.textMuted }}>
                  The current filter has no viewable image evidence.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4"
            >
              <AnimatePresence mode="popLayout">
                {imageOnlyLogs.map((log, index) => {
                  const imageUrl = getEvidenceUrl(log);

                  return (
                    <motion.button
                      key={log._id}
                      layout
                      initial={{ opacity: 0, scale: 0.92, y: 14 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      whileHover={{ y: -4, scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openLightboxForLog(log._id)}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-black"
                      style={{
                        border: `1px solid ${T.borderMid}`,
                        boxShadow: "0 16px 42px rgba(0,0,0,0.32)",
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Unsafe media evidence ${index + 1}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: "linear-gradient(to top, rgba(2,4,12,0.64), transparent 62%)" }}
                      />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )
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
                  isSelected={selectedIds.has(log._id)}
                  onToggleSelect={(e) => toggleSelection(log._id, e)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── MODAL ── */}
      {mounted && createPortal(
        <AnimatePresence>
          {lightboxIndex !== null && imageOnlyLogs[lightboxIndex] && (
            <ImagesOnlyLightbox
              logs={imageOnlyLogs}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNext={showNextImage}
              onPrev={showPreviousImage}
              onSelect={setLightboxIndex}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {selectedLog && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="fixed inset-0 z-[9998]"
                style={{ background: "rgba(2,4,12,0.86)" }}
                onClick={() => setSelectedLog(null)}
              />

              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="relative w-full max-w-5xl max-h-[92vh] rounded-[2rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(12,18,40,0.95) 0%, rgba(8,12,28,0.98) 100%)`,
                    border: `1px solid ${T.borderHi}`,
                    boxShadow: `0 24px 70px -18px rgba(0,0,0,0.78), 0 0 0 1px ${T.borderMid}`,
                    willChange: "transform, opacity",
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
                    {selectedEvidenceUrl ? (
                      <>
                        <img src={selectedEvidenceUrl} alt="Evidence"
                          loading="eager"
                          decoding="async"
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
                          <ThreatRing score={selectedModerationLabels[0]?.confidence ?? 0} size={60} />
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
                    {selectedModerationLabels.length ? (
                      <div>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2" style={{ color: T.textMuted }}>
                          <Zap size={11} style={{ color: T.rose }} /> Threat Signals
                        </h3>
                        <div className="space-y-2">
                          {selectedModerationLabels.map((label, i) => (
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

                    {/* Review Email */}
                    <div className="rounded-2xl p-4 space-y-4"
                      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}` }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: T.textMuted }}>
                            <Mail size={11} style={{ color: T.cyan }} /> User Email Notice
                          </h3>
                          {selectedLog.metadata?.reviewNotice?.sentAt && (
                            <p className="text-[10px] mt-1" style={{ color: T.textMuted }}>
                              Last sent: {selectedLog.metadata.reviewNotice.decision} · {new Date(selectedLog.metadata.reviewNotice.sentAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedLog.user?.email ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: "approved" as const, label: "Approved", color: T.emerald, bg: T.emeraldLo },
                              { value: "rejected" as const, label: "Rejected", color: T.rose, bg: T.roseGlow },
                            ].map((item) => (
                              <button
                                key={item.value}
                                onClick={() => setReviewDecision(item.value)}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                style={{
                                  background: reviewDecision === item.value ? item.bg : "rgba(255,255,255,0.03)",
                                  color: reviewDecision === item.value ? item.color : T.textMuted,
                                  border: `1px solid ${reviewDecision === item.value ? `${item.color}55` : "rgba(255,255,255,0.06)"}`,
                                }}
                              >
                                <Check size={13} />
                                {item.label}
                              </button>
                            ))}
                          </div>

                          {reviewDecision === "rejected" && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                                Rejection reasons
                              </p>
                              {REVIEW_REJECTION_REASONS.map((reason) => {
                                const checked =
                                  rejectionReasons.includes(reason.id);

                                return (
                                  <label
                                    key={reason.id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors"
                                    style={{
                                      background: checked ? T.roseGlow : "rgba(255,255,255,0.025)",
                                      border: `1px solid ${checked ? T.borderHi : "rgba(255,255,255,0.05)"}`,
                                      color: checked ? T.text : T.textDim,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleRejectionReason(reason.id)}
                                      className="sr-only"
                                    />
                                    <span
                                      className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                                      style={{
                                        background: checked ? T.rose : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${checked ? T.roseBright : "rgba(255,255,255,0.12)"}`,
                                      }}
                                    >
                                      {checked && <Check size={11} color="white" strokeWidth={3} />}
                                    </span>
                                    <span className="text-xs font-semibold leading-snug">
                                      {reason.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSendReviewEmail}
                            disabled={sendingReviewEmail}
                            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl font-black text-white text-xs uppercase tracking-wider transition-all disabled:opacity-60"
                            style={{
                              background: reviewDecision === "approved"
                                ? `linear-gradient(135deg, ${T.emerald} 0%, #047857 100%)`
                                : `linear-gradient(135deg, ${T.rose} 0%, ${T.roseDeep} 100%)`,
                              border: "1px solid rgba(255,255,255,0.1)",
                              boxShadow: reviewDecision === "approved"
                                ? "0 8px 28px rgba(16,185,129,0.25)"
                                : `0 8px 28px ${T.roseGlowBright}`,
                              fontFamily: "'Space Grotesk',sans-serif",
                            }}
                          >
                            {sendingReviewEmail ? (
                              <><Loader2 size={15} className="animate-spin" /> Sending...</>
                            ) : (
                              <><Mail size={15} /> Send {reviewDecision} email</>
                            )}
                          </motion.button>

                          {reviewEmailMessage && (
                            <p
                              className="text-[10px] text-center font-bold"
                              style={{ color: reviewEmailMessage.includes("sent") ? T.emerald : T.amber }}
                            >
                              {reviewEmailMessage}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="p-3 rounded-xl text-xs flex items-center gap-2"
                          style={{ background: T.amberLo, border: `1px solid ${T.amber}25`, color: T.amber }}>
                          <AlertTriangle size={13} />
                          No user email is attached to this evidence record.
                        </div>
                      )}
                    </div>

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
