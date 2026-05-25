"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Loader2, CheckCircle2, XCircle } from "lucide-react";

const T = {
  surface: "rgba(8,16,40,0.70)",
  surfaceHi: "rgba(10,22,52,0.85)",
  border: "rgba(99,140,255,0.10)",
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
  info: { bg: "rgba(61,123,255,0.12)", border: "rgba(61,123,255,0.25)", text: "#3D7BFF" },
  warning: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", text: "#F59E0B" },
  danger: { bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.25)", text: "#FB7185" },
  success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", text: "#10B981" },
};

export default function AnnouncementSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState("info");

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | null }>({ show: false, message: "", type: null });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 4000);
  };

  // Convert UTC string to local datetime-local format (YYYY-MM-DDTHH:mm)
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

  if (loading) {
    return (
      <div
        className="rounded-[2rem] p-8 sm:p-10 animate-pulse mt-6"
        style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}` }}
      >
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl" style={{ background: "rgba(99,140,255,0.08)" }} />
          <div className="flex-1 space-y-3 mt-1.5">
            <div className="h-5 w-48 rounded-lg" style={{ background: "rgba(99,140,255,0.08)" }} />
            <div className="h-4 w-3/4 max-w-lg rounded-lg" style={{ background: "rgba(99,140,255,0.05)" }} />
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
        className="relative rounded-[2rem] p-7 sm:p-10 overflow-hidden shadow-2xl"
        style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-[80px] transition-colors duration-700" style={{ background: enabled ? T.accent : "transparent" }} />

        {/* Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500"
              style={{ background: enabled ? T.accentLo : "rgba(255,255,255,0.03)", border: `1px solid ${enabled ? T.accentMd : "rgba(255,255,255,0.05)"}` }}>
              <Megaphone size={24} style={{ color: enabled ? T.accent : T.muted }} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Sora',sans-serif", letterSpacing: "-0.02em" }}>
                Global Announcement
              </h2>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: T.muted }}>
                Broadcast platform-wide announcements to all users across NexSyncHub. Set a schedule or publish immediately.
              </p>
              
              <div className="mt-5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors duration-500"
                  style={{ background: enabled ? T.accentLo : "rgba(255,255,255,0.05)", color: enabled ? T.accent : T.muted, border: `1px solid ${enabled ? T.accentMd : "transparent"}` }}>
                  <span className={`w-2 h-2 rounded-full`} style={{ background: enabled ? T.accent : T.muted }} />
                  {enabled ? "Announcement Active" : "Announcement Disabled"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEnabled(!enabled)}
            className="relative w-[52px] h-7 rounded-full transition-all duration-300 shrink-0 outline-none flex items-center px-1 cursor-pointer shadow-inner"
            style={{ background: enabled ? T.accent : "rgba(255,255,255,0.08)", border: `1px solid ${enabled ? "transparent" : "rgba(255,255,255,0.1)"}` }}
          >
            <motion.div animate={{ x: enabled ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-[20px] h-[20px] rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="relative z-10 space-y-6 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
                    Announcement Message
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Enter your announcement..."
                    className="w-full rounded-2xl px-5 py-4 text-sm outline-none resize-none transition-all duration-300 shadow-inner"
                    style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${T.borderHi}`, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                    onFocus={e => e.currentTarget.style.borderColor = T.accentMd}
                    onBlur={e => e.currentTarget.style.borderColor = T.borderHi}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
                      Style / Severity
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none cursor-pointer shadow-inner transition-all duration-300"
                      style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${T.borderHi}`, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                      onFocus={e => e.currentTarget.style.borderColor = T.accentMd}
                      onBlur={e => e.currentTarget.style.borderColor = T.borderHi}
                    >
                      <option value="info" style={{background: T.surfaceHi}}>Information (Blue)</option>
                      <option value="success" style={{background: T.surfaceHi}}>Success (Green)</option>
                      <option value="warning" style={{background: T.surfaceHi}}>Warning (Amber)</option>
                      <option value="danger" style={{background: T.surfaceHi}}>Danger (Red)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
                      Start Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer shadow-inner transition-all duration-300"
                      style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${T.borderHi}`, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                      onFocus={e => e.currentTarget.style.borderColor = T.accentMd}
                      onBlur={e => e.currentTarget.style.borderColor = T.borderHi}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
                      End Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer shadow-inner transition-all duration-300"
                      style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${T.borderHi}`, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                      onFocus={e => e.currentTarget.style.borderColor = T.accentMd}
                      onBlur={e => e.currentTarget.style.borderColor = T.borderHi}
                    />
                  </div>
                </div>

                {text && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
                      Live Preview
                    </label>
                    <div className="w-full px-4 py-3 text-sm font-medium text-center rounded-xl shadow-lg transition-all duration-500"
                      style={{ background: previewColor.bg, borderBottom: `1px solid ${previewColor.border}`, color: previewColor.text }}>
                      {text}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 mt-8 flex justify-end">
           <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl active:scale-95 disabled:opacity-70 disabled:active:scale-100 outline-none"
            style={{ background: `linear-gradient(135deg, ${T.accent}, #6366f1)`, boxShadow: `0 8px 24px ${T.accentLo}`, fontFamily: "'DM Sans',sans-serif" }}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving Changes..." : "Save Announcement"}
          </button>
        </div>
      </motion.div>

      {/* Custom Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${toast.type === "success" ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} backdrop-blur-md`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toast.type === "success" ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            </div>
            <span className="text-sm font-medium text-gray-200">{toast.message}</span>
            <button onClick={() => setToast(p => ({ ...p, show: false }))} className="ml-2 text-gray-500 hover:text-gray-300 transition-colors">
              <XCircle size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}