"use client";

import { useEffect, useState } from "react";

type WorkspacePresenceProps = {
    socket: any;
    workspaceId: string;
    members: any[];
    currentUserId?: string;
};

export default function WorkspacePresence({
    socket,
    workspaceId,
    members,
    currentUserId,
}: WorkspacePresenceProps) {

    // 🔥 Online user IDs
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    // 🔥 Presence socket logic
    useEffect(() => {
        if (!socket || !workspaceId || !currentUserId) return;

        // Join workspace presence room
        socket.emit("join_workspace_presence", {
            workspaceId,
            userId: currentUserId,
        });

        // Receive online users
        const handleOnlineUsers = (users: string[]) => {
            setOnlineUsers(users);
        };

        socket.on("workspace_online_users", handleOnlineUsers);

        // Cleanup
        return () => {
            socket.off("workspace_online_users", handleOnlineUsers);
        };

    }, [socket, workspaceId, currentUserId]);

    // 🔥 Derived online/offline members
    const onlineMembers = members.filter((member) =>
        onlineUsers.includes(member.user._id)
    );

    const offlineMembers = members.filter(
        (member) => !onlineUsers.includes(member.user._id)
    );

    return (
        <div className="relative group">

            {/* Presence badge */}
            <button
                className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50 hover:bg-gray-800 transition-colors"
            >
                🟢 {onlineMembers.length} Online
            </button>

            {/* Hover dropdown */}
            <div
                className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl
      opacity-0 invisible group-hover:opacity-100 group-hover:visible
      transition-all duration-200 z-50 overflow-hidden"
            >

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-white">
                        Workspace Members
                    </h3>
                </div>

                {/* Online users */}
                <div className="p-4 border-b border-gray-800">

                    <p className="text-xs font-medium text-green-400 mb-3">
                        Online — {onlineMembers.length}
                    </p>

                    <div className="space-y-2">

                        {onlineMembers.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No users online
                            </p>
                        ) : (
                            onlineMembers.map((member) => {

                                const isCurrentUser =
                                    member.user._id === currentUserId;

                                return (
                                    <div
                                        key={member.user._id}
                                        className="flex items-center gap-2 text-sm text-gray-200"
                                    >
                                        <span className="text-green-500">
                                            ●
                                        </span>

                                        <span>
                                            {member.user.username}
                                            {isCurrentUser && " (You)"}
                                        </span>
                                    </div>
                                );
                            })
                        )}

                    </div>
                </div>

                {/* Offline users */}
                <div className="p-4">

                    <p className="text-xs font-medium text-gray-500 mb-3">
                        Offline — {offlineMembers.length}
                    </p>

                    <div className="space-y-2">

                        {offlineMembers.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                Everyone is online
                            </p>
                        ) : (
                            offlineMembers.map((member) => {

                                const isCurrentUser =
                                    member.user._id === currentUserId;

                                return (
                                    <div
                                        key={member.user._id}
                                        className="flex items-center gap-2 text-sm text-gray-400"
                                    >
                                        <span className="text-gray-600">
                                            ●
                                        </span>

                                        <span>
                                            {member.user.username}
                                            {isCurrentUser && " (You)"}
                                        </span>
                                    </div>
                                );
                            })
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}