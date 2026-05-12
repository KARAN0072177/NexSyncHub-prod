"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  Hash,
  Layers,
  Zap,
  Sparkles,
} from "lucide-react";

type ProfileWorkspaceStatsProps = {
  workspaces: any[];
  stats: {
    workspaceCount: number;
    tasksCompleted: number;
    tasksAssigned: number;
    messagesSent: number;
  };
};

// Animated number counter hook
function useCountUp(end: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * end);
      if (isMounted) setCount(current);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      isMounted = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);

  return count;
}

function StatCard({
  icon: Icon,
  label,
  value,
  index,
}: {
  icon: any;
  label: string;
  value: number;
  index: number;
}) {
  const animatedValue = useCountUp(value, 1500);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group bg-gray-950/40 border border-gray-800 rounded-2xl p-5 backdrop-blur-sm hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <motion.p
        className="text-2xl font-bold text-white tabular-nums"
        key={value}
      >
        {animatedValue}
      </motion.p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </motion.div>
  );
}

export default function ProfileWorkspaceStats({
  workspaces,
  stats,
}: ProfileWorkspaceStatsProps) {
  const statCards = [
    { label: "Workspaces", value: stats.workspaceCount, icon: Building2 },
    { label: "Tasks Completed", value: stats.tasksCompleted, icon: CheckCircle2 },
    { label: "Tasks Assigned", value: stats.tasksAssigned, icon: ClipboardList },
    { label: "Messages Sent", value: stats.messagesSent, icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
      {/* Workspaces Column */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm"
      >
        {/* Header with decoration */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              Your Workspaces
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Spaces where you collaborate and contribute.
            </p>
          </div>
          {workspaces.length > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              {workspaces.length} active
            </span>
          )}
        </div>

        {/* Workspace list */}
        <div className="space-y-3">
          {workspaces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-dashed border-gray-800 rounded-2xl p-10 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gray-800/30 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-1">No workspaces yet</p>
              <p className="text-xs text-gray-600 max-w-[200px] mx-auto">
                You haven’t joined any workspace. Start collaborating with your team.
              </p>
            </motion.div>
          ) : (
            workspaces.map((ws, index) => (
              <motion.div
                key={ws._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.01, borderColor: "rgba(129, 140, 248, 0.3)" }}
                className="group flex items-center justify-between bg-gray-950/40 border border-gray-800 rounded-2xl p-4 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-sm">
                    <Hash className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-200 group-hover:text-white transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-400/50"></span>
                      {ws.role}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300" />
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Productivity Column */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap size={20} className="text-amber-400" />
            Productivity Insights
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Your activity and collaboration stats.
          </p>
        </div>

        {/* Stats grid with animated cards */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat, index) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              index={index}
            />
          ))}
        </div>

        {/* Optional tiny visual flourish */}
        <div className="mt-6 flex items-center justify-end">
          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
            <Sparkles size={12} />
            Updated in real‑time
          </span>
        </div>
      </motion.div>
    </div>
  );
}