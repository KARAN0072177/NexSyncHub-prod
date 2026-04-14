// SetUsernameClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Loader2, ArrowRight, AtSign, Sparkles } from "lucide-react";

export default function SetUsernameClient() {
  const router = useRouter();
  const { update } = useSession();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        await update();
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

      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />

        <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4">
              <User className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
              Choose your username
            </h1>
            <p className="text-sm text-gray-400">
              This is how others will see you in workspaces
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="johndoe"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3
                    text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Only letters, numbers, and underscores"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Only letters, numbers, and underscores
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed 
                text-white rounded-xl py-3 px-4 font-medium transition-all flex items-center justify-center gap-2
                shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              You can change this later in settings
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}