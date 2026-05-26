"use client";

import { useState, useRef, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Loader2, ShieldAlert, ImageIcon,
  Scan, Zap, AlertOctagon, CheckCircle2,
  Activity, Tag, FileWarning, Cpu, Target,
  X, RefreshCw,
} from "lucide-react";

/* ─── Design Tokens ── Forensic / AI-Scanner ─────────────────────────────── */
const T = {
  bg: "#03060F",
  bgDeep: "#020408",
  surface: "rgba(8,16,40,0.80)",
  surfaceMid: "rgba(10,18,44,0.85)",
  panel: "rgba(6,12,30,0.70)",

  border: "rgba(99,140,255,0.08)",
  borderMid: "rgba(99,140,255,0.15)",
  borderHi: "rgba(99,140,255,0.28)",
  borderGlow: "rgba(99,140,255,0.50)",

  accent: "#3D7BFF",
  accentBright: "#6B9BFF",
  accentDim: "rgba(61,123,255,0.55)",
  accentLo: "rgba(61,123,255,0.08)",
  accentMid: "rgba(61,123,255,0.18)",

  violet: "#7C3AED",
  violetLo: "rgba(124,58,237,0.10)",

  rose: "#F43F5E",
  roseLo: "rgba(244,63,94,0.10)",
  roseMid: "rgba(244,63,94,0.22)",
  roseGlow: "rgba(244,63,94,0.40)",

  amber: "#F59E0B",
  amberLo: "rgba(245,158,11,0.10)",
  amberMid: "rgba(245,158,11,0.22)",

  cyan: "#22D3EE",
  cyanLo: "rgba(34,211,238,0.10)",

  text: "#E2E8F8",
  textDim: "#8BA3C0",
  textMuted: "#4A5578",
  textGhost: "#1E2D42",
} as const;

/* ─── Severity Config ────────────────────────────────────────────────────── */
type SeverityLevel = "none" | "low" | "medium" | "high" | "critical";

const SEVERITY: Record<SeverityLevel, { color: string; bg: string; border: string; glow: string; label: string }> = {
  none:     { color: T.accent,        bg: T.accentLo,   border: T.borderMid,  glow: "rgba(61,123,255,0.25)",  label: "NONE"     },
  low:      { color: T.cyan,          bg: T.cyanLo,     border: "rgba(34,211,238,0.25)", glow: "rgba(34,211,238,0.2)", label: "LOW" },
  medium:   { color: T.amber,         bg: T.amberLo,    border: T.amberMid,   glow: "rgba(245,158,11,0.25)",  label: "MEDIUM"   },
  high:     { color: T.rose,          bg: T.roseLo,     border: T.roseMid,    glow: T.roseGlow,               label: "HIGH"     },
  critical: { color: "#FF1744",       bg: "rgba(255,23,68,0.12)", border: "rgba(255,23,68,0.30)", glow: "rgba(255,23,68,0.50)", label: "CRITICAL" },
};

function getSeverityConfig(severity: string) {
  return SEVERITY[(severity?.toLowerCase() as SeverityLevel)] ?? SEVERITY.medium;
}

/* ─── Analysis Result Type ───────────────────────────────────────────────── */
interface AnalysisResult {
  isExplicit: boolean;
  confidence: number;
  severity: string;
  summary: string;
  labels?: string[];
  recommendation: string;
}

/* ─── Corner Bracket ─────────────────────────────────────────────────────── */
function CornerBrackets({ color = T.accent, size = 16, thickness = 1.5 }: {
  color?: string; size?: number; thickness?: number;
}) {
  const s = size;
  const corners = [
    `M0,${s} L0,0 L${s},0`,
    `M${100 - s}%,0 L100%,0 L100%,${s}px`,
    `M0,calc(100% - ${s}px) L0,100% L${s}px,100%`,
    `M${100 - s}%,100% L100%,100% L100%,calc(100% - ${s}px)`,
  ];
  return (
    <div className="absolute inset-0 pointer-events-none z-10" aria-hidden>
      {/* TL */}
      <svg className="absolute top-0 left-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polyline points={`0,${s} 0,0 ${s},0`} fill="none" stroke={color} strokeWidth={thickness} />
      </svg>
      {/* TR */}
      <svg className="absolute top-0 right-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polyline points={`0,0 ${s},0 ${s},${s}`} fill="none" stroke={color} strokeWidth={thickness} />
      </svg>
      {/* BL */}
      <svg className="absolute bottom-0 left-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polyline points={`0,0 0,${s} ${s},${s}`} fill="none" stroke={color} strokeWidth={thickness} />
      </svg>
      {/* BR */}
      <svg className="absolute bottom-0 right-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polyline points={`${s},0 ${s},${s} 0,${s}`} fill="none" stroke={color} strokeWidth={thickness} />
      </svg>
    </div>
  );
}

/* ─── Confidence Arc ─────────────────────────────────────────────────────── */
function ConfidenceArc({ value, color }: { value: number; color: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
      {/* Glow ring */}
      <svg width={130} height={130} className="absolute inset-0" style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke={`${color}12`} strokeWidth={6} />
        <motion.circle
          cx={65} cy={65} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ transformOrigin: "65px 65px", rotate: "-90deg" }}
        />
        {/* Tick marks */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = 65 + (r - 10) * Math.cos(rad);
          const y1 = 65 + (r - 10) * Math.sin(rad);
          const x2 = 65 + (r - 14) * Math.cos(rad);
          const y2 = 65 + (r - 14) * Math.sin(rad);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`${color}30`} strokeWidth={1} />
          );
        })}
      </svg>
      <div className="relative text-center z-10">
        <motion.div
          className="text-3xl font-black leading-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color, fontFamily: "'Azeret Mono',monospace" }}
        >
          {value}
        </motion.div>
        <div className="text-[9px] font-black uppercase tracking-widest mt-1"
          style={{ color: `${color}80`, fontFamily: "'Azeret Mono',monospace" }}>
          %
        </div>
      </div>
    </div>
  );
}

/* ─── Result Stat Card ───────────────────────────────────────────────────── */
function ResultCard({ label, children, icon: Icon, delay = 0, accentColor = T.accent }: {
  label: string; children: React.ReactNode; icon?: any; delay?: number; accentColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className="relative rounded-2xl overflow-hidden p-5"
      style={{
        background: T.surface,
        border: `1px solid ${T.borderMid}`,
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 100% 60% at 0% 0%, ${accentColor}06, transparent)` }} />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
      {Icon && (
        <div className="flex items-center gap-2 mb-3">
          <Icon size={13} style={{ color: accentColor }} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ color: T.textMuted, fontFamily: "'Azeret Mono',monospace" }}>
            {label}
          </span>
        </div>
      )}
      {!Icon && (
        <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-3"
          style={{ color: T.textMuted, fontFamily: "'Azeret Mono',monospace" }}>
          {label}
        </p>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ─── Scan Overlay (plays during loading) ────────────────────────────────── */
function ScanOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl"
        >
          {/* Grid overlay */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(61,123,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(61,123,255,0.06) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }} />

          {/* Horizontal scan beam */}
          <motion.div
            className="absolute left-0 right-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${T.accent}80 20%, ${T.accentBright} 50%, ${T.accent}80 80%, transparent 100%)`,
              boxShadow: `0 0 20px ${T.accent}60, 0 0 40px ${T.accent}30`,
            }}
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Vertical scan beam */}
          <motion.div
            className="absolute top-0 bottom-0 w-[2px]"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${T.accent}40 30%, ${T.accentBright}50 50%, ${T.accent}40 70%, transparent 100%)`,
            }}
            initial={{ left: "0%" }}
            animate={{ left: ["0%", "100%", "0%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Corner brackets animate in */}
          <CornerBrackets color={T.accentBright} size={24} thickness={2} />

          {/* Status overlay */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(6,12,32,0.85)", border: `1px solid ${T.borderHi}`, backdropFilter: "blur(12px)" }}>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: T.accentBright }}
              />
              <span className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: T.accent, fontFamily: "'Azeret Mono',monospace" }}>
                Scanning…
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Drop Zone ──────────────────────────────────────────────────────────── */
function DropZone({
  preview, onFile, onClear, loading
}: {
  preview: string; onFile: (f: File) => void; onClear: () => void; loading: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  return (
    <div className="relative">
      {!preview ? (
        /* ── Empty drop zone ── */
        <label
          htmlFor={inputId}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="relative flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all duration-300 overflow-hidden"
          style={{
            minHeight: 260,
            background: dragging ? T.accentLo : "rgba(8,16,40,0.50)",
            border: `2px dashed ${dragging ? T.borderGlow : T.borderMid}`,
            boxShadow: dragging ? `0 0 40px ${T.accent}20, inset 0 0 40px ${T.accent}08` : "none",
          }}
        >
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              // Reset so re-selecting same file fires onChange
              e.target.value = "";
            }}
          />

          {/* Grid texture */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, ${T.accent}08 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }} />

          <AnimatePresence>
            {dragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${T.accent}10, transparent)` }}
              />
            )}
          </AnimatePresence>

          <CornerBrackets color={dragging ? T.accentBright : T.accent} size={20} thickness={dragging ? 2 : 1.5} />

          <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
            <motion.div
              animate={dragging ? { scale: 1.12, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: dragging ? T.accentMid : T.accentLo,
                border: `1px solid ${dragging ? T.borderGlow : T.borderMid}`,
                boxShadow: dragging ? `0 0 30px ${T.accent}30` : "none",
              }}
            >
              <Upload size={26} style={{ color: T.accent }} />
            </motion.div>
            <div>
              <p className="text-base font-bold text-white mb-1.5"
                style={{ fontFamily: "'Syne',sans-serif" }}>
                {dragging ? "Release to upload" : "Upload image for analysis"}
              </p>
              <p className="text-[11px]" style={{ color: T.textMuted }}>
                Drag & drop or click to browse · PNG, JPG, WEBP
              </p>
              <p className="text-[10px] mt-1.5" style={{ color: T.textMuted }}>
                Analyzed temporarily · never permanently stored
              </p>
            </div>
          </div>
        </label>
      ) : (
        /* ── Image preview ── */
        <div className="relative rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${T.borderMid}` }}>
          <ScanOverlay active={loading} />

          <img
            src={preview}
            alt="Upload preview"
            className="w-full object-cover transition-all duration-500"
            style={{
              maxHeight: 420,
              filter: loading ? "brightness(0.6) saturate(0.7)" : "brightness(1) saturate(1)",
            }}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(3,10,6,0.7) 0%, transparent 50%)" }} />

          {!loading && (
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={onClear}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "rgba(6,12,32,0.85)",
                  border: `1px solid ${T.borderMid}`,
                  backdropFilter: "blur(12px)",
                  color: T.text,
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          <CornerBrackets color={loading ? T.accentBright : T.accent} size={20} thickness={1.5} />
        </div>
      )}
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AIModerationLab() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    // Revoke previous blob URL to avoid leaks
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
  }, [preview]);

  const handleClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview("");
    setAnalysis(null);
  }, [preview]);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    try {
      setLoading(true);
      setAnalysis(null);
      const formData = new FormData();
      formData.append("image", image);
      const res = await fetch("/api/admin/ai-moderation-lab", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setAnalysis(data.analysis);
      // Scroll to results after paint
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [image]);

  const sev = analysis ? getSeverityConfig(analysis.severity) : null;

  return (
    <div className="min-h-screen relative" style={{ color: T.text }}>
      {/* Fonts + animations — all static, no hydration risk */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Azeret+Mono:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(61,123,255,0.25); border-radius: 99px; }
        @keyframes em-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        .em-pulse { animation: em-pulse 1.8s ease-in-out infinite; }
        @keyframes float-y { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-6px);} }
      `}</style>

      {/* ── Atmospheric background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -180, left: -120, width: 650, height: 650, borderRadius: "50%", background: "rgba(61,123,255,0.055)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -80, width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.04)", filter: "blur(100px)" }} />
        {/* Neural net dots */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(61,123,255,0.07) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }} />
        {/* Fine grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(61,123,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(61,123,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[9px] font-black uppercase tracking-[0.3em]"
              style={{ color: T.accent, fontFamily: "'Azeret Mono',monospace" }}>
              ◈ ADMIN TOOLS
            </span>
            <span style={{ color: T.textMuted, fontFamily: "'Azeret Mono',monospace", fontSize: 9 }}>/</span>
            <span className="text-[9px]" style={{ color: T.textMuted, fontFamily: "'Azeret Mono',monospace" }}>
              moderation-lab
            </span>
            <div className="flex-1 h-px ml-2"
              style={{ background: `linear-gradient(90deg, ${T.borderMid}, transparent)` }} />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: T.accentLo, border: `1px solid ${T.borderMid}` }}>
              <span className="w-1.5 h-1.5 rounded-full em-pulse" style={{ background: T.accent }} />
              <span className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: T.accent, fontFamily: "'Azeret Mono',monospace" }}>
                AI ONLINE
              </span>
            </div>
          </div>

          <div className="flex items-start gap-5">
            {/* Icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: T.accentLo, filter: "blur(16px)" }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, rgba(61,123,255,0.18) 0%, rgba(61,123,255,0.06) 100%)`,
                  border: `1px solid ${T.borderHi}`,
                  boxShadow: `0 8px 32px rgba(61,123,255,0.15), inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                <Cpu size={26} style={{ color: T.accent }} />
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-black tracking-tight text-white leading-none"
                style={{ fontFamily: "'Syne',sans-serif", letterSpacing: "-0.04em" }}>
                AI Moderation Lab
              </h1>
              <p className="text-sm mt-2 font-medium flex items-center gap-2"
                style={{ color: T.textMuted }}>
                <Activity size={12} style={{ color: T.accentDim }} />
                Forensic content analysis · powered by AI vision
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── UPLOAD PANEL ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderMid}`,
            backdropFilter: "blur(24px)",
            boxShadow: `0 24px 60px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Top accent */}
          <div className="h-px w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${T.accent}50, ${T.cyan}40, transparent)` }} />

          <div className="p-6 sm:p-8">
            {/* Panel label */}
            <div className="flex items-center gap-3 mb-6">
              <Scan size={15} style={{ color: T.accent }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: T.textMuted, fontFamily: "'Azeret Mono',monospace" }}>
                Image Input
              </span>
              <div className="flex-1 h-px" style={{ background: T.border }} />
              {image && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                  style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.borderMid}`, fontFamily: "'Azeret Mono',monospace" }}
                >
                  Ready
                </motion.span>
              )}
            </div>

            <DropZone
              preview={preview}
              onFile={handleFile}
              onClear={handleClear}
              loading={loading}
            />

            {/* Action row */}
            <AnimatePresence>
              {image && (
                <motion.div
                  initial={{ opacity: 0, y: 12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 8, height: 0 }}
                  className="mt-5 flex items-center gap-3 overflow-hidden"
                >
                  <motion.button
                    onClick={handleAnalyze}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all"
                    style={{
                      background: loading
                        ? "rgba(61,123,255,0.15)"
                        : `linear-gradient(135deg, rgba(61,123,255,0.30) 0%, rgba(61,123,255,0.18) 100%)`,
                      border: `1px solid ${loading ? T.borderMid : T.borderHi}`,
                      color: T.accentBright,
                      boxShadow: loading ? "none" : `0 8px 32px rgba(61,123,255,0.20), inset 0 1px 0 rgba(255,255,255,0.06)`,
                      fontFamily: "'Syne',sans-serif",
                      letterSpacing: "0.02em",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</>
                      : <><ShieldAlert size={16} /> Run Analysis</>
                    }
                  </motion.button>

                  {!loading && analysis && (
                    <motion.button
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => { handleClear(); }}
                      className="flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
                      style={{
                        border: `1px solid ${T.border}`,
                        color: T.textMuted,
                      }}
                    >
                      <RefreshCw size={14} /> New Image
                    </motion.button>
                  )}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-[11px]"
                      style={{ color: T.textMuted, fontFamily: "'Azeret Mono',monospace" }}
                    >
                      <span className="em-pulse">Running neural scan</span>
                      <span style={{ color: T.accent }}>•••</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── RESULTS ── */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 space-y-5"
            >
              {/* Results header */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: sev!.bg, border: `1px solid ${sev!.border}` }}>
                  <ImageIcon size={14} style={{ color: sev!.color }} />
                </div>
                <h2 className="text-xl font-black text-white"
                  style={{ fontFamily: "'Syne',sans-serif" }}>
                  Analysis Report
                </h2>
                <div className="flex-1 h-px" style={{ background: T.border }} />
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                  style={{
                    background: sev!.bg,
                    color: sev!.color,
                    border: `1px solid ${sev!.border}`,
                    fontFamily: "'Azeret Mono',monospace",
                    boxShadow: `0 0 12px ${sev!.glow}`,
                  }}>
                  {sev!.label}
                </span>
              </motion.div>

              {/* Top row: Explicit + Confidence + Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Explicit */}
                <ResultCard label="Explicit Content" icon={Target} delay={0.15}
                  accentColor={analysis.isExplicit ? T.rose : T.accent}>
                  <div className="flex items-center gap-3">
                    {analysis.isExplicit ? (
                      <>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: T.roseLo, border: `1px solid ${T.roseMid}` }}>
                          <AlertOctagon size={18} style={{ color: T.rose }} />
                        </div>
                        <div>
                          <p className="text-xl font-black" style={{ color: T.rose, fontFamily: "'Azeret Mono',monospace" }}>YES</p>
                          <p className="text-[10px] mt-0.5" style={{ color: `${T.rose}80` }}>Explicit detected</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: T.accentLo, border: `1px solid ${T.borderMid}` }}>
                          <CheckCircle2 size={18} style={{ color: T.accent }} />
                        </div>
                        <div>
                          <p className="text-xl font-black" style={{ color: T.accent, fontFamily: "'Azeret Mono',monospace" }}>CLEAN</p>
                          <p className="text-[10px] mt-0.5" style={{ color: T.textMuted }}>No explicit content</p>
                        </div>
                      </>
                    )}
                  </div>
                </ResultCard>

                {/* Confidence arc */}
                <ResultCard label="Confidence Score" icon={Activity} delay={0.2} accentColor={sev!.color}>
                  <div className="flex justify-center pt-1">
                    <ConfidenceArc value={analysis.confidence} color={sev!.color} />
                  </div>
                </ResultCard>

                {/* Severity */}
                <ResultCard label="Severity Level" icon={Zap} delay={0.25} accentColor={sev!.color}>
                  <div className="flex flex-col items-start gap-2 pt-1">
                    {/* Severity scale dots */}
                    <div className="flex items-center gap-1.5">
                      {(["none", "low", "medium", "high", "critical"] as SeverityLevel[]).map((lvl) => {
                        const lcfg = SEVERITY[lvl];
                        const isActive = lvl === analysis.severity.toLowerCase();
                        return (
                          <motion.div
                            key={lvl}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + (["none","low","medium","high","critical"].indexOf(lvl)) * 0.06 }}
                            className="rounded-full transition-all"
                            style={{
                              width: isActive ? 14 : 8,
                              height: isActive ? 14 : 8,
                              background: isActive ? lcfg.color : `${lcfg.color}30`,
                              boxShadow: isActive ? `0 0 10px ${lcfg.glow}` : "none",
                            }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-2xl font-black capitalize mt-1"
                      style={{ color: sev!.color, fontFamily: "'Syne',sans-serif" }}>
                      {analysis.severity}
                    </p>
                    <p className="text-[10px]" style={{ color: T.textMuted }}>
                      Risk classification level
                    </p>
                  </div>
                </ResultCard>
              </div>

              {/* Summary */}
              <ResultCard label="AI Summary" icon={Cpu} delay={0.3} accentColor={T.cyan}>
                <p className="text-sm leading-relaxed" style={{ color: T.text }}>
                  {analysis.summary}
                </p>
              </ResultCard>

              {/* Labels */}
              {analysis.labels && analysis.labels.length > 0 && (
                <ResultCard label="Detected Labels" icon={Tag} delay={0.35} accentColor={T.accent}>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {analysis.labels.map((label, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.04 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                        style={{
                          background: T.accentLo,
                          border: `1px solid ${T.borderMid}`,
                          color: T.accentBright,
                          fontFamily: "'Azeret Mono',monospace",
                        }}
                      >
                        <span style={{ color: T.accent, fontSize: 9 }}>◆</span>
                        {label}
                      </motion.span>
                    ))}
                  </div>
                </ResultCard>
              )}

              {/* Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45 }}
                className="relative rounded-2xl overflow-hidden p-5"
                style={{
                  background: analysis.isExplicit
                    ? `linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.04) 100%)`
                    : T.accentLo,
                  border: `1px solid ${analysis.isExplicit ? T.roseMid : T.borderMid}`,
                }}
              >
                {/* Top line */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, ${analysis.isExplicit ? T.rose : T.accent}60, transparent)` }} />

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: analysis.isExplicit ? T.roseLo : T.accentLo,
                      border: `1px solid ${analysis.isExplicit ? T.roseMid : T.borderMid}`,
                    }}>
                    <FileWarning size={16} style={{ color: analysis.isExplicit ? T.rose : T.accent }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                      style={{ color: analysis.isExplicit ? T.rose : T.accent, fontFamily: "'Azeret Mono',monospace" }}>
                      Recommendation
                    </p>
                    <p className="text-sm leading-relaxed"
                      style={{ color: analysis.isExplicit ? "#FECDD3" : T.text }}>
                      {analysis.recommendation}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}