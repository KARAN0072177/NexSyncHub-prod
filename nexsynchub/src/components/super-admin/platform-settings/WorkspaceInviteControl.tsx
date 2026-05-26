// WorkspaceInviteControl.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Link2Off,
} from "lucide-react";

// Glassmorphism colour tokens
const T = {
  surface: "rgba(8,16,40,0.35)",          // low opacity for deep blur
  surfaceHi: "rgba(10,22,52,0.50)",        // slightly more opaque for card
  border: "rgba(99,140,255,0.12)",
  borderHi: "rgba(99,140,255,0.22)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  emeraldMd: "rgba(16,185,129,0.25)",
  rose: "#FF4D6D",
  roseLo: "rgba(255,77,109,0.12)",
  roseMd: "rgba(255,77,109,0.25)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

export default function WorkspaceInviteControl() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | null;
  }>({ show: false, message: "", type: null });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 5000);
  };

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/platform-settings");
        const data = await res.json();
        if (res.ok) {
          setEnabled(data.settings.allowWorkspaceInvites);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Toggle setting
  const handleToggle = async () => {
    try {
      const newValue = !enabled;
      setEnabled(newValue);
      setSaving(true);

      const res = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowWorkspaceInvites: newValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEnabled(!newValue); // rollback
        showToast(data.error || "Failed to update setting", "error");
      } else {
        showToast(
          newValue
            ? "Workspace invites are now allowed."
            : "Workspace invites are now disabled.",
          "success"
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  // Loading skeleton with glass effect
  if (loading) {
    return (
      <div className="relative mt-6">
        <div
          className="rounded-[2rem] p-8 sm:p-10 overflow-hidden"
          style={{
            background: T.surfaceHi,
            backdropFilter: "blur(48px) saturate(180%)",
            border: `1px solid ${T.borderHi}`,
            boxShadow: `inset 0 1px 0 ${T.border}`,
          }}
        >
          <div className="flex items-start gap-5 animate-pulse">
            <div
              className="w-14 h-14 rounded-2xl"
              style={{ background: "rgba(99,140,255,0.08)" }}
            />
            <div className="flex-1 space-y-3 mt-1.5">
              <div
                className="h-5 w-48 rounded-lg"
                style={{ background: "rgba(99,140,255,0.08)" }}
              />
              <div
                className="h-4 w-3/4 max-w-lg rounded-lg"
                style={{ background: "rgba(99,140,255,0.05)" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative rounded-[2rem] p-7 sm:p-10 overflow-hidden shadow-2xl group/card"
        style={{
          background: T.surfaceHi,
          backdropFilter: "blur(48px) saturate(180%)",
          border: `1px solid ${T.borderHi}`,
          boxShadow: `0 25px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 ${T.border}`,
        }}
      >
        {/* Top inner glass reflection */}
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-[2rem] opacity-20 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${
              enabled ? T.emerald : T.rose
            }, transparent)`,
          }}
        />

        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-[80px] transition-all duration-700"
          style={{
            background: enabled ? T.emerald : T.rose,
            transform: enabled ? "scale(1.2)" : "scale(0.8)",
          }}
        />

        {/* Header with toggle */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
          <div className="flex items-start gap-5">
            {/* Glass icon container */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 relative overflow-hidden"
              style={{
                background: enabled ? T.emeraldLo : T.roseLo,
                backdropFilter: "blur(12px)",
                border: `1px solid ${enabled ? T.emeraldMd : T.roseMd}`,
              }}
            >
              {enabled ? (
                <Link size={24} style={{ color: T.emerald }} />
              ) : (
                <Link2Off size={24} style={{ color: T.rose }} />
              )}
              {/* subtle glass shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            </motion.div>

            <div>
              <h2
                className="text-xl sm:text-2xl font-bold text-white mb-2"
                style={{
                  fontFamily: "'Sora',sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                Workspace Invites
              </h2>
              <p
                className="text-sm leading-relaxed max-w-2xl"
                style={{ color: T.muted }}
              >
                Control whether users can generate invite links and add new
                members to their workspaces. Disabling this prevents any new
                workspace invitations globally.
              </p>

              {/* Status badge with glass */}
              <div className="mt-5">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-500"
                  style={{
                    background: enabled ? T.emeraldLo : T.roseLo,
                    backdropFilter: "blur(8px)",
                    color: enabled ? T.emerald : T.rose,
                    border: `1px solid ${enabled ? T.emeraldMd : T.roseMd}`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: enabled ? T.emerald : T.rose }}
                  />
                  {enabled ? "Invites Allowed" : "Invites Blocked"}
                </span>
              </div>
            </div>
          </div>

          {/* Glass toggle button with state icon */}
          <button
            onClick={handleToggle}
            disabled={saving}
            className="relative w-[64px] h-8 rounded-full transition-all duration-500 outline-none flex items-center px-1 cursor-pointer shrink-0 shadow-inner"
            style={{
              background: enabled
                ? `linear-gradient(90deg, ${T.emerald}, #34D399)`
                : "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${
                enabled ? "transparent" : "rgba(255,255,255,0.15)"
              }`,
              opacity: saving ? 0.7 : 1,
            }}
            aria-label={
              enabled ? "Disable workspace invites" : "Enable workspace invites"
            }
          >
            <motion.div
              animate={{ x: enabled ? 32 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-[22px] h-[22px] rounded-full bg-white shadow-md flex items-center justify-center"
            >
              {saving ? (
                <Loader2 size={10} className="animate-spin text-gray-400" />
              ) : enabled ? (
                <Link size={12} className="text-emerald-600" />
              ) : (
                <Link2Off size={12} className="text-rose-500" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Warning block when invites disabled */}
        <AnimatePresence>
          {!enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{
                  background: T.roseLo,
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${T.roseMd}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,77,109,0.2)" }}
                >
                  <ShieldAlert size={20} style={{ color: T.rose }} />
                </div>
                <div>
                  <p
                    className="font-bold text-sm mb-1"
                    style={{
                      color: "#fff",
                      fontFamily: "'Sora',sans-serif",
                    }}
                  >
                    Workspace invites are strictly disabled
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Users will no longer be able to generate new invite links
                    or add members to their workspaces until this setting is
                    re-enabled.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Glass toast notification with progress bar */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
            </div>
            <span className="text-sm font-medium text-gray-200">
              {toast.message}
            </span>
            <button
              onClick={() => setToast((p) => ({ ...p, show: false }))}
              className="ml-2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <XCircle size={14} />
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 rounded-b-2xl overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.8, ease: "linear" }}
                className={`h-full ${
                  toast.type === "success"
                    ? "bg-emerald-400/50"
                    : "bg-red-400/50"
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}