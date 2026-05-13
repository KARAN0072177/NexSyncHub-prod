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
} from "lucide-react";

import UserMenu from "@/components/layout/UserMenu";

export default function WorkspaceSidebar({
    workspaceId,
    role,
}: {
    workspaceId: string;
    role: string;
}) {

    const [channels, setChannels] =
        useState<any[]>([]);

    const [showModal, setShowModal] =
        useState(false);

    const [channelName, setChannelName] =
        useState("");

    const [isCreating, setIsCreating] =
        useState(false);

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

            };

        fetchChannels();

    }, [workspaceId]);

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
                className="w-72 flex-shrink-0 border-r border-gray-800/50 bg-gray-900/30 backdrop-blur-sm flex flex-col"
            >

                {/* Header */}
                <div className="p-4 border-b border-gray-800/50">

                    <div className="flex items-center justify-between">

                        <h1
                            className="font-semibold text-gray-200 truncate text-lg tracking-tight"
                        >
                            Workspace
                        </h1>

                        <div className="flex items-center gap-1">

                            <button
                                onClick={() =>
                                    router.push(
                                        "/dashboard/browse"
                                    )
                                }
                                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                            >
                                <Globe size={18} />
                            </button>

                            <button
                                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                            >
                                <Settings size={18} />
                            </button>

                        </div>

                    </div>

                    <p
                        className="text-xs text-gray-500 mt-1 flex items-center gap-1"
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-green-500"
                        />

                        {role === "admin"
                            ? "Admin"
                            : "Member"}

                    </p>

                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto p-3 space-y-6"
                >

                    {/* Channels */}
                    <div>

                        <div
                            className="flex items-center justify-between mb-2 px-1"
                        >

                            <h2
                                className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                            >
                                Channels
                            </h2>

                            <button
                                onClick={() =>
                                    setShowModal(true)
                                }
                                className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200"
                            >
                                <Plus size={14} />
                            </button>

                        </div>

                        <div className="space-y-0.5">

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

                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive
                                                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                                            }`}
                                    >

                                        <Hash
                                            size={14}
                                            className="flex-shrink-0"
                                        />

                                        <span className="truncate">
                                            {ch.name}
                                        </span>

                                    </button>

                                );

                            })}

                        </div>

                    </div>

                    {/* Workspace Nav */}
                    <div>

                        <h2
                            className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1"
                        >
                            Workspace
                        </h2>

                        <div className="space-y-0.5">

                            {/* Tasks */}
                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/tasks`
                                    )
                                }

                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${pathname.includes("/tasks")
                                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                                    }`}
                            >

                                <CheckSquare
                                    size={14}
                                />

                                <span>Tasks</span>

                            </button>

                            {/* Members */}
                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/members`
                                    )
                                }

                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${pathname.includes("/members")
                                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                                    }`}
                            >

                                <Users size={14} />

                                <span>Members</span>

                            </button>

                            {/* Activity */}
                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/activity`
                                    )
                                }

                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${pathname.includes("/activity")
                                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                                    }`}
                            >

                                <Settings
                                    size={14}
                                />

                                <span>Activity</span>

                            </button>

                            {/* Settings - for everyone but members can't perform actions - only owners and admins can do */}

                            <button
                                onClick={() =>
                                    router.push(
                                        `/workspace/${workspaceId}/settings`
                                    )
                                }

                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${pathname.includes("/settings")
                                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                                    } `}
                            >

                                <Settings
                                    size={14}
                                />

                                <span>Settings</span>

                            </button>

                        </div>

                    </div>

                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-800/50">
                    <UserMenu />
                </div>

            </div>

            {/* Modal */}
            {showModal && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >

                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() =>
                            setShowModal(false)
                        }
                    />

                    <div
                        className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
                    >

                        <div
                            className="flex items-center justify-between mb-5"
                        >

                            <h2
                                className="text-xl font-semibold text-white flex items-center gap-2"
                            >
                                <Hash
                                    className="w-5 h-5 text-indigo-400"
                                />

                                Create Channel

                            </h2>

                            <button
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                            >

                                <X size={18} />

                            </button>

                        </div>

                        <input
                            value={channelName}

                            onChange={(e) =>
                                setChannelName(
                                    e.target.value
                                )
                            }

                            placeholder="general"

                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200"
                        />

                        <div
                            className="flex justify-end gap-3 mt-6"
                        >

                            <button
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={createChannel}

                                disabled={
                                    isCreating
                                }

                                className="px-4 py-2 rounded-lg bg-indigo-600 text-white flex items-center gap-2"
                            >

                                {isCreating ? (
                                    <>
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        Create
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}
        </>

    );

}