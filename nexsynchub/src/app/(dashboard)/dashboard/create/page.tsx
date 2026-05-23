"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe, Lock, Loader2, ArrowRight, Sparkles, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateWorkspacePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, isPrivate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />

        <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Create Workspace
              </h1>
              <p className="text-sm text-gray-400">
                Set up a new space for your team
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            {/* Workspace Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Workspace name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g., Acme Corp"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3
                    text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Privacy Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Privacy setting
              </label>
              <div className="flex gap-2 p-1 bg-gray-800/50 rounded-xl border border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isPrivate
                      ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/30"
                    }`}
                >
                  <Lock className="w-4 h-4" />
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${!isPrivate
                      ? "bg-amber-600/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/30"
                    }`}
                >
                  <Globe className="w-4 h-4" />
                  Public
                </button>
              </div>

              {/* Warning for public workspaces */}
              {!isPrivate && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/80">
                    This workspace will be visible to everyone. Anyone can join without approval.
                  </p>
                </div>
              )}

              {/* Hint for private */}
              {isPrivate && (
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Only invited members can access this workspace
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed 
                text-white rounded-xl py-3 px-4 font-medium transition-all flex items-center justify-center gap-2
                shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Error Modal */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => setError("")}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-gray-900/90 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-6 shadow-2xl shadow-red-500/10"
            >
              <button
                onClick={() => setError("")}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center gap-4 mt-2">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner shadow-red-500/20">
                  <ShieldAlert className="w-8 h-8 text-red-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Workspace Name Blocked</h3>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {error}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    Please choose a professional and community-safe workspace name.
                  </p>
                </div>

                <button
                  onClick={() => setError("")}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-semibold text-red-400 transition-all mt-2"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}