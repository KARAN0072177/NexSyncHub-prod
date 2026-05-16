"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    Users,
    Building2,
    Hash,
    CheckSquare,
    MessageSquare,
    Shield,
    Crown,
    BadgeCheck,
    Loader2,
} from "lucide-react";

import { useSession } from "next-auth/react";

interface AdminStats {

    totalUsers: number;

    totalWorkspaces: number;

    totalChannels: number;

    totalTasks: number;

    totalMessages: number;

    verifiedUsers: number;

    admins: number;

    superAdmins: number;

}

export default function AdminPage() {

    const {
        data: session,
    } = useSession();

    console.log(session);

    const [stats, setStats] =
        useState<AdminStats | null>(
            null
        );

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        const fetchStats =
            async () => {

                try {

                    const res =
                        await fetch(
                            "/api/admin/stats"
                        );

                    const data =
                        await res.json();

                    if (res.ok) {

                        setStats(
                            data.stats
                        );

                    }

                } catch (error) {

                    console.error(
                        "ADMIN STATS ERROR:",
                        error
                    );

                } finally {

                    setLoading(false);

                }

            };

        fetchStats();

    }, []);

    const cards = [

        {
            title:
                "Total Users",

            value:
                stats?.totalUsers || 0,

            icon: Users,
        },

        {
            title:
                "Workspaces",

            value:
                stats?.totalWorkspaces || 0,

            icon: Building2,
        },

        {
            title:
                "Channels",

            value:
                stats?.totalChannels || 0,

            icon: Hash,
        },

        {
            title:
                "Tasks",

            value:
                stats?.totalTasks || 0,

            icon: CheckSquare,
        },

        {
            title:
                "Messages",

            value:
                stats?.totalMessages || 0,

            icon:
                MessageSquare,
        },

        {
            title:
                "Verified Users",

            value:
                stats?.verifiedUsers || 0,

            icon:
                BadgeCheck,
        },

        {
            title:
                "Admins",

            value:
                stats?.admins || 0,

            icon: Shield,
        },

        {
            title:
                "Super Admins",

            value:
                stats?.superAdmins || 0,

            icon: Crown,
        },

    ];

    if (loading) {

        return (

            <div
                className="min-h-screen bg-black flex items-center justify-center"
            >

                <Loader2
                    className="w-10 h-10 text-indigo-500 animate-spin"
                />

            </div>

        );

    }

    return (

        <div
            className="min-h-screen bg-black text-white p-6"
        >

            {/* Header */}
            <div
                className="mb-8"
            >

                <h1
                    className="text-3xl font-bold"
                >
                    NexSyncHub Admin
                </h1>

                <p
                    className="text-gray-400 mt-2"
                >
                    Platform overview dashboard
                </p>

            </div>

            {/* Stats Grid */}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
            >

                {cards.map(
                    (
                        card,
                        index
                    ) => {

                        const Icon =
                            card.icon;

                        return (

                            <div
                                key={index}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all"
                            >

                                <div
                                    className="flex items-center justify-between"
                                >

                                    <div>

                                        <p
                                            className="text-sm text-gray-400"
                                        >
                                            {card.title}
                                        </p>

                                        <h2
                                            className="text-3xl font-bold mt-2"
                                        >
                                            {card.value}
                                        </h2>

                                    </div>

                                    <div
                                        className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                                    >

                                        <Icon
                                            className="w-6 h-6 text-indigo-400"
                                        />

                                    </div>

                                </div>

                            </div>

                        );

                    }
                )}

            </div>

        </div>

    );

}