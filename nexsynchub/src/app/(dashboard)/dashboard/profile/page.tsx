"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  User,
  RefreshCw,
  Sparkles,
  ArrowDown,
} from "lucide-react";

import ProfileBasicInfo from "@/components/profile/ProfileBasicInfo";
import ProfileWorkspaceStats from "@/components/profile/ProfileWorkspaceStats";
import ProfileRecentActivity from "@/components/profile/ProfileRecentActivity";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, workspaceRes, statsRes, activityRes] =
        await Promise.all([
          fetch("/api/profile/me"),
          fetch("/api/workspace/my"),
          fetch("/api/profile/stats"),
          fetch("/api/profile/activity"),
        ]);

      const profileData = await profileRes.json();
      const workspaceData = await workspaceRes.json();
      const statsData = await statsRes.json();
      const activityData = await activityRes.json();

      if (profileRes.ok) {
        setProfile(profileData.profile);
      } else {
        setError(profileData.error || "Failed to load profile");
      }

      if (workspaceRes.ok) {
        setWorkspaces(workspaceData.workspaces || []);
      }

      if (statsRes.ok) {
        setStats(statsData.stats);
      } else if (!error) {
        setError(statsData.error || "Failed to load stats");
      }

      if (activityRes.ok) {
        setActivity(activityData.activity || []);
      }
    } catch (err) {
      console.error("Profile page fetch error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full space-y-8">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-10 w-48 bg-gray-800/50 rounded-xl animate-pulse" />
            <div className="h-5 w-96 bg-gray-800/30 rounded-lg animate-pulse" />
          </div>
          {/* Sections skeleton */}
          <div className="grid gap-6">
            <div className="h-64 bg-gray-900/40 rounded-3xl border border-gray-800 animate-pulse" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-900/40 rounded-3xl border border-gray-800 animate-pulse" />
              <div className="h-64 bg-gray-900/40 rounded-3xl border border-gray-800 animate-pulse" />
            </div>
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sm text-gray-500 flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          Loading your profile...
        </motion.p>
      </div>
    );
  }

  // Error state with retry
  if (error || !profile || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gray-900/60 border border-gray-800 rounded-3xl p-10 max-w-md backdrop-blur-md"
        >
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Couldn’t load profile
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {error || "Something went wrong. We can’t display your data right now."}
          </p>
          <button
            onClick={fetchProfileData}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header with refresh */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-indigo-400" />
              Your Profile
            </h1>
            <p className="text-gray-400 mt-2 max-w-xl">
              Manage your identity, collaboration, and workspace activity.
            </p>
          </div>
          <button
            onClick={fetchProfileData}
            disabled={loading}
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-gray-700 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </motion.div>

        {/* Sections with staggered entrance */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="space-y-6"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <ProfileBasicInfo initialProfile={profile} />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <ProfileWorkspaceStats workspaces={workspaces} stats={stats} />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <ProfileRecentActivity activity={activity} />
          </motion.div>
        </motion.div>

        {/* Footer subtle note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-600 py-4"
        >
          Data updates automatically. Last refreshed just now.
        </motion.p>
      </div>
    </div>
  );
}