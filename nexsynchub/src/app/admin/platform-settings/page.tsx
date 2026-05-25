// /src/app/admin/platform-settings/page.tsx

"use client";

import RegistrationControl from "@/components/super-admin/platform-settings/RegistrationControl";
import MaintenanceControl from "@/components/super-admin/platform-settings/MaintenanceControl";
import WorkspaceInviteControl from "@/components/super-admin/platform-settings/WorkspaceInviteControl";
import AnnouncementSettings from "@/components/super-admin/platform-settings/AnnouncementSettings";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";

const T = {
  bg:     "#03060F",
  text:   "#E2E8F8",
  muted:  "#4A5578",
  accent: "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
};

export default function PlatformSettingsPage() {
  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-160, left:-120, width:600, height:600, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", top:300, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(16,185,129,0.04)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        {/* HEADER */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background:"linear-gradient(135deg,#3D7BFF,#7C3AED)", boxShadow:"0 4px 20px rgba(61,123,255,0.35)" }}>
              <Settings size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>
                Platform Settings
              </h1>
              <p className="text-sm mt-1" style={{ color:T.muted }}>Configure global platform behavior, access controls, and announcements</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-5">
          <RegistrationControl />
          <MaintenanceControl />
          <WorkspaceInviteControl />
          <AnnouncementSettings />
        </div>
      </div>
    </div>
  );
}