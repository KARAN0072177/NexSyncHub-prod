"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  CheckCircle2,
  MessageSquare,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ActivityItem = {
  type: "task" | "message";
  title: string;
  createdAt: string;
};

type ProfileRecentActivityProps = {
  activity?: ActivityItem[];
};

const ITEMS_PER_PAGE = 5;

const formatTime = (dateString: string) => {
  const date = new Date(dateString);

  const now = new Date();

  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "Just now";

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
};

export default function ProfileRecentActivity({
  activity,
}: ProfileRecentActivityProps) {

  const [showAll, setShowAll] = useState(false);

  // ✅ Prevent undefined crashes
  const safeActivity = activity || [];

  const visibleActivity = showAll
    ? safeActivity
    : safeActivity.slice(0, ITEMS_PER_PAGE);

  return (
    <div
      className="bg-gray-900/40 border border-gray-800
      rounded-3xl p-6 backdrop-blur-sm"
    >

      {/* Header */}
      <div className="mb-6">

        <h2
          className="text-xl font-semibold text-white
          flex items-center gap-2"
        >
          <Activity className="w-5 h-5 text-indigo-400" />

          Recent Activity
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          Your latest collaboration and productivity updates.
        </p>

      </div>

      <div className="relative">

        {/* Empty state */}
        {safeActivity.length === 0 ? (

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-dashed border-gray-800
            rounded-2xl p-10 text-center"
          >

            <div
              className="w-14 h-14 rounded-full bg-gray-800/30
              mx-auto mb-4 flex items-center justify-center"
            >
              <Activity className="w-7 h-7 text-gray-500" />
            </div>

            <h3 className="text-lg font-medium text-gray-300">
              No recent activity
            </h3>

            <p
              className="text-sm text-gray-500 mt-2
              max-w-[240px] mx-auto"
            >
              Your recent tasks and messages will appear here once
              you start collaborating.
            </p>

          </motion.div>

        ) : (

          <div
            className="max-h-[480px] overflow-y-auto
            pr-2 custom-scrollbar"
          >

            {/* Timeline line */}
            <div
              className="absolute left-5 top-0 bottom-0
              w-px bg-gradient-to-b
              from-indigo-500/30 via-gray-700/50 to-transparent"
            />

            <div className="space-y-4">

              <AnimatePresence initial={false}>

                {visibleActivity.map((item, index) => {

                  const isTask = item.type === "task";

                  const uniqueKey =
                    `${item.type}-${item.title}-${item.createdAt}-${index}`;

                  return (

                    <motion.div
                      key={uniqueKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        marginBottom: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}
                      layout
                      className="relative pl-10"
                    >

                      {/* Timeline dot */}
                      <div
                        className={`absolute left-3 top-4
                        w-4 h-4 -translate-x-1/2
                        rounded-full border-2
                        ${
                          isTask
                            ? "bg-green-500/20 border-green-400/60"
                            : "bg-indigo-500/20 border-indigo-400/60"
                        }`}
                      >

                        <span
                          className="absolute inset-0
                          flex items-center justify-center"
                        >

                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isTask
                                ? "bg-green-400"
                                : "bg-indigo-400"
                            }`}
                          />

                        </span>

                      </div>

                      {/* Card */}
                      <div
                        className="bg-gray-950/40 border border-gray-800
                        rounded-2xl p-4 hover:border-indigo-500/30
                        transition-all duration-200"
                      >

                        <div className="flex items-start gap-3">

                          {/* Icon */}
                          <div
                            className={`w-10 h-10 rounded-xl
                            flex items-center justify-center
                            border flex-shrink-0
                            ${
                              isTask
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-indigo-500/10 border-indigo-500/20"
                            }`}
                          >

                            {isTask ? (

                              <CheckCircle2
                                className="w-5 h-5 text-green-400"
                              />

                            ) : (

                              <MessageSquare
                                className="w-5 h-5 text-indigo-400"
                              />

                            )}

                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">

                            <p
                              className="text-sm text-gray-200
                              break-words leading-relaxed"
                            >
                              {item.title}
                            </p>

                            <div
                              className="flex items-center
                              gap-2 mt-1.5"
                            >

                              <span className="text-xs text-gray-500">
                                {formatTime(item.createdAt)}
                              </span>

                              <span
                                className="text-[10px] uppercase
                                tracking-wider text-gray-600
                                bg-gray-800/50 px-2 py-0.5
                                rounded-full"
                              >
                                {isTask ? "Task" : "Message"}
                              </span>

                            </div>

                          </div>

                        </div>

                      </div>

                    </motion.div>

                  );

                })}

              </AnimatePresence>

            </div>

            {/* Toggle */}
            {safeActivity.length > ITEMS_PER_PAGE && (

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowAll(!showAll)}
                className="w-full mt-4 py-2.5 rounded-xl
                bg-white/5 border border-gray-800
                text-gray-400 hover:text-white
                hover:border-gray-700 hover:bg-white/10
                transition-all duration-200
                flex items-center justify-center gap-2"
              >

                {showAll ? (
                  <>
                    <ChevronUp size={16} />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Show all {safeActivity.length} activities
                  </>
                )}

              </motion.button>

            )}

          </div>

        )}

      </div>

    </div>
  );
}