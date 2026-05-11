"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Circle } from "lucide-react";

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
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(() => {
        if (!socket || !workspaceId || !currentUserId) return;

        socket.emit("join_workspace_presence", {
            workspaceId,
            userId: currentUserId,
        });

        const handleOnlineUsers = (users: string[]) => {
            setOnlineUsers(users);
        };

        socket.on("workspace_online_users", handleOnlineUsers);

        return () => {
            socket.off("workspace_online_users", handleOnlineUsers);
        };
    }, [socket, workspaceId, currentUserId]);

    const onlineMembers = members.filter((member) =>
        onlineUsers.includes(member.user._id)
    );
    const offlineMembers = members.filter(
        (member) => !onlineUsers.includes(member.user._id)
    );

    return (
        <div className="relative group">
            {/* Badge - solid */}
            <button
                className="flex items-center gap-2 text-xs sm:text-sm font-medium 
          bg-[#0F1123] border border-[#1E2A3A] px-3 py-1.5 rounded-full 
          hover:bg-[#1A1F3A] transition-all duration-200 shadow-lg"
            >
                <div className="relative">
                    <Circle className="w-2.5 h-2.5 text-green-400 fill-green-400/30" />
                    <span className="absolute inset-0 animate-ping rounded-full w-2.5 h-2.5 bg-green-400 opacity-40" />
                </div>
                <span className="text-white">{onlineMembers.length} Online</span>
            </button>

            {/* DROPDOWN - FULLY SOLID, NO TRANSPARENCY */}
            <div
                className="absolute top-full right-0 mt-3 w-72 sm:w-80
  bg-[#090B14]/95 backdrop-blur-xl
  border border-[#1E2A3A]
  rounded-2xl shadow-2xl
  opacity-0 invisible group-hover:opacity-100 group-hover:visible
  transition-all duration-200
  translate-y-1 group-hover:translate-y-0
  z-[9999] overflow-hidden"
            >
                {/* Header - solid */}
                <div className="px-4 py-3 border-b border-[#1E2A3A] bg-[#0F1222]">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">Workspace Members</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        {members.length} total • {onlineMembers.length} online
                    </p>
                </div>

                {/* Online section */}
                <div className="p-4 border-b border-[#1E2A3A]">
                    <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="w-3.5 h-3.5 text-green-400" />
                        <p className="text-xs font-semibold text-green-400">Online — {onlineMembers.length}</p>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {onlineMembers.length === 0 ? (
                            <div className="text-center py-4 text-slate-500 text-sm">No users online</div>
                        ) : (
                            onlineMembers.map((member) => {
                                const isCurrentUser = member.user._id === currentUserId;
                                return (
                                    <div
                                        key={member.user._id}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#1A1F30] transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-sm text-white">
                                                {member.user.username}
                                                {isCurrentUser && <span className="ml-2 text-xs text-blue-400">(You)</span>}
                                            </span>
                                        </div>
                                        {isCurrentUser && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                you
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Offline section */}
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <UserX className="w-3.5 h-3.5 text-slate-500" />
                        <p className="text-xs font-semibold text-slate-500">Offline — {offlineMembers.length}</p>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {offlineMembers.length === 0 ? (
                            <div className="text-center py-3 text-slate-500 text-sm">Everyone is online 🎉</div>
                        ) : (
                            offlineMembers.map((member) => {
                                const isCurrentUser = member.user._id === currentUserId;
                                return (
                                    <div
                                        key={member.user._id}
                                        className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[#1A1F30] transition-colors"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                                        <span className="text-sm text-slate-400">
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

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1F30;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3B82F6;
          border-radius: 10px;
        }
      `}</style>
        </div>
    );
}