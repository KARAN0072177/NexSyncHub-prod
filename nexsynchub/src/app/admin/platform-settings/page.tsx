// app/admin/platform-settings/page.tsx (your shell component)
"use client";

import { useState, useCallback } from "react";
import RegistrationControl from "@/components/super-admin/platform-settings/RegistrationControl";
import MaintenanceControl from "@/components/super-admin/platform-settings/MaintenanceControl";
import WorkspaceInviteControl from "@/components/super-admin/platform-settings/WorkspaceInviteControl";
import WorkspaceCreationControl from "@/components/super-admin/platform-settings/WorkspaceCreationControl";
import AnnouncementSettings from "@/components/super-admin/platform-settings/AnnouncementSettings";
import AIPlatformAdvisor from "@/components/super-admin/platform-settings/AIPlatformAdvisor";
import { Settings, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";

const T = {
  bg: "#03060F",
  surface: "rgba(8,16,40,0.45)",
  surfaceHi: "rgba(8,16,40,0.65)",
  border: "rgba(99,140,255,0.12)",
  borderHi: "rgba(99,140,255,0.18)",
  accent: "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  violet: "#7C3AED",
  emerald: "#10B981",
  text: "#E2E8F8",
  muted: "#4A5578",
};

export default function PlatformSettingsPage() {
  // Global refresh counter – incrementing it triggers child re-fetches
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSettingsApplied = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,140,255,0.18); border-radius: 4px; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>

      {/* Enhanced ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -160, left: -120, width: 600, height: 600, borderRadius: "50%", background: "rgba(61,123,255,0.08)", filter: "blur(140px)" }} />
        <div style={{ position: "absolute", top: 350, right: -80, width: 440, height: 440, borderRadius: "50%", background: "rgba(16,185,129,0.05)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -60, left: "30%", width: 380, height: 380, borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(110px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,140,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99,140,255,0.02) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      {/* Main content wrapped in a frosted glass card */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[2.5rem] p-6 sm:p-10 shadow-2xl overflow-hidden"
          style={{
            background: T.surface,
            backdropFilter: "blur(48px) saturate(180%)",
            border: `1px solid ${T.border}`,
            boxShadow: `0 25px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 ${T.borderHi}`,
          }}
        >
          {/* Inner glow effect */}
          <div
            className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] opacity-30 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)` }}
          />

          {/* HEADER */}
          <div className="relative z-10 mb-10">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`,
                    boxShadow: `0 4px 20px ${T.accentLo}`,
                  }}
                >
                  <Settings size={22} className="text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Platform Settings
                  </h1>
                  <p className="text-sm mt-1" style={{ color: T.muted }}>
                    Configure global platform behavior and access control
                  </p>
                </div>
              </div>

              {/* AI Advisor button in header */}
              <AIPlatformAdvisor onSettingsApplied={handleSettingsApplied} />

              {/* live indicator */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2.5 px-4 py-2 rounded-2xl"
                style={{
                  background: T.surfaceHi,
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${T.borderHi}`,
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.emerald }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.emerald }} />
                </span>
                <span className="text-sm font-semibold" style={{ color: T.text }}>Live</span>
                <span className="text-sm" style={{ color: T.muted }}>Settings apply globally</span>
              </motion.div>
            </div>

            {/* status strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl relative overflow-hidden"
              style={{
                background: T.surfaceHi,
                backdropFilter: "blur(20px)",
                borderLeft: `2px solid ${T.accent}`,
                border: `1px solid ${T.borderHi}`,
              }}
            >
              <ShieldCheck size={14} style={{ color: T.accent }} />
              <span className="text-xs" style={{ color: T.muted }}>
                Changes to these settings are applied{" "}
                <span style={{ color: T.text, fontWeight: 600 }}>immediately</span>{" "}
                and affect all users across the platform.
              </span>
              <Activity size={13} style={{ color: T.muted, marginLeft: "auto" }} />
            </motion.div>
          </div>

          {/* CONTROLS – now inside the glass card */}
          <div className="relative z-10 space-y-5">
            <RegistrationControl key={`registration-${refreshKey}`} />
            <MaintenanceControl key={`maintenance-${refreshKey}`} />
            <WorkspaceCreationControl key={`workspace-creation-${refreshKey}`} />
            <WorkspaceInviteControl key={`workspace-invite-${refreshKey}`} />
            <AnnouncementSettings key={`announcement-${refreshKey}`} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}