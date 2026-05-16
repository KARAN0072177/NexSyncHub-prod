"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    Loader2,
    Shield,
} from "lucide-react";

import {
    formatDistanceToNow,
} from "date-fns";

interface Audit {

    _id: string;

    action: string;

    targetType: string;

    metadata?: any;

    createdAt: string;

    actor?: {
        username?: string;
        email?: string;
        avatar?: string;
    };

    workspace?: {
        name?: string;
    };

}

export default function AdminAuditsPage() {

    const [audits, setAudits] =
        useState<Audit[]>([]);

    const [loading, setLoading] =
        useState(true);

    // 🔥 Fetch audits
    useEffect(() => {

        const fetchAudits =
            async () => {

                try {

                    const res =
                        await fetch(
                            "/api/admin/audits/list"
                        );

                    const data =
                        await res.json();

                    if (res.ok) {

                        setAudits(
                            data.audits
                        );

                    }

                } catch (error) {

                    console.error(
                        "FETCH AUDITS ERROR:",
                        error
                    );

                } finally {

                    setLoading(false);

                }

            };

        fetchAudits();

    }, []);

    // 🔥 Format action
    const formatAction =
        (audit: Audit) => {

            const username =
                audit.actor?.username ||
                "Unknown";

            const workspace =
                audit.workspace?.name ||

                audit.metadata?.workspaceName ||

                "Unknown Workspace";

            switch (
            audit.action
            ) {

                case "workspace_created":

                    return `${username} created workspace "${workspace}"`;

                case "workspace_deleted":

                    return `${username} deleted workspace "${workspace}"`;

                case "workspace_renamed":

                    return `${username} renamed workspace "${audit.metadata?.oldName}" to "${audit.metadata?.newName}"`;

                case "channel_created":

                    return `${username} created channel "#${audit.metadata?.channelName}"`;

                case "channel_deleted":

                    return `${username} deleted channel "#${audit.metadata?.channelName}"`;

                case "channel_renamed":

                    return `${username} renamed channel "#${audit.metadata?.oldName}" to "#${audit.metadata?.newName}"`;

                case "member_joined":

                    return `${username} joined workspace "${workspace}"`;

                case "member_left":

                    return `${username} left workspace "${workspace}"`;

                case "member_removed":

                    return `${username} removed "${audit.metadata?.targetUsername}" from workspace`;

                case "member_role_updated":

                    return `${username} changed "${audit.metadata?.targetUsername}" role from "${audit.metadata?.oldRole}" to "${audit.metadata?.newRole}"`;

                case "ownership_transferred":

                    return `${username} transferred workspace ownership to "${audit.metadata?.targetUsername}"`;

                case "task_created":

                    return `${username} created task "${audit.metadata?.taskTitle}"`;

                case "task_status_changed":

                    return `${username} changed task "${audit.metadata?.taskTitle}" status from "${audit.metadata?.oldStatus}" to "${audit.metadata?.newStatus}"`;

                case "task_assigned":

                    return `${username} assigned "${audit.metadata?.targetUsername}" to task "${audit.metadata?.taskTitle}"`;

                case "task_unassigned":

                    return `${username} unassigned "${audit.metadata?.targetUsername}" from task "${audit.metadata?.taskTitle}"`;

                default:

                    return `${username} performed ${audit.action}`;

            }

        };

    if (loading) {

        return (

            <div
                className="h-full flex items-center justify-center"
            >

                <Loader2
                    className="w-10 h-10 text-indigo-500 animate-spin"
                />

            </div>

        );

    }

    return (

        <div
            className="p-6 text-white"
        >

            {/* Header */}
            <div
                className="mb-8"
            >

                <h1
                    className="text-3xl font-bold"
                >
                    Platform Audits
                </h1>

                <p
                    className="text-gray-400 mt-2"
                >
                    Platform-wide activity timeline
                </p>

            </div>

            {/* Empty State */}
            {audits.length === 0 && (

                <div
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center"
                >

                    <Shield
                        className="w-12 h-12 text-gray-600 mx-auto mb-4"
                    />

                    <h2
                        className="text-xl font-semibold"
                    >
                        No audits yet
                    </h2>

                    <p
                        className="text-gray-400 mt-2"
                    >
                        Platform audit activity will appear here
                    </p>

                </div>

            )}

            {/* Timeline */}
            <div
                className="space-y-4"
            >

                {audits.map(
                    (audit) => (

                        <div
                            key={audit._id}
                            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
                        >

                            <div
                                className="flex items-start gap-4"
                            >

                                {/* Icon */}
                                <div
                                    className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                                >

                                    <Shield
                                        className="w-5 h-5 text-indigo-400"
                                    />

                                </div>

                                {/* Content */}
                                <div
                                    className="flex-1"
                                >

                                    <p
                                        className="text-white font-medium"
                                    >

                                        {formatAction(
                                            audit
                                        )}

                                    </p>

                                    {/* Workspace */}
                                    <p
                                        className="text-sm text-gray-400 mt-1"
                                    >

                                        Workspace:
                                        {" "}
                                        {audit.workspace?.name ||

                                            audit.metadata?.workspaceName ||

                                            "Unknown"}

                                    </p>

                                    {/* Time */}
                                    <p
                                        className="text-xs text-gray-500 mt-3"
                                    >

                                        {formatDistanceToNow(
                                            new Date(audit.createdAt),
                                            {
                                                addSuffix: true,
                                            }
                                        )}

                                    </p>

                                </div>

                            </div>

                        </div>

                    )
                )}

            </div>

        </div>

    );

}