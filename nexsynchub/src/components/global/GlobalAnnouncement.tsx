"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

const THEME: any = {
  info: {
    bg: "rgba(61,123,255,0.12)",
    border: "rgba(61,123,255,0.25)",
    text: "#3D7BFF",
    icon: Info,
  },
  warning: {
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
    text: "#F59E0B",
    icon: AlertTriangle,
  },
  danger: {
    bg: "rgba(251,113,133,0.12)",
    border: "rgba(251,113,133,0.25)",
    text: "#FB7185",
    icon: ShieldAlert,
  },
  success: {
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    text: "#10B981",
    icon: CheckCircle2,
  },
};

export default function GlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Creates a unique ID based on the announcement details.
  // If Super Admin edits ANY field, the signature changes and pops up again!
  const getSignature = (ann: any) => {
    if (!ann) return "";
    return `${ann.text}_${ann.type}_${ann.startAt || 'no-start'}_${ann.endAt || 'no-end'}`;
  };

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/platform/public-settings");
        const data = await res.json();

        if (data.announcement?.enabled) {
          setAnnouncement(data.announcement);

          // Validate times safely
          const now = new Date().getTime();
          const start = data.announcement.startAt ? new Date(data.announcement.startAt).getTime() : null;
          const end = data.announcement.endAt ? new Date(data.announcement.endAt).getTime() : null;
          const isTimeValid = (!start || isNaN(start) || now >= start) && (!end || isNaN(end) || now <= end);

          if (isTimeValid) {
            const dismissed = sessionStorage.getItem("nexsync_dismissed_announcement");
            if (dismissed !== getSignature(data.announcement)) {
              setIsVisible(true);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchAnnouncement();

  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (announcement) {
      sessionStorage.setItem("nexsync_dismissed_announcement", getSignature(announcement));
    }
  };

  // ❌ Disabled
  if (!announcement?.enabled) {
    return null;
  }

  // 🔥 Time validation
  const now = new Date().getTime();
  const start = announcement.startAt ? new Date(announcement.startAt).getTime() : null;
  const end = announcement.endAt ? new Date(announcement.endAt).getTime() : null;
  if (start && !isNaN(start) && now < start) return null;
  if (end && !isNaN(end) && now > end) return null;

  const style = THEME[announcement.type] || THEME.info;
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Popup Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden p-8"
            style={{ background: "rgba(10,22,52,0.70)", border: `1px solid ${style.border}`, backdropFilter: "blur(40px)" }}
          >
            {/* Ambient tint inside popup */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: style.bg }} />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-[80px]" style={{ background: style.text }} />

            <div className="relative z-10 flex flex-col items-center text-center gap-5">
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl shadow-inner" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <Icon size={32} style={{ color: style.text }} />
              </div>
               
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
                  Platform Announcement
                </h3>
                <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: "rgba(226, 232, 248, 0.8)", fontFamily: "'DM Sans', sans-serif" }}>
                  {announcement.text}
                </p>
              </div>
               
              <button
                onClick={handleDismiss}
                className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 active:scale-95 shadow-xl outline-none flex justify-center"
                style={{ background: style.text, boxShadow: `0 8px 24px ${style.bg}`, fontFamily: "'DM Sans', sans-serif" }}
              >
                Got it, thanks!
              </button>
            </div>
            
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full transition-colors duration-200 z-10 text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}