// AnnouncementSettings.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  AlertTriangle,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";

// Glassmorphism colour tokens
const T = {
  surface: "rgba(8,16,40,0.35)",          // low-opacity for deep blur
  surfaceHi: "rgba(10,22,52,0.50)",        // slightly more opaque for card
  border: "rgba(99,140,255,0.12)",
  borderHi: "rgba(99,140,255,0.22)",
  accent: "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  emeraldMd: "rgba(16,185,129,0.25)",
  amber: "#F97316",
  amberLo: "rgba(249,115,22,0.12)",
  amberMd: "rgba(249,115,22,0.25)",
  rose: "#FF4D6D",
  roseLo: "rgba(255,77,109,0.12)",
  roseMd: "rgba(255,77,109,0.25)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

const TYPE_COLORS: any = {
  info: {
    bg: "rgba(61,123,255,0.12)",
    border: "rgba(61,123,255,0.25)",
    text: "#3D7BFF",
  },
  warning: {
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
    text: "#F59E0B",
  },
  danger: {
    bg: "rgba(251,113,133,0.12)",
    border: "rgba(251,113,133,0.25)",
    text: "#FB7185",
  },
  success: {
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    text: "#10B981",
  },
};

const MAX_CHARS = 300;

const getRelativeTime = (dateStr: string) => {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "Already passed";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours} hr`;
  const days = Math.floor(hours / 24);
  return `in ${days} day${days > 1 ? "s" : ""}`;
};

export default function AnnouncementSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState("info");

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | null;
  }>({ show: false, message: "", type: null });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 5000);
  };

  const toLocalDatetime = (val: string | null) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/platform-settings");
        const data = await res.json();

        if (res.ok) {
          const settings = data.settings;
          setEnabled(settings.announcementEnabled);
          setText(settings.announcementText || "");
          setType(settings.announcementType || "info");
          setStartAt(toLocalDatetime(settings.announcementStartAt));
          setEndAt(toLocalDatetime(settings.announcementEndAt));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (enabled && !text.trim()) {
      showToast("Please enter an announcement message", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          announcementEnabled: enabled,
          announcementText: text,
          announcementType: type,
          announcementStartAt: startAt ? new Date(startAt) : null,
          announcementEndAt: endAt ? new Date(endAt) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to update announcement", "error");
        return;
      }
      showToast("Announcement settings updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const charsLeft = MAX_CHARS - text.length;
  const isOverLimit = charsLeft < 0;
  const canSave = !isOverLimit && (!enabled || text.trim().length > 0);

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
          <div className="mt-8 space-y-6 animate-pulse">
            <div
              className="h-20 w-full rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div className="grid grid-cols-3 gap-6">
              <div
                className="h-10 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              <div
                className="h-10 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              <div
                className="h-10 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const previewColor = TYPE_COLORS[type];

  return (
    <div className="relative mt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="relative rounded-[2rem] p-7 sm:p-10 overflow-hidden shadow-2xl group/card"
        style={{
          background: T.surfaceHi,
          backdropFilter: "blur(48px) saturate(180%)",
          border: `1px solid ${T.borderHi}`,
          boxShadow: `0 25px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 ${T.border}`,
        }}
      >
        {/* Top inner highlight (glass reflection) */}
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-[2rem] opacity-20 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
          }}
        />

        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-[80px] transition-all duration-700"
          style={{
            background: enabled ? T.accent : "transparent",
            transform: enabled ? "scale(1.2)" : "scale(0.8)",
          }}
        />

        {/* Header with toggle */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
          <div className="flex items-start gap-5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 relative overflow-hidden"
              style={{
                background: enabled ? T.accentLo : "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${enabled ? T.accentMd : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <Megaphone
                size={24}
                style={{ color: enabled ? T.accent : T.muted }}
              />
              {enabled && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                </span>
              )}
            </motion.div>

            <div>
              <h2
                className="text-xl sm:text-2xl font-bold text-white mb-2"
                style={{
                  fontFamily: "'Sora',sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                Global Announcement
              </h2>
              <p
                className="text-sm leading-relaxed max-w-2xl"
                style={{ color: T.muted }}
              >
                Broadcast platform-wide announcements to all users across
                NexSyncHub. Set a schedule or publish immediately.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {/* Status badge – glass pill */}
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-500"
                  style={{
                    background: enabled ? T.accentLo : "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(8px)",
                    color: enabled ? T.accent : T.muted,
                    border: `1px solid ${enabled ? T.accentMd : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${enabled ? "animate-pulse" : ""}`}
                    style={{ background: enabled ? T.accent : T.muted }}
                  />
                  {enabled ? "Announcement Active" : "Announcement Disabled"}
                </span>

                {enabled && !text && (
                  <span className="flex items-center gap-1 text-xs text-amber-400/80">
                    <AlertTriangle size={12} />
                    Message required
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Glass toggle button */}
          <button
            onClick={() => setEnabled(!enabled)}
            className="relative w-[64px] h-8 rounded-full transition-all duration-500 outline-none flex items-center px-1 cursor-pointer shrink-0 shadow-inner"
            style={{
              background: enabled
                ? `linear-gradient(90deg, ${T.accent}, #6366f1)`
                : "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${enabled ? "transparent" : "rgba(255,255,255,0.2)"}`,
            }}
            aria-label={enabled ? "Disable announcement" : "Enable announcement"}
          >
            <motion.div
              animate={{ x: enabled ? 32 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-[22px] h-[22px] rounded-full bg-white shadow-md flex items-center justify-center"
            >
              {enabled ? (
                <Eye size={12} className="text-blue-600" />
              ) : (
                <EyeOff size={12} className="text-gray-400" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Form with expand/collapse */}
        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="relative z-10 space-y-6 pt-2">
                {/* Textarea with character counter */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: T.muted }}
                  >
                    Announcement Message
                  </label>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      placeholder="Enter your announcement..."
                      className={`w-full rounded-2xl px-5 py-4 text-sm outline-none resize-none transition-all duration-300 shadow-inner peer ${
                        isOverLimit ? "ring-2 ring-rose-500/50" : ""
                      }`}
                      style={{
                        background: "rgba(0,0,0,0.25)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${isOverLimit ? T.rose : T.borderHi}`,
                        color: T.text,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = isOverLimit
                          ? T.rose
                          : T.accentMd)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = isOverLimit
                          ? T.rose
                          : T.borderHi)
                      }
                    />
                    {/* Char counter */}
                    <div className="absolute bottom-3 right-4 flex items-center gap-2 text-xs">
                      <span
                        className={`font-mono ${
                          isOverLimit ? "text-rose-400" : "text-gray-400"
                        }`}
                      >
                        {text.length}/{MAX_CHARS}
                      </span>
                      <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            isOverLimit
                              ? "bg-rose-400"
                              : charsLeft < 30
                              ? "bg-amber-400"
                              : "bg-blue-400"
                          }`}
                          animate={{
                            width: `${Math.min(
                              (text.length / MAX_CHARS) * 100,
                              100
                            )}%`,
                          }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                  {isOverLimit && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Character limit exceeded
                    </p>
                  )}
                </div>

                {/* Type and schedule */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Style select */}
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: T.muted }}
                    >
                      Style / Severity
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none cursor-pointer shadow-inner transition-all duration-300 bg-no-repeat"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%234A5578' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.75rem center",
                        backgroundSize: "1rem",
                        backgroundColor: "rgba(0,0,0,0.25)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${T.borderHi}`,
                        color: T.text,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = T.accentMd)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = T.borderHi)
                      }
                    >
                      <option value="info" style={{ background: "rgba(10,22,52,0.70)" }}>
                        Information (Blue)
                      </option>
                      <option value="success" style={{ background: "rgba(10,22,52,0.70)" }}>
                        Success (Green)
                      </option>
                      <option value="warning" style={{ background: "rgba(10,22,52,0.70)" }}>
                        Warning (Amber)
                      </option>
                      <option value="danger" style={{ background: "rgba(10,22,52,0.70)" }}>
                        Danger (Red)
                      </option>
                    </select>
                  </div>

                  {/* Start time */}
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-between"
                      style={{ color: T.muted }}
                    >
                      <span>Start Time (Optional)</span>
                      {startAt && (
                        <button
                          onClick={() => setStartAt("")}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          <X size={12} /> Clear
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer shadow-inner transition-all duration-300 pr-8"
                        style={{
                          background: "rgba(0,0,0,0.25)",
                          backdropFilter: "blur(12px)",
                          border: `1px solid ${T.borderHi}`,
                          color: T.text,
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = T.accentMd)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = T.borderHi)
                        }
                      />
                      <Calendar
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>
                    {startAt && (
                      <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {getRelativeTime(startAt)}
                      </p>
                    )}
                  </div>

                  {/* End time */}
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-between"
                      style={{ color: T.muted }}
                    >
                      <span>End Time (Optional)</span>
                      {endAt && (
                        <button
                          onClick={() => setEndAt("")}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          <X size={12} /> Clear
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer shadow-inner transition-all duration-300 pr-8"
                        style={{
                          background: "rgba(0,0,0,0.25)",
                          backdropFilter: "blur(12px)",
                          border: `1px solid ${T.borderHi}`,
                          color: T.text,
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = T.accentMd)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = T.borderHi)
                        }
                      />
                      <Calendar
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>
                    {endAt && (
                      <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {getRelativeTime(endAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Live preview bar – glass style */}
                {text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden shadow-lg"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      backdropFilter: "blur(16px)",
                      border: `1px solid ${previewColor.border}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium"
                      style={{
                        background: previewColor.bg,
                        backdropFilter: "blur(8px)",
                        color: previewColor.text,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Megaphone size={14} />
                        <span>{text}</span>
                      </div>
                      <button className="text-current opacity-50 hover:opacity-100 transition">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Preview – users will see this bar at the top of the page
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <div className="relative z-10 mt-8 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 outline-none"
            style={{
              background: canSave
                ? `linear-gradient(135deg, ${T.accent}, #6366f1)`
                : "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              boxShadow: canSave
                ? `0 8px 24px ${T.accentLo}`
                : "none",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving Changes..." : "Save Announcement"}
          </motion.button>
        </div>
      </motion.div>

      {/* Glass toast notification */}
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
                  toast.type === "success" ? "bg-emerald-400/50" : "bg-red-400/50"
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}