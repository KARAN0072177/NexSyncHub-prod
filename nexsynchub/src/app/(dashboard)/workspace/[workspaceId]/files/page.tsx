"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Search, FileText, ImageIcon, Video, Download,
  Calendar, Hash, X, Play, Eye, File,
  Grid3X3, LayoutList, Layers, Clock,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

/* ─── Design Tokens ── Digital Archive / Content Vault ──────────────────── */
const T = {
  bg: "#080C14",
  bgDeep: "#04070E",
  surface: "rgba(10,16,28,0.82)",
  surfaceMid: "rgba(13,20,36,0.88)",
  surfaceHi: "rgba(16,24,44,0.92)",
  panel: "rgba(8,14,24,0.75)",

  border: "rgba(148,197,255,0.07)",
  borderMid: "rgba(148,197,255,0.13)",
  borderHi: "rgba(148,197,255,0.24)",
  borderGlow: "rgba(148,197,255,0.45)",

  ice: "#94C5FF",
  iceBright: "#BDD9FF",
  iceDim: "rgba(148,197,255,0.55)",
  iceLo: "rgba(148,197,255,0.07)",
  iceMid: "rgba(148,197,255,0.14)",
  iceGlow: "rgba(148,197,255,0.25)",

  // file-type accents
  image:  { color: "#34D399", lo: "rgba(52,211,153,0.09)",  mid: "rgba(52,211,153,0.20)",  glow: "rgba(52,211,153,0.30)"  },
  video:  { color: "#F472B6", lo: "rgba(244,114,182,0.09)", mid: "rgba(244,114,182,0.20)", glow: "rgba(244,114,182,0.30)" },
  file:   { color: "#60A5FA", lo: "rgba(96,165,250,0.09)",  mid: "rgba(96,165,250,0.20)",  glow: "rgba(96,165,250,0.30)"  },

  text: "#E8F0FF",
  textDim: "#7A90B8",
  textMuted: "#2D3D5A",
  textGhost: "#111C2E",
} as const;

type FileType = "image" | "video" | "file";

interface WorkspaceFile {
  id: string;
  key: string;
  type: FileType;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: { username: string; avatar: string };
  channel: { name: string };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const FILE_TYPE_CFG = {
  image: { label: "Image", Icon: ImageIcon, ...T.image },
  video: { label: "Video", Icon: Video,     ...T.video },
  file:  { label: "Doc",   Icon: FileText,  ...T.file  },
} as const;

/* ─── Skeleton Card ──────────────────────────────────────────────────────── */
function SkeletonCard({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="aspect-video w-full relative overflow-hidden"
        style={{ background: "rgba(148,197,255,0.03)" }}>
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="p-5 space-y-4">
        <div className="flex gap-3 items-start">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded-lg shimmer" />
            <div className="h-3 w-1/4 rounded-lg shimmer" />
          </div>
          <div className="w-8 h-8 rounded-xl shimmer shrink-0" />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <div className="w-9 h-9 rounded-xl shrink-0 shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded-lg shimmer" />
            <div className="h-2.5 w-1/4 rounded-lg shimmer" />
          </div>
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-3 w-2/5 rounded-lg shimmer" />
          <div className="h-3 w-1/2 rounded-lg shimmer" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 h-11 rounded-2xl shimmer" />
          <div className="w-11 h-11 rounded-2xl shimmer shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── File Preview Tile ──────────────────────────────────────────────────── */
function FilePreview({ file, type }: { file: WorkspaceFile; type: FileType }) {
  const cfg = FILE_TYPE_CFG[type];
  const [imgError, setImgError] = useState(false);

  if (type === "image" && !imgError) {
    return (
      <img
        src={file.url}
        alt={file.name}
        className="w-full h-full object-cover transition-transform duration-700 ease-out"
        onError={() => setImgError(true)}
        style={{ willChange: "transform" }}
      />
    );
  }

  if (type === "video") {
    return (
      <>
        <video
          src={file.url}
          className="w-full h-full object-cover opacity-70"
          preload="metadata"
          muted
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(244,114,182,0.20)",
              border: `1px solid rgba(244,114,182,0.40)`,
              backdropFilter: "blur(8px)",
            }}>
            <Play size={18} style={{ color: cfg.color, marginLeft: 2 }} />
          </div>
        </div>
      </>
    );
  }

  // Generic file icon
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 relative"
      style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${cfg.lo}, transparent)` }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: cfg.lo, border: `1px solid ${cfg.mid}` }}>
        <cfg.Icon size={26} style={{ color: cfg.color }} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-lg"
        style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.mid}`, fontFamily: "'JetBrains Mono',monospace" }}>
        .{ext}
      </span>
    </div>
  );
}

/* ─── File Card ──────────────────────────────────────────────────────────── */
function FileCard({ file, idx }: { file: WorkspaceFile; idx: number }) {
  const cfg = FILE_TYPE_CFG[file.type];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -12 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: idx < 12 ? idx * 0.04 : 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: hovered ? T.surfaceMid : T.surface,
        border: `1px solid ${hovered ? T.borderHi : T.borderMid}`,
        backdropFilter: "blur(24px)",
        boxShadow: hovered
          ? `0 20px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px ${T.borderMid}, inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 4px 24px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* ── Preview area ── */}
      <div className="relative aspect-video overflow-hidden shrink-0"
        style={{ background: T.bgDeep }}>
        <FilePreview file={file} type={file.type} />

        {/* Hover overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center gap-3 z-10"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: "rgba(4,7,14,0.65)", backdropFilter: "blur(4px)" }}
        >
          <motion.a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={e => e.stopPropagation()}
            className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff" }}
          >
            <Eye size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">View</span>
          </motion.a>
          <motion.a
            href={file.url}
            download
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={e => e.stopPropagation()}
            className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl"
            style={{
              background: cfg.lo,
              border: `1px solid ${cfg.mid}`,
              color: cfg.color,
              boxShadow: `0 4px 20px ${cfg.glow}`,
            }}
          >
            <Download size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Save</span>
          </motion.a>
        </motion.div>

        {/* Type badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest"
            style={{
              background: cfg.lo,
              border: `1px solid ${cfg.mid}`,
              color: cfg.color,
              backdropFilter: "blur(12px)",
              boxShadow: `0 2px 12px ${cfg.glow}`,
              fontFamily: "'JetBrains Mono',monospace",
            }}>
            <cfg.Icon size={10} />
            {cfg.label}
          </span>
        </div>

        {/* Size badge */}
        <div className="absolute top-3 right-3 z-20">
          <span className="text-[9px] px-2 py-1 rounded-lg"
            style={{
              background: "rgba(4,7,14,0.75)",
              color: T.textDim,
              border: `1px solid ${T.border}`,
              backdropFilter: "blur(8px)",
              fontFamily: "'JetBrains Mono',monospace",
            }}>
            {formatSize(file.size)}
          </span>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(4,7,14,0.8), transparent)" }} />
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* File name + icon */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-snug break-all"
              style={{ color: T.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {file.name}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: cfg.lo, border: `1px solid ${cfg.mid}` }}>
            <cfg.Icon size={14} style={{ color: cfg.color }} />
          </div>
        </div>

        {/* Uploader */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}` }}>
          {file.uploadedBy.avatar ? (
            <img
              src={file.uploadedBy.avatar}
              alt={file.uploadedBy.username}
              className="w-8 h-8 rounded-xl object-cover shrink-0"
              style={{ border: `1px solid ${T.borderMid}` }}
            />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
              style={{ background: T.iceLo, border: `1px solid ${T.borderMid}`, color: T.ice, fontFamily: "'JetBrains Mono',monospace" }}>
              {file.uploadedBy.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: T.text }}>
              {file.uploadedBy.username}
            </p>
            <p className="text-[10px]" style={{ color: T.textMuted }}>Uploaded by</p>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]"
            style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
          <Hash size={11} style={{ color: T.ice, opacity: 0.6, flexShrink: 0 }} />
            <span className="truncate">{file.channel.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]"
            style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
          <Calendar size={11} style={{ color: T.ice, opacity: 0.6, flexShrink: 0 }} />
            <span>{formatDate(file.uploadedAt)}</span>
            <span className="ml-1 opacity-50">{formatTime(file.uploadedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-auto pt-1">
          <motion.a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
            style={{
              background: `linear-gradient(135deg, ${cfg.lo}, rgba(255,255,255,0.04))`,
              border: `1px solid ${cfg.mid}`,
              color: cfg.color,
              fontFamily: "'JetBrains Mono',monospace",
              boxShadow: `0 4px 20px ${cfg.glow}`,
            }}
          >
            <Eye size={13} />
            Open
          </motion.a>
          <motion.a
            href={file.url}
            download
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.94 }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: "rgba(148,197,255,0.06)",
              border: `1px solid ${T.borderMid}`,
              color: T.iceDim,
            }}
          >
            <Download size={15} />
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── List Row ───────────────────────────────────────────────────────────── */
function FileRow({ file, idx }: { file: WorkspaceFile; idx: number }) {
  const cfg = FILE_TYPE_CFG[file.type];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: idx < 12 ? idx * 0.03 : 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200"
      style={{
        background: hovered ? T.surfaceMid : "transparent",
        border: `1px solid ${hovered ? T.borderMid : "transparent"}`,
      }}
    >
      {/* Thumbnail / icon */}
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
        style={{ background: T.bgDeep, border: `1px solid ${T.border}` }}>
        {file.type === "image" ? (
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: cfg.lo }}>
            <cfg.Icon size={18} style={{ color: cfg.color }} />
          </div>
        )}
      </div>

      {/* Name + channel */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: T.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {file.name}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] flex items-center gap-1" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
            <Hash size={9} />
            {file.channel.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md"
            style={{ background: cfg.lo, color: cfg.color, border: `1px solid ${cfg.mid}`, fontFamily: "'JetBrains Mono',monospace" }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Uploader */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {file.uploadedBy.avatar ? (
          <img src={file.uploadedBy.avatar} alt="" className="w-6 h-6 rounded-lg object-cover"
            style={{ border: `1px solid ${T.border}` }} />
        ) : (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black"
            style={{ background: T.iceLo, color: T.ice }}>
            {file.uploadedBy.username[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-xs" style={{ color: T.textDim }}>{file.uploadedBy.username}</span>
      </div>

      {/* Date */}
      <div className="hidden md:block shrink-0 text-[11px] text-right"
        style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
        <div>{formatDate(file.uploadedAt)}</div>
        <div style={{ color: T.textMuted }}>{formatSize(file.size)}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <a href={file.url} target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: cfg.lo, border: `1px solid ${cfg.mid}`, color: cfg.color }}>
          <Eye size={13} />
        </a>
        <a href={file.url} download
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: T.iceLo, border: `1px solid ${T.borderMid}`, color: T.iceDim }}>
          <Download size={13} />
        </a>
      </div>
    </motion.div>
  );
}

/* ─── Search Bar ─────────────────────────────────────────────────────────── */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: focused ? T.ice : T.textMuted }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search files, channels…"
        className="w-full pl-9 pr-9 py-2.5 rounded-2xl text-sm outline-none transition-all duration-250"
        style={{
          background: focused ? T.surfaceMid : T.surface,
          border: `1px solid ${focused ? T.borderGlow : T.borderMid}`,
          color: T.text,
          backdropFilter: "blur(16px)",
          boxShadow: focused ? `0 0 0 3px ${T.iceMid}` : "none",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontSize: 13,
        }}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
            style={{ color: T.textMuted }}
          >
            <X size={11} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
const TABS = ["all", "image", "video", "file"] as const;
type TabKey = typeof TABS[number];
type ViewMode = "grid" | "list";

export default function WorkspaceFilesPage() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/files`);
        const data = await res.json();
        if (res.ok) setFiles(data.files);
        else alert(data.error);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [workspaceId]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchTab = activeTab === "all" || f.type === activeTab;
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.channel.name.toLowerCase().includes(search.toLowerCase()) ||
        f.uploadedBy.username.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [files, activeTab, search]);

  const counts = useMemo(() => ({
    all: files.length,
    image: files.filter(f => f.type === "image").length,
    video: files.filter(f => f.type === "video").length,
    file: files.filter(f => f.type === "file").length,
  }), [files]);

  const totalSize = useMemo(() =>
    files.reduce((acc, f) => acc + f.size, 0), [files]);

  return (
    <div className="h-full overflow-y-auto relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,197,255,0.18); border-radius: 99px; }
        @keyframes shimmer-kf { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .shimmer { position: relative; overflow: hidden; border-radius: 8px; background: rgba(148,197,255,0.04); }
        .shimmer::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(148,197,255,0.06),transparent); animation: shimmer-kf 1.8s infinite; }
      `}</style>

      {/* ── Atmospheric BG ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden>
        <div style={{ position:"absolute",top:-200,right:-100,width:700,height:700,borderRadius:"50%",background:"rgba(148,197,255,0.04)",filter:"blur(120px)" }} />
        <div style={{ position:"absolute",bottom:-100,left:-150,width:600,height:600,borderRadius:"50%",background:"rgba(96,165,250,0.03)",filter:"blur(100px)" }} />
        <div style={{ position:"absolute",inset:0,backgroundImage:`radial-gradient(circle, rgba(148,197,255,0.04) 1px, transparent 1px)`,backgroundSize:"40px 40px" }} />
        <div style={{ position:"absolute",inset:0,backgroundImage:`linear-gradient(${T.textGhost} 1px,transparent 1px),linear-gradient(90deg,${T.textGhost} 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:0.6 }} />
      </div>

      <div className="relative z-10 px-5 sm:px-7 lg:px-10 pt-8 pb-24">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: T.iceLo, border: `1px solid ${T.borderMid}` }}>
              <Layers size={10} style={{ color: T.ice }} />
              <span className="text-[9px] font-black uppercase tracking-[0.25em]"
                style={{ color: T.ice, fontFamily: "'JetBrains Mono',monospace" }}>
                Content Vault
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            {/* Title + meta */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{ background: T.iceLo, filter: "blur(12px)" }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, rgba(148,197,255,0.15) 0%, rgba(148,197,255,0.05) 100%)`,
                    border: `1px solid ${T.borderHi}`,
                    boxShadow: `0 8px 32px rgba(148,197,255,0.10), inset 0 1px 0 rgba(255,255,255,0.08)`,
                  }}>
                  <File size={24} style={{ color: T.ice }} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.03em" }}>
                  Workspace Files
                </h1>
                <p className="text-sm mt-1 font-medium" style={{ color: T.textDim }}>
                  All uploads, media & attachments
                </p>
              </div>
            </div>

            {/* Stats row */}
            {!loading && files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 flex-wrap"
              >
                {[
                  { label: "Files", value: files.length, color: T.ice },
                  { label: "Images", value: counts.image, color: T.image.color },
                  { label: "Videos", value: counts.video, color: T.video.color },
                  { label: "Storage", value: formatSize(totalSize), color: T.file.color },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-center px-4 py-2 rounded-2xl"
                    style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                    <span className="text-sm font-black leading-none"
                      style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>
                      {value}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                      style={{ color: T.textMuted }}>
                      {label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── CONTROLS ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
        >
          {/* Search */}
          <div className="flex-1 max-w-sm">
            <SearchBar value={search} onChange={v => { setSearch(v); }} />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-0.5 p-1 rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              const cfg = tab === "all" ? null : FILE_TYPE_CFG[tab];
              const color = cfg?.color ?? T.ice;
              return (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200 whitespace-nowrap"
                  style={{
                    color: isActive ? color : T.textMuted,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="file-tab-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab === "all" ? "All" : cfg!.label}
                    <span className="opacity-60 text-[8px]">{counts[tab]}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
            {([
              { key: "grid" as ViewMode, Icon: Grid3X3 },
              { key: "list" as ViewMode, Icon: LayoutList },
            ]).map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  background: viewMode === key ? T.iceMid : "transparent",
                  border: viewMode === key ? `1px solid ${T.borderHi}` : "1px solid transparent",
                  color: viewMode === key ? T.ice : T.textMuted,
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Result count */}
        <AnimatePresence>
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex items-center justify-between"
            >
              <p className="text-[10px]" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                <span style={{ color: T.ice }}>{filteredFiles.length}</span> result{filteredFiles.length !== 1 ? "s" : ""}
                {search && <span> for "<span style={{ color: T.text }}>{search}</span>"</span>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LOADING ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && filteredFiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 py-28 text-center rounded-3xl relative overflow-hidden"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}
          >
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: T.iceLo, border: `1px solid ${T.borderMid}` }}>
              <File size={28} style={{ color: T.ice }} />
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                No files found
              </p>
              <p className="text-sm" style={{ color: T.textDim }}>
                {search ? `Nothing matching "${search}"` : "No uploads in this workspace yet"}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── GRID / LIST ── */}
        {!loading && filteredFiles.length > 0 && (
          <>
            {viewMode === "grid" ? (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredFiles.map((file, idx) => (
                    <FileCard key={file.id} file={file} idx={idx} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="rounded-3xl overflow-hidden"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.borderMid}`,
                  backdropFilter: "blur(24px)",
                  boxShadow: `0 16px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}
              >
                {/* List header */}
                <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.ice}40, transparent)` }} />
                <div className="px-4 py-3 grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 hidden md:grid"
                  style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(4,7,14,0.40)" }}>
                  {["File", "Type", "Uploader", "Date"].map(h => (
                    <span key={h} className="text-[9px] font-black uppercase tracking-[0.2em]"
                      style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                      {h}
                    </span>
                  ))}
                </div>

                <div className="p-2">
                  <AnimatePresence mode="popLayout">
                    {filteredFiles.map((file, idx) => (
                      <FileRow key={file.id} file={file} idx={idx} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${T.border}`, background: "rgba(4,7,14,0.35)" }}>
                  <span className="text-[10px]" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                    {filteredFiles.length} files · {formatSize(filteredFiles.reduce((a, f) => a + f.size, 0))}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full" style={{ background: T.image.color }} />
                    <span className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color: T.image.color, fontFamily: "'JetBrains Mono',monospace" }}>
                      Vault Active
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}