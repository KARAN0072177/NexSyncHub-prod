// src/app/maintenance/page.tsx

"use client";

import { motion } from "framer-motion";
import { Wrench, ServerCog, Sparkles, ShieldCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const T = {
  bg: "#03060F",
  surfaceHi: "rgba(10,22,52,0.85)",
  borderHi: "rgba(99,140,255,0.22)",
  amber: "#F97316",
  amberLo: "rgba(249,115,22,0.12)",
  amberMd: "rgba(249,115,22,0.25)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

export default function MaintenancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const checkStatus = () => {
    setChecking(true);
    // When they click refresh, we push them to the home route.
    // If the platform is STILL in maintenance mode, the middleware will instantly catch it and redirect them back here!
    setTimeout(() => {
      router.push("/");
      setChecking(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -160, left: -120, width: 600, height: 600, borderRadius: "50%", background: "rgba(249,115,22,0.06)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -80, width: 500, height: 500, borderRadius: "50%", background: "rgba(245,158,11,0.04)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(249,115,22,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg rounded-[2rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}
      >
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg,#F59E0B,#F97316)" }} />
        
        {/* Inner glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none blur-[80px]" style={{ background: T.amber }} />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner relative"
            style={{ background: T.amberLo, border: `1px solid ${T.amberMd}` }}>
            <Wrench size={32} style={{ color: T.amber }} className="animate-pulse" />
            <div className="absolute inset-0 rounded-3xl animate-ping opacity-20" style={{ border: `2px solid ${T.amber}` }} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Sora',sans-serif", letterSpacing: "-0.02em" }}>
            We'll be right back
          </h1>
          
          <p className="text-sm leading-relaxed mb-8" style={{ color: T.muted }}>
            NexSyncHub is currently undergoing scheduled maintenance. We are making our platform faster, more secure, and feature-rich for you!
          </p>

          <div className="w-full space-y-3 mb-8 text-left">
            <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors hover:bg-white/5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.05)` }}>
              <ServerCog size={18} className="shrink-0 mt-0.5" style={{ color: T.amber }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: T.muted }}>Infrastructure Upgrades</p>
                <p className="text-sm font-medium text-white">Scaling our servers to ensure lightning-fast collaboration.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors hover:bg-white/5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.05)` }}>
              <Sparkles size={18} className="shrink-0 mt-0.5" style={{ color: T.amber }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: T.muted }}>New Features</p>
                <p className="text-sm font-medium text-white">Deploying the latest updates and AI enhancements.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors hover:bg-white/5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.05)` }}>
              <ShieldCheck size={18} className="shrink-0 mt-0.5" style={{ color: T.amber }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: T.muted }}>Security Patches</p>
                <p className="text-sm font-medium text-white">Applying routine security patches to keep your data safe.</p>
              </div>
            </div>
          </div>

          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all shadow-xl active:scale-95 outline-none"
            style={{ background: `linear-gradient(135deg, #F59E0B, #F97316)`, boxShadow: `0 8px 32px ${T.amberLo}`, opacity: checking ? 0.8 : 1, fontFamily: "'DM Sans',sans-serif" }}
          >
            <RefreshCw size={18} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking status..." : "Refresh & Check Status"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}