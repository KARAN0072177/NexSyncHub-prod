"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Users,
  Copy,
  Loader2,
  ArrowRight,
  Sparkles,
  Hash,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch("/api/workspace/my");
        const data = await res.json();

        if (res.ok) {
          setWorkspaces(data.workspaces);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const handleInvite = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    setCopyingId(workspaceId);

    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await res.json();

      if (res.ok) {
        await navigator.clipboard.writeText(data.inviteLink);
        // You could replace alert with a toast notification
        alert("Invite link copied!");
      } else {
        alert(data.error);
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setCopyingId(null);
    }
  };

  const roleConfig = {
    OWNER: {
      color: "text-amber-300",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    ADMIN: {
      color: "text-indigo-300",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
    },
    MEMBER: {
      color: "text-gray-300",
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-800 animate-pulse" />
              <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-gray-800 rounded-xl animate-pulse" />
          </div>

          {/* Cards skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-800 animate-pulse" />
                    <div>
                      <div className="h-5 w-32 bg-gray-800 rounded animate-pulse mb-2" />
                      <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-gray-800 rounded-lg animate-pulse" />
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Your Workspaces
              </h1>
              <p className="text-sm text-gray-400">
                Manage and access your collaborative spaces
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard/create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 
              text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 
              hover:shadow-indigo-600/30"
          >
            <Plus size={16} />
            Create Workspace
          </button>
        </div>

        {/* Workspaces List */}
        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-200 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-400 text-center mb-8 max-w-md">
              Create your first workspace to start collaborating with your team.
            </p>
            <button
              onClick={() => router.push("/dashboard/create")}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20"
            >
              <Sparkles size={16} />
              Create Your First Workspace
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws) => {
              const config = roleConfig[ws.role as keyof typeof roleConfig] || roleConfig.MEMBER;

              return (
                <div
                  key={ws._id}
                  onClick={() => router.push(`/dashboard/${ws._id}`)}
                  className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 
                    rounded-xl p-5 cursor-pointer hover:bg-gray-800/30 hover:border-gray-700/50 
                    transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - Workspace info */}
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-gray-800/50 rounded-lg border border-gray-700/50 group-hover:border-indigo-500/30 transition-colors">
                        <Hash className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-200 text-lg group-hover:text-white transition-colors">
                          {ws.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}
                          >
                            {ws.role}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users size={12} />
                            {/* You could add member count here if available */}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleInvite(e, ws._id)}
                        disabled={copyingId === ws._id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                          bg-gray-800/50 border border-gray-700 text-gray-300 
                          hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/30 
                          transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {copyingId === ws._id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Copying...
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Invite
                          </>
                        )}
                      </button>
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
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