"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Crown,
  Shield,
  User,
  Loader2,
  MoreVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type Member = {
  _id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    _id: string;
    username: string;
    email: string;
  };
};

export default function MembersClient({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const [currentUserRole, setCurrentUserRole] = useState<"OWNER" | "ADMIN" | "MEMBER" | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchMembers = async () => {
      const res = await fetch(`/api/workspace/members?workspaceId=${workspaceId}`);
      const data = await res.json();

      if (res.ok) {
        setMembers(data.members);
        const me = data.members.find((m: any) => m.user._id === session?.user?.id);
        if (me) setCurrentUserRole(me.role);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [workspaceId, status, session?.user?.id]);

  const removeMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setActionInProgress(userId);

    await fetch("/api/workspace/member/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, targetUserId: userId }),
    });

    setMembers((prev) => prev.filter((m) => m.user._id !== userId));
    setActionInProgress(null);
  };

  const changeRole = async (userId: string, role: string) => {
    if (!confirm(`Change role to ${role}?`)) return;
    setActionInProgress(userId);

    await fetch("/api/workspace/member/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, targetUserId: userId, role }),
    });

    setMembers((prev) =>
      prev.map((m) =>
        m.user._id === userId ? { ...m, role: role as "OWNER" | "ADMIN" | "MEMBER" } : m
      )
    );
    setActionInProgress(null);
  };

  const roleConfig = {
    OWNER: {
      icon: Crown,
      bg: "bg-amber-500/10",
      text: "text-amber-300",
      border: "border-amber-500/30",
      label: "Owner",
    },
    ADMIN: {
      icon: Shield,
      bg: "bg-indigo-500/10",
      text: "text-indigo-300",
      border: "border-indigo-500/30",
      label: "Admin",
    },
    MEMBER: {
      icon: User,
      bg: "bg-gray-500/10",
      text: "text-gray-300",
      border: "border-gray-500/30",
      label: "Member",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gray-800 animate-pulse" />
            <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm divide-y divide-gray-800/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-16 bg-gray-800 rounded-full animate-pulse" />
                  <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Members</h1>
              <p className="text-sm text-gray-400">
                Manage your workspace members and roles
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Members List */}
        <div className="rounded-xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm shadow-xl overflow-hidden">
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No members found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {members.map((member) => {
                const config = roleConfig[member.role];
                const RoleIcon = config.icon;
                const isCurrentUser = member.user._id === session?.user?.id;
                const isProcessing = actionInProgress === member.user._id;

                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 hover:bg-gray-800/20 transition-colors"
                  >
                    {/* Left - User info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-300">
                          {member.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-200 truncate">
                            {member.user.username}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{member.user.email}</p>
                      </div>
                    </div>

                    {/* Right - Role & Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Role Badge */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {config.label}
                      </div>

                      {/* Actions */}
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1">
                          {/* Owner can manage everyone except other owners */}
                          {currentUserRole === "OWNER" && member.role !== "OWNER" && (
                            <>
                              {member.role === "MEMBER" && (
                                <button
                                  onClick={() => changeRole(member.user._id, "ADMIN")}
                                  className="p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors text-gray-400 hover:text-indigo-300"
                                  title="Promote to Admin"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                              )}
                              {member.role === "ADMIN" && (
                                <button
                                  onClick={() => changeRole(member.user._id, "MEMBER")}
                                  className="p-1.5 hover:bg-gray-500/10 rounded-lg transition-colors text-gray-400 hover:text-gray-300"
                                  title="Demote to Member"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => changeRole(member.user._id, "OWNER")}
                                className="p-1.5 hover:bg-amber-500/10 rounded-lg transition-colors text-gray-400 hover:text-amber-300"
                                title="Transfer Ownership"
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeMember(member.user._id)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                title="Remove Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Admin can manage members only */}
                          {currentUserRole === "ADMIN" && member.role === "MEMBER" && (
                            <>
                              <button
                                onClick={() => changeRole(member.user._id, "ADMIN")}
                                className="p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors text-gray-400 hover:text-indigo-300"
                                title="Promote to Admin"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeMember(member.user._id)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                title="Remove Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}