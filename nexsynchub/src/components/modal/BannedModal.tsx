"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertOctagon, Clock, Mail } from "lucide-react";

interface Props {

  open: boolean;

  reason: string;

  expiresAt: string | null;

}

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  surfaceHi: "rgba(10,22,52,0.85)",
  rose: "#FF4D6D",
  roseLo: "rgba(255,77,109,0.12)",
  roseMd: "rgba(255,77,109,0.25)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

export default function BannedModal({

  open,
  reason,
  expiresAt,

}: Props) {

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Fonts Injection (if not already globally loaded) */}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(14px)" }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] shadow-2xl p-6 sm:p-8"
            style={{ background: T.surfaceHi, border: `1px solid ${T.roseMd}`, backdropFilter: "blur(40px)" }}
          >
            {/* Red top glow accent */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${T.rose}, transparent)` }} />

            <div className="flex flex-col items-center text-center">
              {/* Pulsing Icon */}
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 relative shadow-inner"
                style={{ background: T.roseLo, border: `1px solid ${T.roseMd}`, boxShadow: `0 0 0 8px ${T.roseLo}` }}>
                <ShieldAlert size={28} style={{ color: T.rose }} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Action Required</h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
                Your account has been restricted due to policy violations.
              </p>

              <div className="w-full space-y-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {/* Reason Detail */}
                <div className="flex items-start gap-3 p-4 rounded-2xl text-left transition-colors hover:bg-white/5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.05)` }}>
                  <AlertOctagon size={18} className="mt-0.5 shrink-0" style={{ color: T.rose }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: T.muted }}>Reason</p>
                    <p className="text-sm font-medium text-white">{reason}</p>
                  </div>
                </div>

                {/* Expiry Detail */}
                <div className="flex items-start gap-3 p-4 rounded-2xl text-left transition-colors hover:bg-white/5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.05)` }}>
                  <Clock size={18} className="mt-0.5 shrink-0" style={{ color: T.rose }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: T.muted }}>Restriction</p>
                    <p className="text-sm font-medium text-white">
                      {expiresAt ? `Suspended until ${new Date(expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : "Permanent restriction"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appeal Button */}
              <motion.a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=karanvani2003@gmail.com&su=Account%20Restriction%20Appeal"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white transition-all shadow-xl cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${T.rose}, #F97316)`, boxShadow: `0 8px 24px ${T.roseLo}`, fontFamily: "'DM Sans', sans-serif" }}
              >
                <Mail size={18} />
                Contact Support to Appeal
              </motion.a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

}