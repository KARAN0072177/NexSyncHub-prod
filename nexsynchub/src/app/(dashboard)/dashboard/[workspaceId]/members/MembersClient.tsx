"use client";

import { useEffect, useState } from "react";

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

  // 📩 Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch(
        `/api/workspace/members?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (res.ok) {
        setMembers(data.members);
      }

      setLoading(false);
    };

    fetchMembers();
  }, [workspaceId]);

  // 🔥 Remove member
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

    setMembers((prev) =>
      prev.filter((m) => m.user._id !== userId)
    );
  };

  // 🔥 Change role
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
        m.user._id === userId ? { ...m, role: role as "OWNER" | "ADMIN" | "MEMBER" } : m
      )
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <h1 className="text-2xl font-semibold">Members</h1>

      {/* List */}
      <div className="border rounded-lg divide-y">

        {members.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between p-4"
          >
            {/* Left */}
            <div>
              <p className="font-medium">
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
                className={`text-xs px-2 py-1 rounded 
                ${
                  member.role === "OWNER"
                    ? "bg-yellow-100 text-yellow-700"
                    : member.role === "ADMIN"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {member.role}
              </span>

              {/* Actions */}
              <div className="flex gap-2">

                {/* Promote */}
                {member.role === "MEMBER" && (
                  <button
                    onClick={() =>
                      changeRole(member.user._id, "ADMIN")
                    }
                    className="text-xs bg-green-100 px-2 py-1 rounded"
                  >
                    Make Admin
                  </button>
                )}

                {/* Demote */}
                {member.role === "ADMIN" && (
                  <button
                    onClick={() =>
                      changeRole(member.user._id, "MEMBER")
                    }
                    className="text-xs bg-gray-200 px-2 py-1 rounded"
                  >
                    Demote
                  </button>
                )}

                {/* Transfer ownership */}
                {member.role !== "OWNER" && (
                  <button
                    onClick={() =>
                      changeRole(member.user._id, "OWNER")
                    }
                    className="text-xs bg-yellow-100 px-2 py-1 rounded"
                  >
                    Make Owner
                  </button>
                )}

                {/* Remove */}
                {member.role !== "OWNER" && (
                  <button
                    onClick={() =>
                      removeMember(member.user._id)
                    }
                    className="text-xs bg-red-100 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                )}

              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}