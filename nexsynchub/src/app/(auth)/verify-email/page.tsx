// verifyemail.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token");
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        } else {
          setStatus("success");
          setMessage("Email verified successfully! You can now log in.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />

        <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="inline-flex p-4 rounded-full mb-4 border
            ${status === 'loading' ? 'bg-indigo-500/10 border-indigo-500/20' : 
              status === 'success' ? 'bg-green-500/10 border-green-500/20' : 
              'bg-red-500/10 border-red-500/20'}">
            {status === "loading" && <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />}
            {status === "success" && <CheckCircle className="w-8 h-8 text-green-400" />}
            {status === "error" && <XCircle className="w-8 h-8 text-red-400" />}
          </div>

          <h1 className="text-xl font-semibold text-white mb-2">
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified"}
            {status === "error" && "Verification Failed"}
          </h1>

          <p className="text-gray-300 mb-6">{message}</p>

          {status === "success" && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 
                  text-gray-200 rounded-xl font-medium transition-all border border-gray-700"
              >
                Back to Login
              </Link>
              <p className="text-xs text-gray-500">
                If the problem persists, please request a new verification email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}