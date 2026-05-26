// components/super-admin/platform-settings/AIPlatformAdvisor.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldAlert,
  Loader2,
  Brain,
  AlertTriangle,
  CheckCircle2,
  X,
  Zap,
  BarChart3,
} from "lucide-react";

// Glassmorphism colour tokens
const T = {
  surface: "rgba(8,16,40,0.35)",
  surfaceHi: "rgba(10,22,52,0.50)",
  border: "rgba(99,140,255,0.12)",
  borderHi: "rgba(99,140,255,0.22)",
  accent: "#7C3AED",
  accentLo: "rgba(124,58,237,0.12)",
  accentMd: "rgba(124,58,237,0.25)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  amber: "#F59E0B",
  amberLo: "rgba(245,158,11,0.12)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

// Helper for risk level display
const riskConfig = (risk: string) => {
  switch (risk.toLowerCase()) {
    case "low":
      return { color: T.emerald, bg: T.emeraldLo, label: "Low Risk" };
    case "medium":
      return { color: T.amber, bg: T.amberLo, label: "Medium Risk" };
    case "high":
      return { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "High Risk" };
    case "critical":
      return { color: "#FF4D6D", bg: "rgba(255,77,109,0.12)", label: "Critical Risk" };
    default:
      return { color: T.emerald, bg: T.emeraldLo, label: risk };
  }
};

export default function AIPlatformAdvisor({ onSettingsApplied }: { onSettingsApplied: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [appliedSettings, setAppliedSettings] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setAnalysis(null);
      const res = await fetch("/api/admin/ai-platform-advisor", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setAnalysis(data.analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async (setting: string, value: boolean) => {
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [setting]: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Remove recommendation from list
      setAnalysis((prev: any) => ({
        ...prev,
        recommendations: prev.recommendations.filter(
          (rec: any) => rec.setting !== setting
        ),
      }));
      setAppliedSettings((prev) => ({ ...prev, [setting]: true }));
      
      // 🔥 Trigger parent re-fetch
      onSettingsApplied();
    } catch (error) {
      console.error(error);
    }
  };

  const risk = analysis?.riskLevel ? riskConfig(analysis.riskLevel) : null;

  return (
    <>
      {/* AI Button – glass pill with glow */}
      <motion.button
        whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(124,58,237,0.5)" }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${T.accent}, #3D7BFF)`,
          color: "white",
          backdropFilter: "blur(8px)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Sparkles size={18} className="drop-shadow-lg" />
        AI Advisor
      </motion.button>

      {/* Glass Modal */}
      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl"
              style={{
                background: T.surfaceHi,
                backdropFilter: "blur(48px) saturate(180%)",
                border: `1px solid ${T.borderHi}`,
                boxShadow: `0 25px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 ${T.border}`,
              }}
            >
              {/* Top reflection */}
              <div
                className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] opacity-20 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
                }}
              />

              {/* Header */}
              <div
                className="flex items-center justify-between px-7 py-5 border-b relative"
                style={{ borderColor: T.border }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: T.accentLo,
                      backdropFilter: "blur(12px)",
                      border: `1px solid ${T.accentMd}`,
                    }}
                  >
                    <Brain size={24} style={{ color: T.accent }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{ color: T.text, fontFamily: "'Sora', sans-serif" }}
                    >
                      AI Operational Advisor
                    </h2>
                    <p className="text-sm mt-1" style={{ color: T.muted }}>
                      AI-powered governance and operational analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <X size={18} color="white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-7 space-y-6 relative z-10">
                {/* Initial State or Loading */}
                {!analysis && !loading && (
                  <div className="flex flex-col items-center py-12">
                    <BarChart3 size={48} className="text-gray-500 mb-4" />
                    <p className="text-lg font-medium" style={{ color: T.text }}>
                      Analyze your platform's operational health
                    </p>
                    <p className="text-sm mt-2 max-w-md text-center" style={{ color: T.muted }}>
                      AI will review recent activity, security events, and growth to suggest optimal settings.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyze}
                      className="mt-6 px-8 py-4 rounded-2xl font-semibold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${T.accent}, #3D7BFF)`,
                        boxShadow: `0 8px 30px ${T.accentLo}`,
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles size={18} />
                        Start Analysis
                      </span>
                    </motion.button>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Loader2 size={48} style={{ color: T.accent }} />
                    </motion.div>
                    <h3 className="mt-6 text-lg font-bold" style={{ color: T.text }}>
                      AI analyzing platform...
                    </h3>
                    <p className="mt-2 text-sm max-w-sm" style={{ color: T.muted }}>
                      Reviewing moderation, registrations, invites and operational activity
                    </p>
                    <div className="mt-8 w-64 h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: T.accent }}
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                  <div className="space-y-6">
                    {/* Risk Level */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-6"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ShieldAlert size={20} color={risk?.color} />
                          <h3 className="font-bold text-lg" style={{ color: T.text }}>
                            Risk Assessment
                          </h3>
                        </div>
                        <span
                          className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                          style={{
                            background: risk?.bg,
                            color: risk?.color,
                            border: `1px solid ${risk?.color}30`,
                          }}
                        >
                          {risk?.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed" style={{ color: T.muted }}>
                        {analysis.summary}
                      </p>
                    </motion.div>

                    {/* Recommendations */}
                    {analysis.recommendations?.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: T.muted }}>
                          Recommended Actions
                        </h3>
                        {analysis.recommendations.map((rec: any, idx: number) => (
                          <motion.div
                            key={rec.setting}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: idx * 0.1 }}
                            layout
                            className="rounded-2xl p-5 flex items-start justify-between gap-4 group hover:bg-white/5 transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              backdropFilter: "blur(8px)",
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            <div className="flex gap-3">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: T.accentLo }}
                              >
                                <AlertTriangle size={16} color={T.accent} />
                              </div>
                              <div>
                                <h4 className="font-semibold" style={{ color: T.text }}>
                                  {rec.setting}
                                </h4>
                                <p className="text-sm mt-1 leading-relaxed" style={{ color: T.muted }}>
                                  {rec.reason}
                                </p>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                applyRecommendation(rec.setting, rec.recommendedValue)
                              }
                              className="px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all"
                              style={{
                                background: `linear-gradient(135deg, ${T.accent}, #3D7BFF)`,
                                color: "white",
                              }}
                            >
                              Apply
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-10"
                      >
                        <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
                        <h3 className="text-lg font-bold" style={{ color: T.text }}>
                          All Clear!
                        </h3>
                        <p className="text-sm mt-2" style={{ color: T.muted }}>
                          No actions recommended at this time. Your platform is running optimally.
                        </p>
                      </motion.div>
                    )}

                    {/* Re-analyze button */}
                    <div className="flex justify-center pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: `1px solid ${T.border}`,
                          color: T.text,
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        Re-Generate Analysis
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body
      )}
    </>
  );
}