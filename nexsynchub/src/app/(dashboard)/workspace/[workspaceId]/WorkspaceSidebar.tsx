// File: WorkspaceSidebar.tsx
// Workspace Sidebar - shows channels and workspace navigation links


"use client";

import { useEffect, useState } from "react";

import {
    useRouter,
    usePathname,
    useSearchParams,
} from "next/navigation";

import {
    Hash,
    Plus,
    Users,
    CheckSquare,
    Settings,
    X,
    Loader2,
    Globe,
    Home,
    Folder,
} from "lucide-react";

import UserMenu from "@/components/layout/UserMenu";
import { motion, AnimatePresence } from "framer-motion";

/* ─── design tokens ──────────────────────────────────────────────────────── */
const T = {
    accent:   "#3B82F6",
    accentLo: "rgba(59,130,246,0.12)",
    accentMd: "rgba(59,130,246,0.25)",
    surface:  "rgba(15,23,42,0.60)",
    border:   "rgba(255,255,255,0.06)",
    borderHi: "rgba(255,255,255,0.12)",
    text:     "#F8FAFC",
    muted:    "#94A3B8",
};

export default function WorkspaceSidebar({
    workspaceId,
    role,
}: {
    workspaceId: string;
    role: string;
}) {

    const [channels, setChannels] =
        useState<any[]>([]);

    const [unreadCounts, setUnreadCounts] =
        useState<Record<string, number>>({});

    const [showModal, setShowModal] =
        useState(false);

    const [channelName, setChannelName] =
        useState("");

    const [isCreating, setIsCreating] =
        useState(false);

    const [workspace, setWorkspace] =
        useState<any>(null);

    const pathname = usePathname();

    const router = useRouter();

    const searchParams =
        useSearchParams();

    const activeChannelId =
        searchParams.get("channel");

    // 🔥 Fetch channels
    useEffect(() => {

        const fetchChannels =
            async () => {

                const res = await fetch(
                    `/api/channel/list?workspaceId=${workspaceId}`
                );

                const data =
                    await res.json();

                if (res.ok) {
                    setChannels(data.channels);
                }

                // 🔥 Fetch unread counts
                const unreadRes = await fetch(
                    `/api/channel/unread-counts?workspaceId=${workspaceId}`
                );

                const unreadData =
                    await unreadRes.json();

                if (unreadRes.ok) {
                    setUnreadCounts(
                        unreadData.unreadCounts
                    );
                }

                // 🔥 Fetch workspace details
                const wsRes = await fetch(
                    `/api/workspace/${workspaceId}`
                );
                if (wsRes.ok) {
                    const wsData = await wsRes.json();
                    setWorkspace(wsData.workspace);
                }

            };

        fetchChannels();

    }, [workspaceId]);

    // 🔥 Listen for read updates
    useEffect(() => {

        const handler =
            (event: any) => {

                const channelId =
                    event.detail.channelId;

                setUnreadCounts(
                    (prev) => ({
                        ...prev,
                        [channelId]: 0,
                    })
                );

            };

        window.addEventListener(
            "channel-read",
            handler
        );

        return () => {

            window.removeEventListener(
                "channel-read",
                handler
            );

        };

    }, []);

    // 🔥 Listen for unread increments
    useEffect(() => {

        const handler =
            (event: any) => {

                const channelId =
                    event.detail.channelId;

                setUnreadCounts(
                    (prev) => ({

                        ...prev,

                        [channelId]:
                            (prev[channelId] || 0) + 1,

                    })
                );

            };

        window.addEventListener(
            "channel-unread",
            handler
        );

        return () => {

            window.removeEventListener(
                "channel-unread",
                handler
            );

        };

    }, []);

    // 🔥 Create channel
    const createChannel =
        async () => {

            if (!channelName.trim()) return;

            setIsCreating(true);

            const res = await fetch(
                "/api/channel/create",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        name: channelName,
                        workspaceId,
                    }),
                }
            );

            const data =
                await res.json();

            if (res.ok) {

                setChannels((prev) => [
                    ...prev,
                    data.channel,
                ]);

                setChannelName("");

                setShowModal(false);

            } else {

                alert(data.error);

            }

            setIsCreating(false);

        };

    return (

        <>
            {/* Sidebar */}
            <div
                className="w-[280px] flex-shrink-0 flex flex-col relative z-20"
                style={{
                    background: "rgba(3,7,18,0.65)",
                    borderRight: `1px solid ${T.border}`,
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    fontFamily: "'DM Sans', sans-serif"
                }}
            >

                {/* Header */}
                <div className="p-5" style={{ borderBottom: `1px solid ${T.borderHi}` }}>

                    <div className="flex items-center justify-between mb-1 gap-2">

                        <div className="flex items-center gap-2.5 min-w-0">
                            {workspace?.avatar ? (
                                <img 
                                    src={workspace.avatar} 
                                    alt="Workspace" 
                                    className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm" 
                                    style={{ border: `1px solid ${T.borderHi}` }} 
                                />
                            ) : (
                                <div 
                                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm" 
                                    style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}
                                >
                                    <span className="text-sm font-bold" style={{ color: T.accent }}>
                                        {workspace?.name?.charAt(0)?.toUpperCase() || "W"}
                                    </span>
                                </div>
                            )}
                            <h1
                                className="font-bold text-white truncate text-lg tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}
                            >
                                {workspace?.name || "Workspace"}
                            </h1>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">

                            <button
                                onClick={() =>
                                    router.push(
                                        "/dashboard/browse"
                                    )
                                }
                                className="p-2 rounded-xl transition-all hover:bg-white/5 cursor-pointer" style={{ color: T.muted }}
                            >
                                <Globe size={16} />
                            </button>

                            <button
                                className="p-2 rounded-xl transition-all hover:bg-white/5 cursor-pointer" style={{ color: T.muted }}
                            >
                                <Settings size={16} />
                            </button>

                        </div>

                    </div>

                    <div className="inline-flex items-center gap-1.5 mt-2.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.muted }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${role === 'admin' ? 'bg-blue-400' : 'bg-emerald-400'}`} style={{ boxShadow: `0 0 8px ${role === 'admin' ? T.accent : '#10B981'}` }} />
                        {role === "admin" ? "Admin" : "Member"}
                    </div>

                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                >
                    <style>{`
                        ::-webkit-scrollbar { width:4px; }
                        ::-webkit-scrollbar-track { background:transparent; }
                        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
                    `}</style>

                    {/* Channels */}
                    <div>

                        <div
                            className="flex items-center justify-between mb-3 px-2"
                        >

                            <h2
                                className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}
                            >
                                Channels
                            </h2>

                            <button
                                onClick={() =>
                                    setShowModal(true)
                                }
                                className="p-1.5 rounded-lg transition-all hover:bg-white/5 cursor-pointer" style={{ color: T.muted }}
                            >
                                <Plus size={15} />
                            </button>

                        </div>

                        <div className="space-y-1">

                            {channels.map((ch) => {

                                const isActive =
                                    activeChannelId ===
                                    ch._id ||

                                    (
                                        !activeChannelId &&
                                        channels[0]?._id ===
                                        ch._id &&
                                        pathname ===
                                        `/workspace/${workspaceId}`
                                    );

                                return (

                                    <button
                                        key={ch._id}

                                        onClick={() =>
                                            router.push(
                                                `/workspace/${workspaceId}?channel=${ch._id}`
                                            )
                                        }

                                        className="relative w-full flex items-center gap-3 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                                        style={isActive ? { background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` } : { background: "transparent", color: T.muted, border: "1px solid transparent" }}
                                    >

                                        {isActive && (
                                            <motion.div
                                                layoutId="activeSidebarLink"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                                style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}

                                        <Hash
                                            size={16}
                                            className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                                        />

                                        <div className="flex items-center justify-between flex-1 min-w-0">

                                            <span className="truncate transition-colors group-hover:text-white" style={isActive ? { color: T.text } : {}}>
                                                {ch.name}
                                            </span>

                                            {
                                                unreadCounts[ch._id] > 0 && (

                                                    <span
                                                        className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center shadow-sm"
                                                        style={{ background: T.accent, color: "#fff", boxShadow: `0 0 10px ${T.accent}80` }}
                                                    >
                                                        {
                                                            unreadCounts[ch._id]
                                                        }
                                                    </span>

                                                )
                                            }

                                        </div>

                                    </button>

                                );

                            })}

                        </div>

                    </div>

                    {/* Workspace Nav */}
                    <div>

                        <h2
                            className="text-[11px] font-bold uppercase tracking-wider mb-3 px-2" style={{ color: T.muted }}
                        >
                            Workspace
                        </h2>

                        <div className="space-y-1">

                            {(() => {
                                const isTasksActive = pathname.includes("/tasks");
                                const isMembersActive = pathname.includes("/members");
                                const isActivityActive = pathname.includes("/activity");
                                const isSettingsActive = pathname.includes("/settings");
                                const isMediaActive = pathname.includes("/files");
                                return (
                                    <>
                            {/* Home (Full Page Escape) */}
                            <button
                                onClick={() =>
                                    router.push("/")
                                }
                                className="relative w-full flex items-center gap-3 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                                style={{ background: "transparent", color: T.muted, border: "1px solid transparent" }}
                            >
                                <Home size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                <span className="transition-colors group-hover:text-white">Home</span>
                            </button>

                            {/* Tasks */}
                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/tasks`
                                    )
                                }

                                className="relative w-full flex items-center gap-3 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                                style={isTasksActive ? { background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` } : { background: "transparent", color: T.muted, border: "1px solid transparent" }}
                            >

                                {isTasksActive && (
                                    <motion.div
                                        layoutId="activeSidebarLink"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                        style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <CheckSquare
                                    size={16} className="opacity-70 group-hover:opacity-100 transition-opacity"
                                />

                                <span className="transition-colors group-hover:text-white" style={isTasksActive ? { color: T.text } : {}}>Tasks</span>

                            </button>

                            {/* Members */}
                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/members`
                                    )
                                }

                                className="relative w-full flex items-center gap-3 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                                style={isMembersActive ? { background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` } : { background: "transparent", color: T.muted, border: "1px solid transparent" }}
                            >

                                {isMembersActive && (
                                    <motion.div
                                        layoutId="activeSidebarLink"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                        style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <Users size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" />

                                <span className="transition-colors group-hover:text-white" style={isMembersActive ? { color: T.text } : {}}>Members</span>

                            </button>

                            {/* Activity */}
                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/activity`
                                    )
                                }

                                className="relative w-full flex items-center gap-3 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                                style={isActivityActive ? { background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` } : { background: "transparent", color: T.muted, border: "1px solid transparent" }}
                            >

                                {isActivityActive && (
                                    <motion.div
                                        layoutId="activeSidebarLink"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                        style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <Settings
                                    size={16} className="opacity-70 group-hover:opacity-100 transition-opacity"
                                />

                                <span className="transition-colors group-hover:text-white" style={isActivityActive ? { color: T.text } : {}}>Activity</span>

                            </button>

                            {/* Media Hub */}
                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/files`
                                    )
                                }

                                className="relative w-full flex items-center gap-3 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                                style={isMediaActive ? { background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` } : { background: "transparent", color: T.muted, border: "1px solid transparent" }}
                            >

                                {isMediaActive && (
                                    <motion.div
                                        layoutId="activeSidebarLink"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                        style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <Folder
                                    size={16} className="opacity-70 group-hover:opacity-100 transition-opacity"
                                />

                                <span className="transition-colors group-hover:text-white" style={isMediaActive ? { color: T.text } : {}}>Media Hub</span>

                            </button>

                            {/* Settings - for everyone but members can't perform actions - only owners and admins can do */}

                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/settings`
                                    )
                                }

                                className="relative w-full flex items-center gap-3 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                                style={isSettingsActive ? { background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` } : { background: "transparent", color: T.muted, border: "1px solid transparent" }}
                            >

                                {isSettingsActive && (
                                    <motion.div
                                        layoutId="activeSidebarLink"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                        style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <Settings
                                    size={16} className="opacity-70 group-hover:opacity-100 transition-opacity"
                                />

                                <span className="transition-colors group-hover:text-white" style={isSettingsActive ? { color: T.text } : {}}>Settings</span>

                            </button>
                                    </>
                                );
                            })()}

                        </div>

                    </div>

                </div>

                {/* Footer */}
                <div className="p-4" style={{ borderTop: `1px solid ${T.borderHi}` }}>
                    <UserMenu />
                </div>

            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0"
                        style={{ background: "rgba(3,7,18,0.85)", backdropFilter: "blur(10px)" }}
                        onClick={() =>
                            setShowModal(false)
                        }
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 28, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22,1,0.36,1] } }}
                        exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } }}
                        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                        style={{ background: T.surface, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${T.accent}, transparent)` }} />

                        <div className="p-7">
                        <div
                            className="flex items-center justify-between mb-5"
                        >

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                                    <Hash size={18} style={{ color: T.accent }} />
                                </div>
                                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Create Channel</h3>
                            </div>

                            <button
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-white/5 cursor-pointer" style={{ color: T.muted }}
                            >

                                <X size={16} />

                            </button>

                        </div>

                        <div
                            className="relative rounded-2xl transition-all duration-300 mb-7"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = T.accentMd;
                                e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentLo}`;
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = T.border;
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <input
                                value={channelName}
                                onChange={(e) =>
                                    setChannelName(
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. engineering"
                                className="w-full bg-transparent outline-none px-5 py-4 text-sm"
                                style={{ color: T.text }}
                                autoFocus
                            />
                        </div>

                        <div
                            className="flex justify-end gap-3"
                        >

                            <button
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5 cursor-pointer"
                                style={{ color: T.muted, border: `1px solid ${T.border}` }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={createChannel}
                                disabled={
                                    isCreating || !channelName.trim()
                                }
                                className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 text-white disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                                style={{ background: `linear-gradient(135deg, ${T.accent}, #1D4ED8)`, boxShadow: `0 4px 20px ${T.accentMd}` }}
                            >

                                {isCreating ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Creating
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Create Channel
                                    </>
                                )}

                            </button>

                        </div>

                        </div>
                    </motion.div>
                </div>
                )}
            </AnimatePresence>
        </>

    );

}