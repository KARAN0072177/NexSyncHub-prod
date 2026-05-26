// src/app/maintenance/page.tsx
"use client";

import { motion } from "framer-motion";
import {
  Wrench,
  ServerCog,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Glassmorphism colour tokens
const T = {
  bg: "#03060F",
  surfaceHi: "rgba(10,22,52,0.50)",          // lower opacity for glass
  border: "rgba(99,140,255,0.12)",
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
    setTimeout(() => {
      router.push("/");
      setChecking(false);
    }, 1500);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: T.bg, color: T.text }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "rgba(249,115,22,0.07)",
            filter: "blur(140px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(245,158,11,0.05)",
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(249,115,22,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(249,115,22,0.02) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        style={{
          background: T.surfaceHi,
          backdropFilter: "blur(48px) saturate(180%)",
          border: `1px solid ${T.borderHi}`,
          boxShadow: `0 25px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 ${T.border}`,
        }}
      >
        {/* Top glass reflection */}
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] opacity-20 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${T.amber}, transparent)`,
          }}
        />

        {/* Inner glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-[80px]"
          style={{ background: T.amber }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Icon with glass and pulse */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden"
            style={{
              background: T.amberLo,
              backdropFilter: "blur(12px)",
              border: `1px solid ${T.amberMd}`,
            }}
          >
            <Wrench size={32} style={{ color: T.amber }} className="animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            {/* Animated ring */}
            <div
              className="absolute inset-0 rounded-3xl animate-ping opacity-20"
              style={{ border: `2px solid ${T.amber}` }}
            />
          </motion.div>

          <h1
            className="text-2xl sm:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "'Sora',sans-serif", letterSpacing: "-0.02em" }}
          >
            We'll be right back
          </h1>

          <p className="text-sm leading-relaxed mb-8" style={{ color: T.muted }}>
            NexSyncHub is currently undergoing scheduled maintenance. We are
            making our platform faster, more secure, and feature-rich for you!
          </p>

          {/* Feature cards – glass mini panels */}
          <div className="w-full space-y-3 mb-8 text-left">
            {[
              {
                icon: ServerCog,
                label: "Infrastructure Upgrades",
                desc: "Scaling our servers to ensure lightning-fast collaboration.",
              },
              {
                icon: Sparkles,
                label: "New Features",
                desc: "Deploying the latest updates and AI enhancements.",
              },
              {
                icon: ShieldCheck,
                label: "Security Patches",
                desc: "Applying routine security patches to keep your data safe.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-2xl transition-colors hover:bg-white/5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <item.icon size={18} className="shrink-0 mt-0.5" style={{ color: T.amber }} />
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: T.muted }}
                  >
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-white">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Refresh button – glass gradient */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkStatus}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all shadow-xl outline-none"
            style={{
              background: `linear-gradient(135deg, #F59E0B, #F97316)`,
              boxShadow: `0 8px 32px ${T.amberLo}`,
              opacity: checking ? 0.8 : 1,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <RefreshCw size={18} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking status..." : "Refresh & Check Status"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}