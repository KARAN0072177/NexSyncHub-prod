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
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | null }>({ show: false, message: "", type: null });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

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
        showToast("Invite link copied to clipboard!", "success");
      } else {
        showToast(data.error || "Failed to generate invite", "error");
      }
    } catch {
      showToast("Something went wrong. Please try again.", "error");
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
      <div className="min-h-screen bg-[#090B14] p-6 md:p-10 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gray-800/80 animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-800/80 rounded-md animate-pulse" />
                <div className="h-4 w-32 bg-gray-800/50 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="h-11 w-40 bg-gray-800/80 rounded-xl animate-pulse" />
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#111423]/40 border border-gray-800/50 rounded-2xl p-6 min-h-[180px] flex flex-col justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gray-800/80 animate-pulse flex-shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-6 w-3/4 bg-gray-800/80 rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-gray-800/50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800/30">
                  <div className="h-4 w-20 bg-gray-800/50 rounded animate-pulse" />
                  <div className="h-8 w-24 bg-gray-800/50 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090B14] p-6 md:p-10 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
              <Building2 className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Your Workspaces
              </h1>
              <p className="text-gray-400 mt-1">
                Manage and access your collaborative spaces
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard/create")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 
              hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-sm font-semibold transition-all 
              shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Workspace
          </button>
        </div>

        {/* Workspaces List */}
        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-gray-800/60 rounded-3xl bg-[#111423]/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-24 h-24 rounded-3xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-6 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Building2 className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3 relative z-10">
              No workspaces yet
            </h3>
            <p className="text-gray-400 text-center mb-8 max-w-md relative z-10 text-lg">
              Create your first workspace to start collaborating with your team.
            </p>
            <button
              onClick={() => router.push("/dashboard/create")}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-950 hover:bg-gray-100 
                rounded-xl font-bold transition-all shadow-xl hover:-translate-y-1 relative z-10"
            >
              <Sparkles size={18} className="text-indigo-600" />
              Create Your First Workspace
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws) => {
              const config = roleConfig[ws.role as keyof typeof roleConfig] || roleConfig.MEMBER;

              return (
                <div
                  key={ws._id}
                  onClick={() => router.push(`/workspace/${ws._id}`)}
                  className="group relative bg-[#111423]/60 backdrop-blur-xl border border-gray-800/60 
                    rounded-2xl p-6 cursor-pointer hover:border-indigo-500/40 
                    transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 
                    hover:-translate-y-1 flex flex-col justify-between min-h-[180px] overflow-hidden"
                >
                  {/* Top Right Decorative Gradient Blob */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100" />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Workspace Avatar */}
                      {ws.avatar ? (
                        <img
                          src={ws.avatar}
                          alt={ws.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-700/50 shadow-inner group-hover:border-indigo-500/50 transition-all duration-300 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:border-indigo-500/50 transition-all duration-300 shrink-0">
                          {ws.name?.charAt(0)?.toUpperCase() || "W"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-100 text-lg group-hover:text-white transition-colors line-clamp-1">
                          {ws.name}
                        </h3>
                        <span
                          className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.color} ${config.border}`}
                        >
                          {ws.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer section inside card */}
                  <div className="mt-6 pt-4 border-t border-gray-800/50 flex items-center justify-between relative z-10">
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 group-hover:text-gray-400 transition-colors">
                      <Users size={14} /> Team Workspace
                    </span>
                    
                    <button
                      onClick={(e) => handleInvite(e, ws._id)}
                      disabled={copyingId === ws._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-gray-800/40 border border-gray-700 text-gray-300 
                        hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40 
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed z-20"
                    >
                      {copyingId === ws._id ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Invite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${
          toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl ${
          toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      </div>
    </div>
  );
}