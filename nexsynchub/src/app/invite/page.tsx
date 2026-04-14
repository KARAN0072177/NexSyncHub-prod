"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function InvitePage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error);
      } else {
        setMessage("Joined successfully! Redirecting to dashboard...");
        setIsSuccess(true);

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
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
              <Building2 className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
              Join Workspace
            </h1>
            <p className="text-sm text-gray-400">
              You've been invited to collaborate
            </p>
          </div>

          {/* Content */}
          <div className="text-center space-y-6">
            {!token ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Invalid invite link</span>
                </div>
                <p className="text-sm text-red-300/80 mt-2">
                  The invitation link appears to be broken or expired.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                  <p className="text-gray-300">
                    You're about to join a workspace. Click the button below to accept the invitation.
                  </p>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={loading || isSuccess}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 
                    disabled:cursor-not-allowed text-white rounded-xl py-3 px-4 font-medium 
                    transition-all flex items-center justify-center gap-2 shadow-lg 
                    shadow-indigo-600/20 hover:shadow-indigo-600/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Joined!
                    </>
                  ) : (
                    <>
                      Join Workspace
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}

            {/* Message display */}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm text-center border
                  ${
                    isSuccess
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
              >
                {message}
              </div>
            )}

            {/* Back link */}
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}