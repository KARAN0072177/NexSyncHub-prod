"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy, Send, Paperclip, Loader2, CheckCircle2,
  AlertCircle, Bug, X, Lightbulb, ShieldAlert,
  CreditCard, UserCog, MessageSquare, Sparkles,
  FileText, ChevronRight, Zap,
} from "lucide-react";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.70)",
  surfaceHi:"rgba(10,22,52,0.92)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  violet:   "#7C3AED",
  violetLo: "rgba(124,58,237,0.12)",
  violetMd: "rgba(124,58,237,0.25)",
  emerald:  "#10B981",
  emeraldLo:"rgba(16,185,129,0.12)",
  emeraldMd:"rgba(16,185,129,0.25)",
  rose:     "#FF4D6D",
  roseLo:   "rgba(255,77,109,0.12)",
  roseMd:   "rgba(255,77,109,0.25)",
  amber:    "#F97316",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

/* ─── categories ─────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value:"general",           label:"General Inquiry",   icon:MessageSquare, color:T.accent,  lo:T.accentLo,  md:T.accentMd  },
  { value:"bug_report",        label:"Bug Report",        icon:Bug,           color:T.rose,    lo:T.roseLo,    md:T.roseMd    },
  { value:"feedback",          label:"Feedback",          icon:Lightbulb,     color:"#EAB308", lo:"rgba(234,179,8,0.12)", md:"rgba(234,179,8,0.25)" },
  { value:"feature_request",   label:"Feature Request",   icon:Zap,           color:T.violet,  lo:T.violetLo,  md:T.violetMd  },
  { value:"workspace_report",  label:"Workspace Report",  icon:ShieldAlert,   color:T.amber,   lo:"rgba(249,115,22,0.12)", md:"rgba(249,115,22,0.25)" },
  { value:"account_support",   label:"Account Support",   icon:UserCog,       color:T.emerald, lo:T.emeraldLo, md:T.emeraldMd },
  { value:"billing",           label:"Billing",           icon:CreditCard,    color:"#A78BFA", lo:"rgba(167,139,250,0.12)", md:"rgba(167,139,250,0.25)" },
  { value:"other",             label:"Other",             icon:AlertCircle,   color:T.muted,   lo:"rgba(74,85,120,0.15)",   md:"rgba(74,85,120,0.28)"  },
];

/* ─── StyledInput ────────────────────────────────────────────────────────── */
function StyledInput({ value, onChange, placeholder, pulsing }: {
  value:string; onChange:(v:string)=>void; placeholder?:string; pulsing?:boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      animate={{
        borderColor: pulsing ? T.violet : focused ? T.accentMd : T.border,
        boxShadow:   pulsing ? `0 0 0 3px ${T.violetLo}, 0 0 24px ${T.violetLo}` : focused ? `0 0 0 3px ${T.accentLo}` : "none",
        backgroundColor: pulsing ? T.violetLo : focused ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
      }}
      transition={{ duration:0.4 }}
      className="rounded-2xl"
      style={{ border:`1px solid ${T.border}` }}
    >
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-6 py-4 text-sm outline-none"
        style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }} />
    </motion.div>
  );
}

/* ─── StyledTextarea ─────────────────────────────────────────────────────── */
function StyledTextarea({ value, onChange, placeholder, rows=6, pulsing }: {
  value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number; pulsing?:boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      animate={{
        borderColor: pulsing ? T.violet : focused ? T.accentMd : T.border,
        boxShadow:   pulsing ? `0 0 0 3px ${T.violetLo}, 0 0 24px ${T.violetLo}` : focused ? `0 0 0 3px ${T.accentLo}` : "none",
        backgroundColor: pulsing ? T.violetLo : focused ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
      }}
      transition={{ duration:0.4 }}
      className="rounded-2xl"
      style={{ border:`1px solid ${T.border}` }}
    >
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-transparent px-6 py-5 text-sm outline-none resize-none"
        style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }} />
    </motion.div>
  );
}

/* ─── CategoryCard ───────────────────────────────────────────────────────── */
function CategoryCard({ item, active, onClick }: {
  item: typeof CATEGORIES[0]; active:boolean; onClick:()=>void;
}) {
  const [hov, setHov] = useState(false);
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex flex-col items-start p-4 sm:p-5 rounded-2xl transition-all duration-200 text-left w-full cursor-pointer"
      style={{
        background: active ? item.lo : hov ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? item.md : hov ? T.borderHi : T.border}`,
        boxShadow: active ? `0 6px 24px ${item.lo}` : "none",
        transform: active || hov ? "translateY(-2px)" : "none",
      }}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3.5 transition-all duration-200"
        style={{ background: active ? `linear-gradient(135deg,${item.color},${item.color}cc)` : item.lo, border:`1px solid ${item.md}` }}>
        <Icon size={16} style={{ color: active ? "#fff" : item.color }} />
      </div>
      <p className="text-sm font-semibold leading-tight transition-colors duration-200"
        style={{ color: active ? "#fff" : T.muted, fontFamily:"'DM Sans',sans-serif" }}>
        {item.label}
      </p>
      {active && (
        <motion.div initial={{ opacity:0, scaleX:0 }} animate={{ opacity:1, scaleX:1 }}
          className="mt-2 h-0.5 w-8 rounded-full" style={{ background:item.color, transformOrigin:"left" }} />
      )}
    </button>
  );
}

/* ─── UploadZone ─────────────────────────────────────────────────────────── */
function UploadZone({ files, onAdd, onRemove }: {
  files:File[]; onAdd:(f:File[])=>void; onRemove:(name:string)=>void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onAdd(dropped);
  };

  return (
    <div>
      <label
        className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6 py-8 rounded-2xl cursor-pointer transition-all duration-200 text-center sm:text-left"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          background: dragOver ? T.accentLo : "rgba(255,255,255,0.02)",
          border: `1px dashed ${dragOver ? T.accentMd : T.border}`,
          boxShadow: dragOver ? `0 0 0 3px ${T.accentLo}` : "none",
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: dragOver ? T.accent : T.accentLo, border:`1px solid ${T.accentMd}` }}>
          <Paperclip size={20} style={{ color: dragOver ? "#fff" : T.accent }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">
            {dragOver ? "Drop files here" : "Click or drag to upload"}
          </p>
          <p className="text-xs" style={{ color:T.muted }}>Screenshots, PDFs, or documents · up to 10MB each</p>
        </div>
        <input type="file" hidden multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx"
          onChange={e => { const f = Array.from(e.target.files||[]); if (f.length) onAdd(f); e.target.value=""; }} />
      </label>

      {/* file list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-4 space-y-2">
            {files.map((file, i) => (
              <motion.div key={`${file.name}-${i}`}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-16 }}
                transition={{ duration:0.25, delay:i*0.04 }}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200"
                style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${T.border}` }}
                onMouseEnter={e => { const el=e.currentTarget; el.style.border=`1px solid ${T.accentMd}`; el.style.background=T.accentLo; }}
                onMouseLeave={e => { const el=e.currentTarget; el.style.border=`1px solid ${T.border}`; el.style.background="rgba(255,255,255,0.02)"; }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                  <FileText size={14} style={{ color:T.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                  <p className="text-xs mt-0.5" style={{ color:T.muted }}>{(file.size/1024/1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => onRemove(file.name)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
                  style={{ color:T.muted, background:"transparent" }}
                  onMouseEnter={e => { const el=e.currentTarget; el.style.background="rgba(255,77,109,0.12)"; el.style.color=T.rose; }}
                  onMouseLeave={e => { const el=e.currentTarget; el.style.background="transparent"; el.style.color=T.muted; }}>
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── FullscreenModal ────────────────────────────────────────────────────── */
function FullscreenModal({ isOpen, onClose, accentColor, accentLo, children }: {
  isOpen:boolean; onClose:()=>void; accentColor:string; accentLo:string; children:React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose} className="absolute inset-0"
            style={{ background:"rgba(2,4,12,0.88)", backdropFilter:"blur(14px)" }} />
          <motion.div
            initial={{ opacity:0, scale:0.95, y:28 }}
            animate={{ opacity:1, scale:1, y:0, transition:{ duration:0.35, ease:[0.22,1,0.36,1] } }}
            exit={{ opacity:0, scale:0.95, y:16, transition:{ duration:0.2 } }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background:T.surfaceHi, border:`1px solid ${accentColor}30`, backdropFilter:"blur(40px)" }}
          >
            <div className="h-0.5" style={{ background:`linear-gradient(90deg,${accentColor},transparent)` }} />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function SupportPage() {
  const [category, setCategory]           = useState("general");
  const [subject, setSubject]             = useState("");
  const [message, setMessage]             = useState("");
  const [files, setFiles]                 = useState<File[]>([]);
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiSuccessPulse, setAiSuccessPulse] = useState(false);
  const [moderationError, setModerationError] = useState("");

  const activeCat = CATEGORIES.find(c => c.value === category) ?? CATEGORIES[0];

  const enhanceWithAI = async () => {
    if (!subject.trim() || !message.trim()) return;
    try {
      setAiLoading(true);
      const res  = await fetch("/api/support/enhance", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ category, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "AI enhancement failed"); return; }
      setSubject(data.enhancedSubject);
      setMessage(data.enhancedMessage);
      setAiSuccessPulse(true);
      setTimeout(() => setAiSuccessPulse(false), 2500);
    } catch (err) { console.error(err); alert("Failed to enhance support request"); }
    finally { setAiLoading(false); }
  };

  const submitSupport = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("category", category);
      formData.append("subject", subject);
      formData.append("message", message);
      files.forEach(f => formData.append("attachments", f));
      const res  = await fetch("/api/support/create", { method:"POST", body:formData });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("relevant screenshots")) { setModerationError(data.error); return; }
        alert(data.error); return;
      }
      setSuccess(true); setSubject(""); setMessage(""); setFiles([]);
    } catch (err) { console.error(err); alert("Failed to submit support request"); }
    finally { setLoading(false); }
  };

  const canSubmit = subject.trim() && message.trim();

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background:T.bg, color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.18); border-radius:4px; }
      `}</style>

      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-160, left:-120, width:640, height:640, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(130px)" }} />
        <div style={{ position:"absolute", top:"40%", right:-80, width:480, height:480, borderRadius:"50%", background:"rgba(124,58,237,0.05)", filter:"blur(110px)" }} />
        <div style={{ position:"absolute", bottom:-80, left:"30%", width:400, height:400, borderRadius:"50%", background:"rgba(16,185,129,0.04)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize:"52px 52px" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">

        {/* HERO */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55, ease:[0.22,1,0.36,1] }}
          className="text-center mb-14">
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.05, duration:0.4 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-7 text-sm font-semibold"
            style={{ background:T.accentLo, color:T.accent, border:`1px solid ${T.accentMd}`, fontFamily:"'DM Sans',sans-serif" }}>
            <LifeBuoy size={15} />
            NexSyncHub Support
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background:T.emerald }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:T.emerald }} />
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.55 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.05] mb-5"
            style={{ fontFamily:"'Sora',sans-serif" }}>
            How can we
            <br />
            <span style={{ background:`linear-gradient(135deg,${T.accent},${T.violet},#22D3EE)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              help you?
            </span>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2, duration:0.5 }}
            className="max-w-lg mx-auto text-base sm:text-lg leading-relaxed"
            style={{ color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>
            Report bugs, request features, ask questions, or contact our support team. We're here to help.
          </motion.p>
        </motion.div>

        {/* FORM CARD */}
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55, delay:0.15, ease:[0.22,1,0.36,1] }}
          className="relative overflow-hidden rounded-3xl"
          style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)" }}
        >
          {/* top accent bar — changes with category */}
          <motion.div className="h-0.5"
            animate={{ background:`linear-gradient(90deg,${activeCat.color},${T.violet},transparent)` }}
            transition={{ duration:0.5 }} />

          {/* ambient glow that follows category */}
          <motion.div aria-hidden
            animate={{ background:activeCat.lo }}
            transition={{ duration:0.5 }}
            style={{ position:"absolute", top:-60, right:-60, width:240, height:240, borderRadius:"50%", filter:"blur(70px)", opacity:0.6, pointerEvents:"none", zIndex:0 }} />

          <div className="relative z-10 p-6 sm:p-10 space-y-10">

            {/* CATEGORY */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-5" style={{ color:T.muted }}>
                Support Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map(item => (
                  <CategoryCard key={item.value} item={item} active={category===item.value} onClick={() => setCategory(item.value)} />
                ))}
              </div>
            </div>

            {/* SUBJECT */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color:T.muted }}>Subject</label>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background:T.roseLo, color:T.rose }}>required</span>
              </div>
              <StyledInput value={subject} onChange={setSubject}
                placeholder="Briefly describe your request…" pulsing={aiSuccessPulse} />
            </div>

            {/* MESSAGE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color:T.muted }}>Message</label>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background:T.roseLo, color:T.rose }}>required</span>
              </div>
              <StyledTextarea value={message} onChange={setMessage}
                placeholder="Provide details, steps to reproduce, or any feedback…"
                rows={6} pulsing={aiSuccessPulse} />
            </div>

            {/* AI ENHANCE */}
            <motion.div
              animate={{ borderColor: aiSuccessPulse ? T.violet : "rgba(124,58,237,0.18)" }}
              transition={{ duration:0.5 }}
              className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
              style={{ background:"rgba(124,58,237,0.04)", border:"1px solid rgba(124,58,237,0.18)" }}
            >
              <div aria-hidden style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:T.violetLo, filter:"blur(50px)", pointerEvents:"none" }} />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1.5" style={{ fontFamily:"'Sora',sans-serif" }}>
                    <Sparkles size={15} style={{ color:T.violet }} />
                    AI Writing Assistant
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background:T.violetLo, color:T.violet, border:`1px solid ${T.violetMd}` }}>
                      Beta
                    </span>
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color:T.muted }}>
                    Improve clarity, tone, and professionalism without altering your original meaning.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  type="button"
                  onClick={enhanceWithAI}
                  disabled={aiLoading || aiSuccessPulse || !subject.trim() || !message.trim()}
                  className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                  style={{
                    background: aiSuccessPulse
                      ? `linear-gradient(135deg,${T.emerald},#059669)`
                      : `linear-gradient(135deg,${T.violet},${T.accent})`,
                    boxShadow: aiSuccessPulse
                      ? "0 6px 24px rgba(16,185,129,0.30)"
                      : "0 6px 24px rgba(124,58,237,0.30)",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {aiLoading    ? <><Loader2 size={15} className="animate-spin" /> Enhancing…</>
                  : aiSuccessPulse ? <><CheckCircle2 size={15} /> Enhanced!</>
                  :               <><Sparkles size={15} /> Enhance with AI</>}
                </motion.button>
              </div>
            </motion.div>

            {/* ATTACHMENTS */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-4" style={{ color:T.muted }}>
                Attachments <span className="normal-case font-normal" style={{ color:T.muted }}>(optional)</span>
              </label>
              <UploadZone files={files} onAdd={f => setFiles(prev => [...prev, ...f])} onRemove={name => setFiles(prev => prev.filter(f => f.name!==name))} />
            </div>

            {/* SUBMIT */}
            <motion.button
              whileHover={canSubmit ? { scale:1.02 } : {}}
              whileTap={canSubmit ? { scale:0.98 } : {}}
              onClick={submitSupport}
              disabled={loading || !canSubmit}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg,${T.accent},${T.violet})`,
                boxShadow: canSubmit ? "0 8px 32px rgba(61,123,255,0.35)" : "none",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "0.9rem",
              }}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Sending Request…</>
                : <><Send size={18} /> Submit Support Request</>
              }
            </motion.button>

            {!canSubmit && (
              <p className="text-center text-xs -mt-6" style={{ color:T.muted }}>
                Fill in subject and message to continue
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* SUCCESS MODAL */}
      <FullscreenModal isOpen={success} onClose={() => setSuccess(false)} accentColor={T.emerald} accentLo={T.emeraldLo}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background:T.emeraldLo, border:`1px solid ${T.emeraldMd}`, boxShadow:`0 0 0 8px ${T.emeraldLo}` }}>
            <CheckCircle2 size={30} style={{ color:T.emerald }} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily:"'Sora',sans-serif" }}>Request Received!</h3>
          <p className="text-sm leading-7 mb-8" style={{ color:T.muted }}>
            Thanks for reaching out. Our team has received your support request and will get back to you shortly.
          </p>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => setSuccess(false)}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ background:`linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow:"0 6px 24px rgba(61,123,255,0.35)", fontFamily:"'DM Sans',sans-serif" }}>
            Done
          </motion.button>
        </div>
      </FullscreenModal>

      {/* MODERATION MODAL */}
      <FullscreenModal isOpen={!!moderationError} onClose={() => setModerationError("")} accentColor={T.rose} accentLo={T.roseLo}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background:T.roseLo, border:`1px solid ${T.roseMd}`, boxShadow:`0 0 0 8px ${T.roseLo}` }}>
            <ShieldAlert size={28} style={{ color:T.rose }} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily:"'Sora',sans-serif" }}>Upload Blocked</h3>
          <p className="text-sm leading-7 mb-8" style={{ color:T.muted }}>
            One or more attachments violate NexSyncHub upload guidelines. Please upload only relevant screenshots or support documents.
          </p>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => setModerationError("")}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ background:"linear-gradient(135deg,#FF4D6D,#F97316)", boxShadow:"0 6px 24px rgba(255,77,109,0.30)", fontFamily:"'DM Sans',sans-serif" }}>
            Understood
          </motion.button>
        </div>
      </FullscreenModal>
    </main>
  );
}