"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    Clock,
    MessageSquare,
    CheckSquare,
    User,
    Loader2,
    Calendar,
    Hash,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Search,
} from "lucide-react";

import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";

type WorkspaceActivity = {
    _id: string;
    type: string;
    createdAt: string;
    content: string;
    task?: {
        title: string;
    };
};

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

/* ─── design tokens (matches members/settings/tasks page) ──────────────── */
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

export default function ActivityClient({ workspaceId }: { workspaceId: string }) {
    const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchActivities = async () => {
            const res = await fetch(`/api/workspace/activity?workspaceId=${workspaceId}`);
            const data = await res.json();
            if (res.ok) {
                setActivities(data.activities);
            }
            setLoading(false);
        };
        fetchActivities();
    }, [workspaceId]);

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "task_created":
                return <CheckSquare size={14} style={{ color: "#10B981" }} />;
            case "task_updated":
                return <CheckSquare size={14} style={{ color: "#F59E0B" }} />;
            case "comment_added":
                return <MessageSquare size={14} style={{ color: T.accent }} />;
            case "member_joined":
                return <User size={14} style={{ color: "#8B5CF6" }} />;
            default:
                return <Activity size={14} style={{ color: T.muted }} />;
        }
    };

    useEffect(() => {
        if (!workspaceId) return;

        socket.emit("join_channel", workspaceId);

        return () => {
            socket.off("workspace_activity");
        };
    }, [workspaceId]);

    useEffect(() => {
        socket.on("workspace_activity", (activity) => {
            setActivities((prev) => {
                if (prev.some((a) => a._id === activity._id)) return prev;
                return [activity, ...prev]; // newest first
            });
            // Jump to first page to see the new activity
            setCurrentPage(1);
        });

        return () => {
            socket.off("workspace_activity");
        };
    }, []);

    const filteredActivities = activities.filter((activity) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            activity.content.toLowerCase().includes(query) ||
            (activity.task?.title && activity.task.title.toLowerCase().includes(query))
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredActivities.length / ITEMS_PER_PAGE));
    
    const paginatedActivities = filteredActivities.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const groupedActivities = paginatedActivities.reduce((acc, activity) => {
        const date = new Date(activity.createdAt).toDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
    }, {} as Record<string, WorkspaceActivity[]>);

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.text, fontFamily: "'DM Sans', sans-serif" }}
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>
                <span className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.borderHi}`, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    Page <span style={{ color: T.text }}>{currentPage}</span> of <span style={{ color: T.text }}>{totalPages}</span>
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.text, fontFamily: "'DM Sans', sans-serif" }}
                >
                    Next
                    <ChevronRight size={16} />
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-full overflow-y-auto p-6 lg:p-8 flex flex-col" style={{ background: "linear-gradient(135deg, #030712 0%, #080C17 100%)" }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`}</style>
                <div className="max-w-4xl mx-auto w-full pb-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                        <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>
                    <div className="space-y-8 pl-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="flex gap-4"
                            >
                                <div className="h-8 w-8 rounded-full animate-pulse flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                                <div className="flex-1 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.04)` }}>
                                    <div className="h-4 w-3/4 rounded animate-pulse mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
                                    <div className="h-3 w-1/4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-8 flex flex-col" style={{ background: "linear-gradient(135deg, #030712 0%, #080C17 100%)", color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
                ::-webkit-scrollbar { width:4px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
            `}</style>
            
            {/* ambient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
                <div style={{ position:"absolute", top:-100, left:-80, width:420, height:420, borderRadius:"50%", background:"rgba(59,130,246,0.12)", filter:"blur(100px)" }} />
                <div style={{ position:"absolute", bottom:-60, right:-40, width:320, height:320, borderRadius:"50%", background:"rgba(14,165,233,0.08)", filter:"blur(100px)" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto w-full pb-10 flex-1 flex flex-col">
                {/* Header */}
                <div className="rounded-3xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}>
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 pointer-events-none" style={{ background: T.accentLo }} />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                                <Activity size={24} style={{ color: T.accent }} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                                    Activity{" "}
                                    <span style={{ color: T.accent }}>
                                        <Typewriter
                                            words={["Feed", "Log", "History", "Updates"]}
                                            loop={0}
                                            cursor
                                            cursorStyle="|"
                                            typeSpeed={70}
                                            deleteSpeed={50}
                                            delaySpeed={2000}
                                        />
                                    </span>
                                </h1>
                                <p className="text-sm mt-1.5" style={{ color: T.muted }}>
                                    Real-time pulse of everything happening in your workspace.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                            <div 
                                className="relative flex items-center rounded-2xl px-4 py-2.5 transition-all duration-300 w-full sm:w-auto"
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
                                <Search className="w-4 h-4 mr-2.5 flex-shrink-0" style={{ color: T.muted }} />
                                <input
                                    type="text"
                                    placeholder="Search activity..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent text-sm font-medium outline-none w-full sm:w-48 placeholder:text-gray-500"
                                    style={{ color: T.text, fontFamily: "'DM Sans', sans-serif" }}
                                />
                            </div>
                            <div className="flex justify-center sm:justify-start items-center gap-2.5 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-2xl w-full sm:w-fit whitespace-nowrap" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.muted }}>
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </div>
                                Live
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Pagination Controls */}
                {renderPagination()}

                {/* Activity List */}
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner rotate-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.borderHi}` }}>
                            <Sparkles className="w-8 h-8" style={{ color: T.muted }} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                            No activity yet
                        </h3>
                        <p className="text-center max-w-md text-sm" style={{ color: T.muted }}>
                            Activity will appear here when tasks are created, updated, or when members join.
                        </p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.borderHi}` }}>
                            <Search className="w-8 h-8" style={{ color: T.muted }} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                            No results found
                        </h3>
                        <p className="text-center max-w-md text-sm" style={{ color: T.muted }}>
                            We couldn't find any activities matching "{searchQuery}".
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-8 pl-2 sm:pl-4 flex-1"
                        >
                        {Object.entries(groupedActivities).map(([date, items]) => (
                            <div key={date} className="relative">
                                {/* Date Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-sm z-10" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${T.borderHi}`, color: T.text }}>
                                        <Calendar size={12} style={{ color: T.muted }} />
                                        {new Date(date).toLocaleDateString(undefined, {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </div>
                                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${T.border}, transparent)` }} />
                                </div>

                                {/* Timeline Content */}
                                <div className="relative pl-6 space-y-6">
                                    {/* Continuous vertical line for the day */}
                                    <div className="absolute left-[15px] top-3 bottom-[-2rem] w-px" style={{ background: T.border }} />

                                    {items.map((a) => (
                                        <div key={a._id} className="relative flex items-start gap-4 group">
                                            {/* Timeline dot/icon */}
                                            <div className="absolute -left-[33px] top-1.5 z-10 p-1.5 rounded-xl border group-hover:shadow-lg transition-all duration-300" style={{ background: "#080C17", borderColor: T.borderHi }}>
                                                {getActivityIcon(a.type)}
                                            </div>

                                            {/* Content Card */}
                                            <div className="flex-1 rounded-2xl p-5 transition-all duration-300 overflow-hidden relative group-hover:-translate-y-0.5" style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}>
                                                <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to bottom, ${T.accent}, transparent)` }} />
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm leading-relaxed" style={{ color: T.text }}>
                                                            {a.content}
                                                        </p>
                                                        {a.task && (
                                                            <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}`, color: T.accent }}>
                                                                <Hash size={12} className="opacity-70" />
                                                                {a.task.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase shrink-0 px-2.5 py-1.5 rounded-lg sm:mt-0 mt-1 w-fit" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.muted }}>
                                                        <Clock size={11} className="opacity-70" />
                                                        {formatRelativeTime(a.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}