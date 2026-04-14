"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Building2,
  Users,
  Loader2,
  ArrowRight,
  Calendar,
  Sparkles,
  Check,
} from "lucide-react";

export default function BrowseClient() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [userWorkspaceIds, setUserWorkspaceIds] = useState<Set<string>>(new Set());

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch public workspaces
        const browseRes = await fetch("/api/workspace/browse");
        const browseData = await browseRes.json();
        if (browseRes.ok) {
          setWorkspaces(browseData.workspaces);
        }

        // Fetch user's own workspaces to check membership
        const myRes = await fetch("/api/workspace/my");
        const myData = await myRes.json();
        if (myRes.ok) {
          const ids = new Set<string>(myData.workspaces.map((ws: any) => ws._id as string));
          setUserWorkspaceIds(ids);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const joinWorkspace = async (id: string) => {
    if (userWorkspaceIds.has(id)) return; // Already joined, shouldn't happen but safe

    setJoiningId(id);

    const res = await fetch("/api/workspace/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workspaceId: id }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push(`/dashboard/${id}`);
    } else {
      alert(data.error);
    }

    setJoiningId(null);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gray-800 animate-pulse" />
            <div className="h-8 w-64 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-800 animate-pulse" />
                    <div>
                      <div className="h-5 w-40 bg-gray-800 rounded animate-pulse mb-2" />
                      <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-9 w-20 bg-gray-800 rounded-lg animate-pulse" />
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
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Globe className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Browse Workspaces
            </h1>
            <p className="text-sm text-gray-400">
              Discover and join public workspaces
            </p>
          </div>
        </div>

        {/* Empty state */}
        {workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-200 mb-2">
              No public workspaces yet
            </h3>
            <p className="text-gray-400 text-center mb-8 max-w-md">
              There are no public workspaces available right now. Check back later or create your own!
            </p>
            <button
              onClick={() => router.push("/dashboard/create")}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20"
            >
              <Sparkles size={16} />
              Create a Workspace
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Workspace list */}
        <div className="space-y-3">
          {workspaces.map((ws) => {
            const isJoining = joiningId === ws._id;
            const isAlreadyJoined = userWorkspaceIds.has(ws._id);

            return (
              <div
                key={ws._id}
                className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 
                  rounded-xl p-5 hover:bg-gray-800/30 hover:border-gray-700/50 transition-all 
                  duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  {/* Left side - Workspace info */}
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gray-800/50 rounded-lg border border-gray-700/50 group-hover:border-indigo-500/30 transition-colors">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-200 text-lg group-hover:text-white transition-colors">
                        {ws.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created {formatRelativeTime(ws.createdAt)}
                        </span>
                        {ws.memberCount !== undefined && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Join button or Already Joined */}
                  {isAlreadyJoined ? (
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        bg-green-500/10 text-green-400 border border-green-500/30 cursor-default"
                    >
                      <Check size={14} />
                      Already Joined
                    </div>
                  ) : (
                    <button
                      onClick={() => joinWorkspace(ws._id)}
                      disabled={isJoining}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30
                        hover:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          Join Workspace
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}