"use client";

import { useEffect, useState, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Globe, Building2, Users, Loader2, ArrowRight,
  Calendar, Sparkles, Check, Search, X,
  TrendingUp, Clock, Compass,
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

  ember: "#F472B6",
  emberLo: "rgba(244,114,182,0.10)",
  emberMid: "rgba(244,114,182,0.20)",

  sage: "#34D399",
  sageLo: "rgba(52,211,153,0.10)",
  sageMid: "rgba(52,211,153,0.20)",

  sand: "#60A5FA",
  sandLo: "rgba(96,165,250,0.10)",

  text: "#E8F0FF",
  textDim: "#7A90B8",
  textMuted: "#2D3D5A",
  textGhost: "#111C2E",
} as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/* deterministic color from workspace name */
function getWorkspaceHue(name: string): number {
  return name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

/* ─── Skeleton Card ──────────────────────────────────────────────────────── */
function SkeletonCard({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="h-1 w-full shimmer-bar" />
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl shrink-0 shimmer" />
          <div className="flex-1 space-y-2.5 pt-1">
            <div className="h-5 w-3/5 rounded-xl shimmer" />
            <div className="h-3.5 w-2/5 rounded-lg shimmer" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded shimmer" />
          <div className="h-3 w-4/5 rounded shimmer" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-8 w-24 rounded-xl shimmer" />
          <div className="h-10 w-28 rounded-2xl shimmer" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Workspace Card ─────────────────────────────────────────────────────── */
function WorkspaceCard({
  ws, idx, isJoining, isJoined, onJoin,
}: {
  ws: any; idx: number; isJoining: boolean; isJoined: boolean; onJoin: () => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const name: string = ws.name ?? "Workspace";
  const initials = name.slice(0, 2).toUpperCase();
  const hue = getWorkspaceHue(name);

  const handleCardClick = useCallback(() => {
    if (isJoined) router.push(`/workspace/${ws._id}`);
  }, [isJoined, router, ws._id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: -12 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: idx < 8 ? idx * 0.055 : 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleCardClick}
      className={`group relative rounded-3xl overflow-hidden flex flex-col ${isJoined ? "cursor-pointer" : ""}`}
      style={{
        background: hovered ? T.surfaceMid : T.surface,
        border: `1px solid ${hovered ? T.borderHi : T.borderMid}`,
        backdropFilter: "blur(24px)",
        boxShadow: hovered
          ? `0 24px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px ${T.borderMid}, inset 0 1px 0 rgba(148,197,255,0.08)`
          : `0 4px 24px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(148,197,255,0.04)`,
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Animated top accent bar */}
      <motion.div
        className="h-px w-full"
        animate={{ opacity: hovered ? 1 : 0.4 }}
        style={{ background: `linear-gradient(90deg, transparent, ${T.ice}80, transparent)` }}
      />

      {/* Ambient hover bloom */}
      <div className="absolute top-0 right-0 w-48 h-48 -mr-16 -mt-16 rounded-full pointer-events-none transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${T.iceLo}, transparent)`, opacity: hovered ? 1 : 0, filter: "blur(40px)" }} />

      <div className="relative z-10 p-6 flex flex-col gap-5 flex-1">
        {/* Header: avatar + name */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {ws.avatar ? (
              <img
                src={ws.avatar}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover"
                style={{
                  border: `1px solid ${T.borderHi}`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
                }}
                onError={e => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=94C5FF&color=080C14&bold=true`;
                }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black"
                style={{
                  background: `hsla(${hue},45%,25%,0.6)`,
                  border: `1px solid hsla(${hue},45%,45%,0.30)`,
                  color: `hsl(${hue},55%,70%)`,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 hsla(${hue},45%,60%,0.15)`,
                }}
              >
                {initials}
              </div>
            )}
            {/* Status dot */}
            {isJoined && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: T.bg, border: `1.5px solid ${T.bg}` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: T.sage }} />
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-lg font-bold leading-snug truncate text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              {ws.memberCount !== undefined && (
                <span className="flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
                  <Users size={10} style={{ color: T.ice, opacity: 0.7 }} />
                  {ws.memberCount.toLocaleString()} {ws.memberCount === 1 ? "member" : "members"}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] font-medium"
                style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
                <Clock size={10} style={{ color: T.ice, opacity: 0.7 }} />
                {formatRelativeTime(ws.createdAt)}
              </span>
            </div>
          </div>

          {/* Public badge */}
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
              style={{
                background: T.iceLo,
                border: `1px solid ${T.borderMid}`,
                color: T.iceDim,
                fontFamily: "'JetBrains Mono',monospace",
              }}>
              <Globe size={8} />
              Public
            </span>
          </div>
        </div>

        {/* Description / placeholder */}
        {ws.description ? (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: T.textDim }}>
            {ws.description}
          </p>
        ) : (
          <p className="text-sm leading-relaxed italic" style={{ color: T.textMuted }}>
            An open workspace — join to explore.
          </p>
        )}

        {/* Member stack */}
        {ws.recentMembers?.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {ws.recentMembers.slice(0, 4).map((m: any, i: number) => (
                <div key={i} className="w-6 h-6 rounded-full overflow-hidden"
                  style={{ border: `1.5px solid ${T.bg}`, zIndex: 4 - i }}>
                  <img src={m.avatar} alt="" className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = "none"; }} />
                </div>
              ))}
            </div>
            <span className="text-[10px]" style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
              {ws.memberCount > 4 ? `+${ws.memberCount - 4} more` : "Active"}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full mt-auto" style={{ background: T.border }} />

        {/* Footer: tags + action */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {ws.tags?.slice(0, 2).map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest"
                style={{ background: T.iceLo, color: T.ice, border: `1px solid rgba(148,197,255,0.15)`, fontFamily: "'JetBrains Mono',monospace" }}>
                {tag}
              </span>
            ))}
          </div>

          {isJoined ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider"
              style={{
                background: T.sageLo,
                border: `1px solid ${T.sageMid}`,
                color: T.sage,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              <Check size={13} strokeWidth={2.5} />
              Joined
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={e => { e.stopPropagation(); onJoin(); }}
              disabled={isJoining}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hovered
                  ? `linear-gradient(135deg, ${T.ice}, #60A5FA)`
                  : `linear-gradient(135deg, rgba(148,197,255,0.20), rgba(148,197,255,0.08))`,
                border: `1px solid ${hovered ? T.borderGlow : T.borderHi}`,
                color: hovered ? T.bgDeep : T.ice,
                fontFamily: "'JetBrains Mono',monospace",
                boxShadow: hovered ? `0 4px 24px ${T.iceGlow}` : "none",
                transition: "all 0.2s ease",
              }}
            >
              {isJoining ? (
                <><Loader2 size={12} className="animate-spin" /> Joining</>
              ) : (
                <>Join <ArrowRight size={12} /></>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Search Bar ─────────────────────────────────────────────────────────── */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  const inputId = useId();

  return (
    <div className="relative w-full sm:w-72">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
        style={{ color: focused ? T.ice : T.textMuted }} />
      <input
        id={inputId}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search workspaces…"
        className="w-full pl-9 pr-9 py-2.5 rounded-2xl text-sm outline-none transition-all duration-250"
        style={{
          background: focused ? T.surfaceMid : T.surface,
          border: `1px solid ${focused ? T.borderGlow : T.borderMid}`,
          color: T.text,
          backdropFilter: "blur(16px)",
          boxShadow: focused ? `0 0 0 3px ${T.iceMid}` : "none",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 12,
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

/* ─── Sort Tabs ──────────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { key: "newest",  label: "Newest",  Icon: Clock      },
  { key: "popular", label: "Popular", Icon: TrendingUp },
  { key: "all",     label: "All",     Icon: Compass    },
] as const;
type SortKey = typeof SORT_OPTIONS[number]["key"];

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function BrowseClient() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [userWorkspaceIds, setUserWorkspaceIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [browseRes, myRes] = await Promise.all([
          fetch("/api/workspace/browse"),
          fetch("/api/workspace/my"),
        ]);
        const [browseData, myData] = await Promise.all([browseRes.json(), myRes.json()]);
        if (browseRes.ok) setWorkspaces(browseData.workspaces ?? []);
        if (myRes.ok) {
          setUserWorkspaceIds(new Set<string>(myData.workspaces.map((ws: any) => ws._id as string)));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const joinWorkspace = useCallback(async (id: string) => {
    if (userWorkspaceIds.has(id)) return;
    setJoiningId(id);
    try {
      const res = await fetch("/api/workspace/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/workspace/${id}`);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJoiningId(null);
    }
  }, [userWorkspaceIds, router]);

  const filtered = workspaces
    .filter(ws =>
      !search ||
      (ws.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (ws.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "popular") return (b.memberCount ?? 0) - (a.memberCount ?? 0);
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::selection { background: rgba(148,197,255,0.25); color: #E8F0FF; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,197,255,0.18); border-radius: 99px; }
        @keyframes shimmer-kf { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .shimmer { position: relative; overflow: hidden; border-radius: 10px; background: rgba(148,197,255,0.04); }
        .shimmer::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(148,197,255,0.06),transparent); animation: shimmer-kf 1.8s infinite; }
        .shimmer-bar { background: linear-gradient(90deg, transparent, rgba(148,197,255,0.15), transparent); background-size: 200% 100%; animation: shimmer-kf 2s infinite; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* ── Atmospheric background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden>
        <div style={{ position:"absolute", top:-200, left:-100, width:700, height:700, borderRadius:"50%", background:"rgba(148,197,255,0.04)", filter:"blur(130px)" }} />
        <div style={{ position:"absolute", bottom:-150, right:-120, width:600, height:600, borderRadius:"50%", background:"rgba(96,165,250,0.03)", filter:"blur(110px)" }} />
        {/* Dot matrix */}
        <div style={{ position:"absolute", inset:0, backgroundImage:`radial-gradient(circle, rgba(148,197,255,0.04) 1px, transparent 1px)`, backgroundSize:"44px 44px" }} />
        {/* Fine grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${T.textGhost} 1px,transparent 1px),linear-gradient(90deg,${T.textGhost} 1px,transparent 1px)`, backgroundSize:"44px 44px", opacity:0.8 }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-24">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="flex items-center gap-2.5 mb-5"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: T.iceLo, border: `1px solid ${T.borderMid}` }}>
              <Compass size={10} style={{ color: T.ice }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]"
                style={{ color: T.ice, fontFamily: "'JetBrains Mono',monospace" }}>
                Community Directory
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-7">
            {/* Title block */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{ background: T.iceLo, filter: "blur(16px)" }} />
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, rgba(148,197,255,0.15) 0%, rgba(148,197,255,0.05) 100%)`,
                    border: `1px solid ${T.borderHi}`,
                    boxShadow: `0 8px 32px rgba(148,197,255,0.10), inset 0 1px 0 rgba(255,255,255,0.08)`,
                  }}>
                  <Globe size={26} style={{ color: T.ice }} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white leading-none"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.03em" }}>
                  Browse Workspaces
                </h1>
                <p className="text-sm mt-1.5 font-medium" style={{ color: T.textDim }}>
                  Discover and join open communities
                </p>
              </div>
            </div>

            {/* Stats + controls */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {/* Stats pill */}
                {workspaces.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                    style={{ background: T.surface, border: `1px solid ${T.borderMid}`, backdropFilter: "blur(16px)" }}>
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black leading-none"
                        style={{ color: T.ice, fontFamily: "'JetBrains Mono',monospace" }}>
                        {workspaces.length}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest mt-0.5"
                        style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                        Spaces
                      </span>
                    </div>
                    <div className="w-px h-8" style={{ background: T.border }} />
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black leading-none"
                        style={{ color: T.sage, fontFamily: "'JetBrains Mono',monospace" }}>
                        {userWorkspaceIds.size}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest mt-0.5"
                        style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                        Joined
                      </span>
                    </div>
                  </div>
                )}

                <SearchBar value={search} onChange={setSearch} />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── SORT TABS ── */}
        {!loading && workspaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="flex items-center gap-2 mb-7"
          >
            <div className="flex items-center gap-1 p-1 rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
              {SORT_OPTIONS.map(({ key, label, Icon }) => {
                const isActive = sort === key;
                return (
                  <motion.button
                    key={key}
                    onClick={() => setSort(key)}
                    whileTap={{ scale: 0.94 }}
                    className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors duration-200"
                    style={{
                      color: isActive ? T.ice : T.textMuted,
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sort-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: T.iceLo, border: `1px solid ${T.borderHi}` }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon size={11} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {search && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="text-[11px]"
                  style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}
                >
                  <span style={{ color: T.ice }}>{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && workspaces.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6 py-28 text-center rounded-[2rem] relative overflow-hidden"
            style={{
              background: T.surface,
              border: `1px dashed ${T.borderHi}`,
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Ambient */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${T.iceLo}, transparent)` }} />
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${T.ice}40, transparent)` }} />

            <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: T.iceLo, border: `1px solid ${T.borderHi}` }}>
              <Building2 size={34} style={{ color: T.iceDim }} />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.03em" }}>
                No public workspaces yet
              </h3>
              <p className="text-sm max-w-sm" style={{ color: T.textDim }}>
                No communities are open right now. Be the first to build one.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/dashboard/create")}
              className="relative z-10 flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm transition-all"
              style={{
                background: `linear-gradient(135deg, ${T.ice}, #60A5FA)`,
                color: T.bgDeep,
                boxShadow: `0 8px 32px ${T.iceGlow}`,
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: "0.04em",
              }}
            >
              <Sparkles size={15} />
              Create a Workspace
              <ArrowRight size={15} />
            </motion.button>
          </motion.div>
        )}

        {/* ── NO SEARCH RESULTS ── */}
        {!loading && workspaces.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center rounded-3xl"
            style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}
          >
            <Search size={28} style={{ color: T.textMuted }} />
            <div>
              <p className="text-base font-bold text-white mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.02em" }}>
                No matches found
              </p>
              <p className="text-sm" style={{ color: T.textDim }}>
                Nothing matching "<span style={{ color: T.text }}>{search}</span>"
              </p>
            </div>
            <button onClick={() => setSearch("")}
              className="text-xs px-4 py-2 rounded-xl transition-colors hover:bg-white/5"
              style={{ color: T.ice, border: `1px solid ${T.borderMid}`, fontFamily: "'JetBrains Mono',monospace" }}>
              Clear search
            </button>
          </motion.div>
        )}

        {/* ── GRID ── */}
        {!loading && filtered.length > 0 && (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((ws, idx) => (
                <WorkspaceCard
                  key={ws._id}
                  ws={ws}
                  idx={idx}
                  isJoining={joiningId === ws._id}
                  isJoined={userWorkspaceIds.has(ws._id)}
                  onJoin={() => joinWorkspace(ws._id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}