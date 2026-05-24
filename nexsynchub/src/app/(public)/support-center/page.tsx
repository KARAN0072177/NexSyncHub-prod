"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  Send,
  Paperclip,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bug,
  X,
  Lightbulb,
  ShieldAlert,
  CreditCard,
  UserCog,
  MessageSquare,
} from "lucide-react";

const categories = [
  { value: "general", label: "General Inquiry", icon: MessageSquare },
  { value: "bug_report", label: "Bug Report", icon: Bug },
  { value: "feedback", label: "Feedback", icon: Lightbulb },
  { value: "feature_request", label: "Feature Request", icon: Lightbulb },
  { value: "workspace_report", label: "Workspace Report", icon: ShieldAlert },
  { value: "account_support", label: "Account Support", icon: UserCog },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "other", label: "Other", icon: AlertCircle },
];

const T = {
  bg:       "#050508",
  surface:  "rgba(255,255,255,0.02)",
  surfaceHi:"rgba(14,14,20,0.85)",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  accent:   "#6C63FF",
  accentLo: "rgba(108,99,255,0.12)",
  accentMd: "rgba(108,99,255,0.25)",
  violet:   "#8B5CF6",
  text:     "#F8FAFC",
  muted:    "#8A8F9E",
  emerald:  "#10B981",
};

export default function SupportPage() {
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const removeFile = (nameToRemove: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== nameToRemove));
  };

  const submitSupport = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("category", category);
      formData.append("subject", subject);
      formData.append("message", message);
      files.forEach((file) => formData.append("attachments", file));

      const res = await fetch("/api/support/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      setSuccess(true);
      setSubject("");
      setMessage("");
      setFiles([]);
    } catch (error) {
      console.error(error);
      alert("Failed to submit support request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -160, left: -120, width: 600, height: 600, borderRadius: "50%", background: "rgba(108,99,255,0.06)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: 300, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(139,92,246,0.05)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-28">
        
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold" style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` }}>
            <LifeBuoy size={16} /> NexSyncHub Support
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight" style={{ fontFamily: "'Sora',sans-serif" }}>
            How can we help?
          </h1>
          <p className="max-w-xl mx-auto text-lg leading-relaxed" style={{ color: T.muted }}>
            Report bugs, request features, ask questions, or contact our support team directly. We are here for you.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-[2.5rem] p-6 md:p-12 shadow-2xl"
          style={{ background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(40px)" }}
        >
          {/* Category */}
          <div className="mb-10">
            <label className="block text-xs font-bold uppercase tracking-widest mb-5" style={{ color: T.muted }}>
              Support Category
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {categories.map((item) => {
                const Icon = item.icon;
                const active = category === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setCategory(item.value)}
                    className="flex flex-col items-start p-4 md:p-5 rounded-3xl transition-all duration-300 group text-left"
                    style={{
                      background: active ? T.accentLo : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? T.accentMd : T.border}`,
                      boxShadow: active ? `0 8px 24px ${T.accentLo}` : "none",
                    }}
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                         style={{ background: active ? T.accent : "rgba(255,255,255,0.04)" }}>
                      <Icon size={18} color={active ? "#fff" : T.muted} className={active ? "" : "group-hover:text-white transition-colors"} />
                    </div>
                    <p className="text-sm font-semibold transition-colors" style={{ color: active ? T.text : T.muted }}>
                      {item.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe your request..."
              className="w-full px-6 py-4 rounded-2xl outline-none text-sm transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, color: T.text }}
              onFocus={(e) => { e.currentTarget.style.borderColor = T.accentMd; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentLo}`; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
            />
          </div>

          {/* Message */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
              Message
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide any details, steps to reproduce, or feedback..."
              className="w-full px-6 py-5 rounded-2xl outline-none resize-none text-sm transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, color: T.text }}
              onFocus={(e) => { e.currentTarget.style.borderColor = T.accentMd; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentLo}`; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
            />
          </div>

          {/* Attachments */}
          <div className="mb-10">
            <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
              Attachments
            </label>
            
            <label className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6 py-8 rounded-3xl cursor-pointer transition-all hover:bg-white/[0.03] group text-center sm:text-left" style={{ background: "rgba(255,255,255,0.01)", border: `1px dashed ${T.border}` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                <Paperclip size={20} style={{ color: T.accent }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Click to upload files</p>
                <p className="text-xs" style={{ color: T.muted }}>Screenshots, PDFs, or supporting documents up to 10MB</p>
              </div>
              <input
                type="file"
                hidden
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...selected]);
                  e.target.value = '';
                }}
              />
            </label>

            {/* Files List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={`${file.name}-${i}`} 
                    className="flex items-center justify-between px-5 py-3.5 rounded-2xl" 
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                        <Paperclip size={14} style={{ color: T.accent }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(file.name)} className="p-2 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0" style={{ color: T.muted }} title="Remove file">
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={submitSupport}
            disabled={loading || !subject.trim() || !message.trim()}
            className="w-full flex items-center justify-center gap-2 py-4.5 rounded-2xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            style={{
              background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`,
              boxShadow: `0 8px 32px ${T.accentMd}`,
            }}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Sending Request...</>
            ) : (
              <><Send size={18} /> Submit Support Request</>
            )}
          </button>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" style={{ background: "rgba(5,5,8,0.85)", backdropFilter: "blur(12px)" }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md rounded-[2rem] p-8 text-center overflow-hidden shadow-2xl"
              style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${T.accent}, ${T.emerald})` }} />
              
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(16,185,129,0.12)", border: `1px solid rgba(16,185,129,0.25)` }}>
                <CheckCircle2 size={32} style={{ color: T.emerald }} />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: "'Sora',sans-serif" }}>Request Received</h3>
              
              <p className="text-sm leading-relaxed mb-8" style={{ color: T.muted }}>
                Thanks for reaching out! Our team has received your support request and will get back to you shortly.
              </p>
              
              <button onClick={() => setSuccess(false)} className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, boxShadow: `0 8px 24px ${T.accentLo}` }}>
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}