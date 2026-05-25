"use client";

import RegistrationControl from "@/components/super-admin/platform-settings/RegistrationControl";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";

const T = {
  bg: "#03060F",
  text: "#E2E8F8",
  muted: "#4A5578",
};

export default function
PlatformSettingsPage() {

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -160, left: -120, width: 600, height: 600, borderRadius: "50%", background: "rgba(61,123,255,0.07)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: 300, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(16,185,129,0.04)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3D7BFF,#7C3AED)", boxShadow: "0 4px 20px rgba(61,123,255,0.30)" }}>
              <Settings size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>Platform Settings</h1>
              <p className="text-sm mt-1" style={{ color: T.muted }}>Configure global platform behavior and access</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <RegistrationControl />
        </div>
      </div>
    </div>
  );

}