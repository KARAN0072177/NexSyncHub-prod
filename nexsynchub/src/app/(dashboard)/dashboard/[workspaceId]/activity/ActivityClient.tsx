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
} from "lucide-react";

import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function ActivityClient({ workspaceId }: { workspaceId: string }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                return <CheckSquare className="w-4 h-4 text-green-400" />;
            case "task_updated":
                return <CheckSquare className="w-4 h-4 text-yellow-400" />;
            case "comment_added":
                return <MessageSquare className="w-4 h-4 text-blue-400" />;
            case "member_joined":
                return <User className="w-4 h-4 text-purple-400" />;
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
        });

        return () => {
            socket.off("workspace_activity");
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-8 rounded-lg bg-gray-800 animate-pulse" />
                        <div className="h-8 w-40 bg-gray-800 rounded animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-4 backdrop-blur-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-5 w-5 rounded-full bg-gray-800 animate-pulse" />
                                    <div className="flex-1">
                                        <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse mb-2" />
                                        <div className="h-3 w-1/2 bg-gray-800 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Activity className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight">
                            Activity Feed
                        </h1>
                        <p className="text-sm text-gray-400">
                            Recent actions across your workspace
                        </p>
                    </div>
                </div>

                {/* Activity List */}
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-24 h-24 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center mb-6">
                            <Activity className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-200 mb-2">
                            No activity yet
                        </h3>
                        <p className="text-gray-400 text-center max-w-md">
                            Activity will appear here when tasks are created, updated, or when members join.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activities.map((a, index) => {
                            const isFirstOfDay =
                                index === 0 ||
                                new Date(a.createdAt).toDateString() !==
                                new Date(activities[index - 1].createdAt).toDateString();

                            return (
                                <div key={a._id}>
                                    {/* Date separator */}
                                    {isFirstOfDay && (
                                        <div className="flex items-center gap-3 my-4 first:mt-0">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                                            <div className="text-xs font-medium text-gray-500 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800">
                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                {new Date(a.createdAt).toLocaleDateString(undefined, {
                                                    weekday: "long",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </div>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                                        </div>
                                    )}

                                    {/* Activity Item */}
                                    <div className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 hover:bg-gray-800/30 hover:border-gray-700/50 transition-all duration-200">
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700/50 group-hover:border-indigo-500/30 transition-colors">
                                                {getActivityIcon(a.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-200">
                                                    <span className="text-gray-400">{a.content}</span>
                                                </p>

                                                {/* Task reference */}
                                                {a.task && (
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        <Hash className="w-3 h-3 text-indigo-400" />
                                                        <span className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                                                            {a.task.title}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(a.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}