"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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

  const [currentUserRole, setCurrentUserRole] = useState<
    "OWNER" | "ADMIN" | "MEMBER" | null
  >(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchMembers = async () => {
      const res = await fetch(
        `/api/workspace/members?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (res.ok) {
        setMembers(data.members);

        const me = data.members.find(
          (m: any) => m.user._id === session?.user?.id
        );

        if (me) setCurrentUserRole(me.role);
      }

      setLoading(false);
    };

    fetchMembers();
  }, [workspaceId, status]);

  const removeMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    await fetch("/api/workspace/member/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        targetUserId: userId,
      }),
    });

    setMembers((prev) => prev.filter((m) => m.user._id !== userId));
  };

  const changeRole = async (userId: string, role: string) => {
    if (!confirm(`Change role to ${role}?`)) return;

    await fetch("/api/workspace/member/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        targetUserId: userId,
        role,
      }),
    });

    setMembers((prev) =>
      prev.map((m) =>
        m.user._id === userId
          ? { ...m, role: role as "OWNER" | "ADMIN" | "MEMBER" }
          : m
      )
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        Loading members...
      </div>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-gray-500">
          Manage your workspace members and roles
        </p>
      </div>

      {/* List */}
      <div className="bg-white border rounded-xl shadow-sm divide-y">
        {members.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No members found.
          </div>
        )}

        {members.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
          >
            {/* Left */}
            <div>
              <p className="font-medium text-gray-800">
                {member.user.username}
              </p>
              <p className="text-sm text-gray-500">
                {member.user.email}
              </p>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium
                ${
                  member.role === "OWNER"
                    ? "bg-yellow-100 text-yellow-700"
                    : member.role === "ADMIN"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {member.role}
              </span>

              {/* Actions */}
              <div className="flex gap-2">
                {currentUserRole === "OWNER" && member.role !== "OWNER" && (
                  <>
                    {member.role === "MEMBER" && (
                      <button
                        onClick={() => changeRole(member.user._id, "ADMIN")}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-md transition"
                      >
                        Make Admin
                      </button>
                    )}

                    {member.role === "ADMIN" && (
                      <button
                        onClick={() => changeRole(member.user._id, "MEMBER")}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-md transition"
                      >
                        Demote
                      </button>
                    )}

                    <button
                      onClick={() => changeRole(member.user._id, "OWNER")}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded-md transition"
                    >
                      Make Owner
                    </button>

                    <button
                      onClick={() => removeMember(member.user._id)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md transition"
                    >
                      Remove
                    </button>
                  </>
                )}

                {currentUserRole === "ADMIN" && member.role === "MEMBER" && (
                  <>
                    <button
                      onClick={() => changeRole(member.user._id, "ADMIN")}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-md transition"
                    >
                      Make Admin
                    </button>

                    <button
                      onClick={() => removeMember(member.user._id)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md transition"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}