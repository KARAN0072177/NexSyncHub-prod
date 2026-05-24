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
import { motion, AnimatePresence } from "framer-motion";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg: "#03060F",
  surface: "rgba(8,16,40,0.70)",
  surfaceHi: "rgba(10,22,52,0.85)",
  border: "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent: "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  violet: "#7C3AED",
  violetLo: "rgba(124,58,237,0.12)",
  violetMd: "rgba(124,58,237,0.25)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  emeraldMd: "rgba(16,185,129,0.25)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

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
      router.push(`/workspace/${id}`);
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
      <div className="min-h-screen relative overflow-hidden" style={{ background: T.bg }}>
        {/* ambient background */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: T.accentLo }} />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 relative z-10 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }} />
            <div className="h-10 w-64 rounded-xl animate-pulse" style={{ background: T.surface, border: `1px solid ${T.border}` }} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 rounded-3xl animate-pulse"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { font-family:'DM Sans',sans-serif; }
      `}</style>

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -160, left: -120, width: 600, height: 600, borderRadius: "50%", background: "rgba(61,123,255,0.06)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: 300, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.02) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 relative z-10 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
            <Globe className="w-7 h-7" style={{ color: T.accent }} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
              Browse Workspaces
            </h1>
            <p className="text-sm mt-1" style={{ color: T.muted }}>
              Discover and join public workspaces
            </p>
          </div>
        </motion.div>

        {/* Empty state */}
        {workspaces.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-[2.5rem] relative overflow-hidden group" style={{ background: T.surface, border: `1px dashed ${T.borderHi}`, backdropFilter: "blur(20px)" }}>
              <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl relative z-10" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.borderHi}` }}>
                <Building2 className="w-10 h-10" style={{ color: T.muted }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10" style={{ fontFamily: "'Sora',sans-serif" }}>
                No public workspaces yet
              </h3>
              <p className="text-center mb-8 max-w-md relative z-10 text-sm" style={{ color: T.muted }}>
                There are no public workspaces available right now. Check back later or create your own!
              </p>
              <button
                onClick={() => router.push("/dashboard/create")}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl hover:-translate-y-1 relative z-10 text-white"
                style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, boxShadow: `0 8px 24px ${T.accentLo}` }}
              >
                <Sparkles size={16} />
                Create a Workspace
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Workspace list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {workspaces.map((ws, i) => {
              const isJoining = joiningId === ws._id;
              const isAlreadyJoined = userWorkspaceIds.has(ws._id);
              const name = ws.name ?? "Workspace";
              const initials = name.slice(0, 2).toUpperCase();
              const hue = name.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360;

              return (
                <motion.div
                  key={ws._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-5 cursor-pointer"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentMd; e.currentTarget.style.boxShadow = `0 8px 32px ${T.accentLo}`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                  onClick={() => {
                    if (isAlreadyJoined) {
                      router.push(`/workspace/${ws._id}`);
                    }
                  }}
                >
                  {/* Decorative Gradient Blob */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none" style={{ background: T.accentLo }} />

                  {/* Left side - Workspace info */}
                  <div className="flex items-center gap-4 relative z-10 min-w-0 w-full sm:w-auto">
                    {ws.avatar ? (
                      <img 
                        src={ws.avatar} 
                        alt={name} 
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-lg" 
                        style={{ border: `1px solid ${T.borderHi}` }} 
                        onError={(e) => {
                          console.error(`Failed to load avatar from S3 for workspace: ${name}`, ws.avatar);
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3D7BFF&color=fff&rounded=true&bold=true`;
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-lg"
                        style={{ background: `hsla(${hue},65%,45%,0.15)`, border: `1px solid hsla(${hue},65%,45%,0.28)`, color: `hsl(${hue},70%,68%)`, fontFamily: "'Sora',sans-serif" }}>
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-lg transition-colors truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
                        {name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: T.muted }}>
                          <Calendar className="w-3.5 h-3.5" />
                          {formatRelativeTime(ws.createdAt)}
                        </span>
                        {ws.memberCount !== undefined && (
                          <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: T.muted }}>
                            <Users className="w-3.5 h-3.5" />
                            {ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Join button or Already Joined */}
                  <div className="relative z-10 shrink-0 w-full sm:w-auto">
                    {isAlreadyJoined ? (
                      <div
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all w-full sm:w-auto cursor-default uppercase tracking-wide"
                        style={{ background: T.emeraldLo, border: `1px solid ${T.emeraldMd}`, color: T.emerald }}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        Joined
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          joinWorkspace(ws._id);
                        }}
                        disabled={isJoining}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, boxShadow: `0 4px 16px ${T.accentLo}` }}
                      >
                        {isJoining ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Joining
                          </>
                        ) : (
                          <>
                            Join
                            <ArrowRight size={14} strokeWidth={2.5} />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}