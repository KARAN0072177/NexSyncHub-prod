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
                return <CheckSquare className="w-4 h-4 text-emerald-400" />;
            case "task_updated":
                return <CheckSquare className="w-4 h-4 text-amber-400" />;
            case "comment_added":
                return <MessageSquare className="w-4 h-4 text-sky-400" />;
            case "member_joined":
                return <User className="w-4 h-4 text-indigo-400" />;
            default:
                return <Activity className="w-4 h-4 text-gray-400" />;
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
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-900/50 border border-gray-800/60 rounded-xl hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>
                <span className="text-sm font-medium text-gray-500 bg-gray-900/30 px-4 py-2 rounded-lg border border-gray-800/30">
                    Page <span className="text-gray-300">{currentPage}</span> of <span className="text-gray-300">{totalPages}</span>
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-900/50 border border-gray-800/60 rounded-xl hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-full overflow-y-auto bg-gray-950 p-6 lg:p-8 flex flex-col scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="max-w-4xl mx-auto w-full pb-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-gray-800 animate-pulse" />
                        <div className="h-8 w-40 bg-gray-800 rounded animate-pulse" />
                    </div>
                    <div className="space-y-8 pl-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="flex gap-4"
                            >
                                <div className="h-8 w-8 rounded-full bg-gray-800 animate-pulse flex-shrink-0" />
                                <div className="flex-1 bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                                    <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse mb-3" />
                                    <div className="h-3 w-1/4 bg-gray-800 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#0A0A0A] text-gray-200 p-6 lg:p-8 flex flex-col scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <div className="max-w-4xl mx-auto w-full pb-10 flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-6 sm:p-8 mb-10 backdrop-blur-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 shadow-inner">
                                <Activity className="w-7 h-7 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                    Activity{" "}
                                    <span className="text-indigo-400">
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
                                <p className="text-sm text-gray-400 mt-1.5">
                                    Real-time pulse of everything happening in your workspace.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                            <div className="relative flex items-center bg-gray-950/50 rounded-lg border border-gray-800/50 px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all w-full sm:w-auto">
                                <Search className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search activity..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent text-sm font-medium text-gray-300 outline-none w-full sm:w-48 placeholder:text-gray-500"
                                />
                            </div>
                            <div className="flex justify-center sm:justify-start items-center gap-2.5 text-xs font-medium text-gray-400 bg-gray-950/50 px-4 py-2 rounded-lg border border-gray-800/50 w-full sm:w-fit whitespace-nowrap">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </div>
                                Live tracking
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Pagination Controls */}
                {renderPagination()}

                {/* Activity List */}
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 bg-gray-900/20 border border-gray-800/40 rounded-2xl border-dashed">
                        <div className="w-20 h-20 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-6 shadow-inner rotate-3">
                            <Sparkles className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200 mb-2">
                            No activity yet
                        </h3>
                        <p className="text-gray-400 text-center max-w-md">
                            Activity will appear here when tasks are created, updated, or when members join.
                        </p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 bg-gray-900/20 border border-gray-800/40 rounded-2xl border-dashed">
                        <div className="w-20 h-20 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-6 shadow-inner">
                            <Search className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200 mb-2">
                            No results found
                        </h3>
                        <p className="text-gray-400 text-center max-w-md">
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
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-900 px-3.5 py-1.5 rounded-full border border-gray-800 flex items-center gap-2 shadow-sm z-10">
                                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                        {new Date(date).toLocaleDateString(undefined, {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-gray-800 to-transparent" />
                                </div>

                                {/* Timeline Content */}
                                <div className="relative pl-6 space-y-6">
                                    {/* Continuous vertical line for the day */}
                                    <div className="absolute left-[15px] top-3 bottom-[-2rem] w-px bg-gray-800/60" />

                                    {items.map((a) => (
                                        <div key={a._id} className="relative flex items-start gap-4 group">
                                            {/* Timeline dot/icon */}
                                            <div className="absolute -left-[33px] top-1.5 z-10 p-1.5 bg-gray-950 rounded-full border border-gray-700 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition-all duration-300">
                                                {getActivityIcon(a.type)}
                                            </div>

                                            {/* Content Card */}
                                            <div className="flex-1 bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 hover:bg-gray-900/50 hover:border-gray-700/60 rounded-xl p-4 transition-all duration-200">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            {a.content}
                                                        </p>
                                                        {a.task && (
                                                            <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer text-xs font-medium">
                                                                <Hash className="w-3 h-3 opacity-70" />
                                                                {a.task.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 flex-shrink-0 bg-gray-950/50 px-2 py-1 rounded-md border border-gray-800/60 sm:mt-0 mt-1 w-fit">
                                                        <Clock className="w-3 h-3 opacity-70" />
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