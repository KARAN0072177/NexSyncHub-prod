"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
    useParams,
} from "next/navigation";

import {
    Save,
    Trash2,
    Loader2,
    Hash,
    AlertTriangle,
} from "lucide-react";

export default function WorkspaceSettingsPage() {

    const router =
        useRouter();

    const params =
        useParams();

    const workspaceId =
        params.workspaceId as string;

    const [workspace, setWorkspace] =
        useState<any>(null);

    const [role, setRole] =
        useState("");

    const [channels, setChannels] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deletingChannel, setDeletingChannel] =
        useState<string | null>(null);

    const normalizedRole =
        role?.toUpperCase?.() || "";

    const canManage =
        normalizedRole === "OWNER" ||
        normalizedRole === "ADMIN";

    // 🔥 Fetch workspace
    useEffect(() => {

        const fetchData =
            async () => {

                try {

                    const [
                        workspaceRes,
                        channelRes,
                    ] = await Promise.all([

                        fetch(
                            `/api/workspace/${workspaceId}`
                        ),

                        fetch(
                            `/api/channel/list?workspaceId=${workspaceId}`
                        ),

                    ]);

                    const workspaceData =
                        await workspaceRes.json();

                    const channelData =
                        await channelRes.json();

                    if (workspaceRes.ok) {

                        setWorkspace(
                            workspaceData.workspace
                        );

                        setRole(
                            workspaceData.role
                        );

                    }

                    if (channelRes.ok) {

                        setChannels(
                            channelData.channels
                        );

                    }

                } catch (err) {

                    console.error(err);

                } finally {

                    setLoading(false);

                }

            };

        fetchData();

    }, [workspaceId]);

    // 🔥 Save workspace
    const handleSave =
        async () => {

            try {

                setSaving(true);

                const res =
                    await fetch(
                        "/api/workspace/update",
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                workspaceId,
                                name:
                                    workspace.name,
                                description:
                                    workspace.description,
                            }),
                        }
                    );

                const data =
                    await res.json();

                if (!res.ok) {

                    return alert(
                        data.error
                    );

                }

                alert(
                    "Workspace updated"
                );

            } catch (err) {

                console.error(err);

            } finally {

                setSaving(false);

            }

        };

    // 🔥 Rename channel
    const renameChannel =
        async (
            channelId: string,
            name: string
        ) => {

            const newName =
                prompt(
                    "New channel name",
                    name
                );

            if (!newName) return;

            const res =
                await fetch(
                    "/api/channel/rename",
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            channelId,
                            name: newName,
                        }),
                    }
                );

            const data =
                await res.json();

            if (!res.ok) {

                return alert(
                    data.error
                );

            }

            setChannels((prev) =>
                prev.map((ch) =>
                    ch._id === channelId
                        ? {
                            ...ch,
                            name: newName,
                        }
                        : ch
                )
            );

        };

    // 🔥 Delete channel
    const deleteChannel =
        async (
            channelId: string
        ) => {

            const confirmed =
                confirm(
                    "Delete this channel?"
                );

            if (!confirmed) return;

            try {

                setDeletingChannel(
                    channelId
                );

                const res =
                    await fetch(
                        "/api/channel/delete",
                        {
                            method: "DELETE",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                channelId,
                            }),
                        }
                    );

                const data =
                    await res.json();

                if (!res.ok) {

                    return alert(
                        data.error
                    );

                }

                setChannels((prev) =>
                    prev.filter(
                        (ch) =>
                            ch._id !== channelId
                    )
                );

            } catch (err) {

                console.error(err);

            } finally {

                setDeletingChannel(
                    null
                );

            }

        };

    // 🔥 Delete workspace
    const deleteWorkspace =
        async () => {

            const confirmed =
                confirm(
                    "Delete workspace permanently?"
                );

            if (!confirmed) return;

            const res =
                await fetch(
                    "/api/workspace/delete",
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            workspaceId,
                        }),
                    }
                );

            const data =
                await res.json();

            if (!res.ok) {

                return alert(
                    data.error
                );

            }

            router.push(
                "/dashboard"
            );

        };

    // 🔥 Leave workspace
    const leaveWorkspace =
        async () => {

            const confirmed =
                confirm(
                    "Leave this workspace?"
                );

            if (!confirmed) return;

            const res =
                await fetch(
                    "/api/workspace/leave",
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            workspaceId,
                        }),
                    }
                );

            const data =
                await res.json();

            if (!res.ok) {

                return alert(
                    data.error
                );

            }

            router.push(
                "/dashboard"
            );

        };

    // 🔥 Loading
    if (
        loading ||
        !workspace
    ) {

        return (

            <div className="h-full flex items-center justify-center">

                <Loader2
                    className="w-8 h-8 animate-spin text-indigo-500"
                />

            </div>

        );

    }

    return (

        <div className="h-full overflow-y-auto p-6">

            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-white">
                        Workspace Settings
                    </h1>

                    <p className="text-gray-400 mt-1">
                        Manage workspace configuration
                    </p>

                </div>

                {/* General */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 mb-6">

                    <h2 className="text-xl font-semibold text-white mb-5">
                        General
                    </h2>

                    <div className="space-y-4">

                        <div>

                            <label className="text-sm text-gray-400 block mb-2">
                                Workspace Name
                            </label>

                            <input
                                disabled={!canManage}
                                value={workspace.name}

                                onChange={(e) =>
                                    setWorkspace({
                                        ...workspace,
                                        name:
                                            e.target.value,
                                    })
                                }

                                className="
                                w-full
                                bg-gray-800
                                border border-gray-700
                                rounded-xl
                                px-4 py-3
                                text-white
                                disabled:opacity-60
                                "
                            />

                        </div>

                        <div>

                            <label className="text-sm text-gray-400 block mb-2">
                                Description
                            </label>

                            <textarea
                                disabled={!canManage}
                                rows={4}

                                value={
                                    workspace.description
                                }

                                onChange={(e) =>
                                    setWorkspace({
                                        ...workspace,
                                        description:
                                            e.target.value,
                                    })
                                }

                                className="
                                w-full
                                bg-gray-800
                                border border-gray-700
                                rounded-xl
                                px-4 py-3
                                text-white
                                resize-none
                                disabled:opacity-60
                                "
                            />

                        </div>

                        <button
                            onClick={
                                handleSave
                            }

                            disabled={
                                saving ||
                                !canManage
                            }

                            className="
                            flex items-center gap-2
                            px-5 py-3
                            rounded-xl
                            bg-indigo-600
                            hover:bg-indigo-700
                            disabled:opacity-50
                            text-white
                            "
                        >

                            {saving ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}

                        </button>

                    </div>

                </div>

                {/* Channels */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 mb-6">

                    <h2 className="text-xl font-semibold text-white mb-5">
                        Channels
                    </h2>

                    <div className="space-y-3 relative">

                        {channels.map((ch) => (

                            <div
                                key={ch._id}

                                className="
                                flex items-center
                                justify-between
                                bg-gray-800/50
                                border border-gray-700
                                rounded-xl
                                px-4 py-3
                                "
                            >

                                <div className="flex items-center gap-2">

                                    <Hash
                                        size={16}
                                        className="text-indigo-400"
                                    />

                                    <span className="text-white">
                                        {ch.name}
                                    </span>

                                </div>

                                <div className="flex gap-2">

                                    <button
                                        onClick={() =>
                                            renameChannel(
                                                ch._id,
                                                ch.name
                                            )
                                        }

                                        className="
                                        px-3 py-1.5
                                        rounded-lg
                                        bg-gray-700
                                        text-gray-200
                                        text-sm
                                        "
                                    >
                                        Rename
                                    </button>

                                    <button
                                        onClick={() =>
                                            deleteChannel(
                                                ch._id
                                            )
                                        }

                                        disabled={
                                            deletingChannel ===
                                            ch._id
                                        }

                                        className="
                                        px-3 py-1.5
                                        rounded-lg
                                        bg-red-500/20
                                        text-red-400
                                        text-sm
                                        "
                                    >

                                        {deletingChannel ===
                                            ch._id ? (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Trash2
                                                size={14}
                                            />
                                        )}

                                    </button>

                                </div>

                            </div>

                        ))}

                        {
                            !canManage && (

                                <div
                                    className="
                                    absolute inset-0
                                    bg-gray-950/60
                                    backdrop-blur-sm
                                    rounded-2xl
                                    flex items-center
                                    justify-center
                                    "
                                >

                                    <div className="text-center px-6">

                                        <h3
                                            className="
                                            text-lg
                                            font-semibold
                                            text-white
                                            mb-2
                                            "
                                        >
                                            Restricted Access
                                        </h3>

                                        <p
                                            className="
                                            text-sm
                                            text-gray-300
                                            "
                                        >
                                            Only workspace owners
                                            and admins can
                                            manage channels
                                        </p>

                                    </div>

                                </div>

                            )
                        }

                    </div>

                </div>

                {/* Danger Zone */}
                <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6">

                    <div className="flex items-center gap-2 mb-4">

                        <AlertTriangle
                            className="text-red-400"
                        />

                        <h2 className="text-xl font-semibold text-red-300">
                            Danger Zone
                        </h2>

                    </div>

                    {

                        normalizedRole === "OWNER"
                            ? (

                                <button
                                    onClick={
                                        deleteWorkspace
                                    }

                                    className="
                                px-5 py-3
                                rounded-xl
                                bg-red-600
                                hover:bg-red-700
                                text-white
                                "
                                >
                                    Delete Workspace
                                </button>

                            ) : (

                                <button
                                    onClick={
                                        leaveWorkspace
                                    }

                                    className="
                                px-5 py-3
                                rounded-xl
                                bg-red-500/20
                                hover:bg-red-500/30
                                text-red-300
                                "
                                >
                                    Leave Workspace
                                </button>

                            )
                    }

                </div>

            </div>

        </div>

    );

}