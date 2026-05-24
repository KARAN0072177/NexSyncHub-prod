"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Sparkles, MessageSquareMore,
  CheckSquare, BellRing, Users, BrainCircuit, Activity,
  LockKeyhole, Workflow, Globe, Zap, ChevronRight,
  Star, TrendingUp, Shield,
} from "lucide-react";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.60)",
  surfaceHi:"rgba(10,20,52,0.80)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  violet:   "#7C3AED",
  violetLo: "rgba(124,58,237,0.12)",
  violetMd: "rgba(124,58,237,0.25)",
  cyan:     "#22D3EE",
  emerald:  "#10B981",
  gold:     "#F59E0B",
  rose:     "#FF4D6D",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

/* ─── feature data ───────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: MessageSquareMore, color: T.accent,   lo: T.accentLo,   md: T.accentMd,
    gradient: `linear-gradient(135deg,${T.accent},#2563EB)`,
    title: "Realtime Team Chat",
    desc: "Instant workspace communication with typing indicators, live updates, presence tracking, and organized channels.",
    stat: "< 50ms", statLabel: "latency",
  },
  {
    icon: CheckSquare, color: T.emerald, lo: "rgba(16,185,129,0.12)", md: "rgba(16,185,129,0.25)",
    gradient: "linear-gradient(135deg,#10B981,#059669)",
    title: "Task Management",
    desc: "Track work with drag-and-drop task boards, assignments, comments, activity history, and realtime updates.",
    stat: "∞", statLabel: "tasks",
  },
  {
    icon: BrainCircuit, color: T.violet,  lo: T.violetLo,   md: T.violetMd,
    gradient: `linear-gradient(135deg,${T.violet},#4F46E5)`,
    title: "AI Productivity",
    desc: "Enhance task descriptions with AI, automate workflows, and improve productivity with intelligent assistance.",
    stat: "GPT-4", statLabel: "powered",
  },
  {
    icon: ShieldCheck, color: T.rose,   lo: "rgba(255,77,109,0.12)", md: "rgba(255,77,109,0.25)",
    gradient: "linear-gradient(135deg,#FF4D6D,#F97316)",
    title: "Security & Moderation",
    desc: "Built-in audit logs, auth monitoring, moderation systems, permission controls, and AI safety protections.",
    stat: "100%", statLabel: "monitored",
  },
  {
    icon: BellRing, color: T.cyan,   lo: "rgba(34,211,238,0.12)", md: "rgba(34,211,238,0.25)",
    gradient: "linear-gradient(135deg,#22D3EE,#0891B2)",
    title: "Realtime Notifications",
    desc: "Stay informed with live notifications, unread tracking, activity alerts, and workspace updates.",
    stat: "Live", statLabel: "always",
  },
  {
    icon: Users, color: T.gold,  lo: "rgba(245,158,11,0.12)", md: "rgba(245,158,11,0.25)",
    gradient: "linear-gradient(135deg,#F59E0B,#D97706)",
    title: "Workspace Collaboration",
    desc: "Manage members, roles, permissions, ownership transfers, and collaborative workflows seamlessly.",
    stat: "∞", statLabel: "members",
  },
];

const TECH = [
  { name:"Next.js",    color:T.text },
  { name:"TypeScript", color:T.accent },
  { name:"MongoDB",    color:T.emerald },
  { name:"Socket.IO",  color:T.violet },
  { name:"AWS",        color:T.gold },
  { name:"OpenAI",     color:T.cyan },
  { name:"Tailwind",   color:"#38BDF8" },
];

const WHY_ITEMS = [
  "Realtime chat & organized channels",
  "Task workflows & drag-and-drop boards",
  "AI-enhanced task descriptions",
  "Security audit logs & moderation",
  "Workspace management & roles",
  "Notifications & activity tracking",
];

/* ─── reusable ───────────────────────────────────────────────────────────── */
function SectionBadge({ icon: Icon, label, color, lo, md }: {
  icon: React.ElementType; label: string; color: string; lo: string; md: string;
}) {
  return (
    <motion.div
      initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
      style={{ background:lo, border:`1px solid ${md}`, color, fontFamily:"'DM Sans',sans-serif" }}
    >
      <Icon size={13} />
      {label}
    </motion.div>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */
function Hero() {
  const { scrollY } = useScroll();
  const yOrb = useTransform(scrollY, [0, 600], [0, 80]);

  return (
    <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
      {/* parallax hero orbs */}
      <motion.div style={{ y: yOrb }} className="absolute inset-0 pointer-events-none" aria-hidden>
        <div style={{ position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)", width:700, height:700, borderRadius:"50%", background:`radial-gradient(circle,rgba(61,123,255,0.12) 0%,transparent 70%)`, filter:"blur(1px)" }} />
        <div style={{ position:"absolute", top:80, left:"15%", width:300, height:300, borderRadius:"50%", background:"rgba(124,58,237,0.08)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", top:120, right:"12%", width:280, height:280, borderRadius:"50%", background:"rgba(34,211,238,0.06)", filter:"blur(80px)" }} />
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* badge */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
          <span
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-8"
            style={{ background:T.violetLo, border:`1px solid ${T.violetMd}`, color:"#C4B5FD", fontFamily:"'DM Sans',sans-serif" }}
          >
            <Sparkles size={13} />
            Modern Collaboration Platform
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:T.emerald }} />
          </span>
        </motion.div>

        {/* headline */}
        <motion.h1
          initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.04] mb-7"
          style={{ fontFamily:"'Sora',sans-serif" }}
        >
          Realtime collaboration
          <br />
          <span style={{ background:`linear-gradient(135deg,${T.accent},${T.violet},${T.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            built for modern teams.
          </span>
        </motion.h1>

        {/* sub */}
        <motion.p
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl leading-8 mb-10"
          style={{ color:"rgba(255,255,255,0.68)", fontFamily:"'DM Sans',sans-serif" }}
        >
          NexSyncHub combines team chat, task management, AI productivity,
          notifications, moderation, and workspace collaboration into one
          unified platform.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <button
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95"
              style={{ background:`linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow:"0 10px 40px rgba(61,123,255,0.35)", fontFamily:"'DM Sans',sans-serif" }}
            >
              Open Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </Link>
          <Link href="/">
            <button
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold transition-all duration-200"
              style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text, backdropFilter:"blur(20px)", fontFamily:"'DM Sans',sans-serif" }}
            >
              Explore Platform
              <ChevronRight size={15} style={{ color:T.muted }} />
            </button>
          </Link>
        </motion.div>

        {/* social proof strip */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7, duration:0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-14"
        >
          {[
            { icon:Star,       value:"4.9/5",    label:"Rating" },
            { icon:Users,      value:"10k+",     label:"Teams" },
            { icon:Zap,        value:"99.9%",    label:"Uptime" },
            { icon:TrendingUp, value:"50ms",     label:"Latency" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ color:T.muted }}>
              <s.icon size={13} style={{ color:T.accent }} />
              <span className="font-bold" style={{ color:T.text }}>{s.value}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── WHY SECTION ────────────────────────────────────────────────────────── */
function WhySection() {
  const ref   = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-6 mb-28">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* left */}
        <motion.div
          initial={{ opacity:0, x:-30 }} animate={inView ? { opacity:1, x:0 } : {}}
          transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
        >
          <SectionBadge icon={Workflow} label="Why NexSyncHub" color="#93C5FD" lo="rgba(37,99,235,0.10)" md="rgba(37,99,235,0.22)" />
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight" style={{ fontFamily:"'Sora',sans-serif" }}>
            Collaboration tools<br />
            <span style={{ color:T.accent }}>shouldn't feel fragmented.</span>
          </h2>
          <p className="text-lg leading-8 mb-6" style={{ color:"rgba(255,255,255,0.68)", fontFamily:"'DM Sans',sans-serif" }}>
            Teams constantly switch between chat apps, task tools, notifications, admin systems, and productivity software.
          </p>
          <p className="text-lg leading-8" style={{ color:"rgba(255,255,255,0.68)", fontFamily:"'DM Sans',sans-serif" }}>
            NexSyncHub brings these workflows into a single connected experience with realtime collaboration, AI productivity, moderation systems, and scalable workspace infrastructure.
          </p>
        </motion.div>

        {/* right — feature checklist card */}
        <motion.div
          initial={{ opacity:0, x:30, scale:0.96 }} animate={inView ? { opacity:1, x:0, scale:1 } : {}}
          transition={{ duration:0.65, ease:[0.22,1,0.36,1], delay:0.1 }}
          className="relative overflow-hidden rounded-[32px]"
          style={{ background:T.surface, border:`1px solid ${T.border}`, backdropFilter:"blur(24px)" }}
        >
          {/* top bar */}
          <div className="h-0.5" style={{ background:`linear-gradient(90deg,${T.accent},${T.violet},${T.cyan},transparent)` }} />
          {/* glow */}
          <div aria-hidden style={{ position:"absolute", top:-80, right:-80, width:240, height:240, borderRadius:"50%", background:T.violetLo, filter:"blur(60px)", pointerEvents:"none" }} />

          <div className="relative z-10 p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                <Activity size={14} style={{ color:T.accent }} />
              </div>
              <span className="text-sm font-semibold text-white" style={{ fontFamily:"'DM Sans',sans-serif" }}>Platform capabilities</span>
            </div>

            <div className="space-y-3">
              {WHY_ITEMS.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity:0, x:16 }}
                  animate={inView ? { opacity:1, x:0 } : {}}
                  transition={{ duration:0.4, delay:0.2 + i*0.07 }}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200"
                  style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border=`1px solid ${T.accentMd}`; (e.currentTarget as HTMLDivElement).style.background="rgba(61,123,255,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border=`1px solid ${T.border}`; (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.03)"; }}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                    <ChevronRight size={12} style={{ color:T.accent }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color:"rgba(255,255,255,0.82)", fontFamily:"'DM Sans',sans-serif" }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FEATURE CARD ───────────────────────────────────────────────────────── */
function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [hov, setHov] = useState(false);
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity:0, y:24 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:"-40px" }}
      transition={{ duration:0.5, ease:[0.22,1,0.36,1], delay:index*0.07 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden rounded-[28px] transition-all duration-300 cursor-default"
      style={{
        background: T.surface,
        border: `1px solid ${hov ? feature.md : T.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transform: hov ? "translateY(-5px)" : "none",
        boxShadow: hov ? `0 12px 40px ${feature.lo}, 0 0 0 1px ${feature.md}` : "none",
      }}
    >
      {/* top accent */}
      <div className="h-0.5 transition-opacity duration-300" style={{ background:feature.gradient, opacity: hov ? 1 : 0.3 }} />
      {/* glow blob */}
      <div aria-hidden style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:feature.lo, filter:"blur(50px)", opacity: hov ? 1 : 0.4, transition:"opacity 0.4s", pointerEvents:"none" }} />

      <div className="relative z-10 p-7">
        {/* icon + stat */}
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: hov ? feature.gradient : feature.lo,
              border: `1px solid ${feature.md}`,
              boxShadow: hov ? `0 4px 20px ${feature.lo}` : "none",
            }}
          >
            <Icon size={22} style={{ color: hov ? "#fff" : feature.color }} />
          </div>

          <div className="text-right">
            <p className="text-xl font-black" style={{ color:feature.color, fontFamily:"'Sora',sans-serif" }}>{feature.stat}</p>
            <p className="text-xs" style={{ color:T.muted }}>{feature.statLabel}</p>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-3 transition-colors duration-200"
          style={{ color: hov ? "#fff" : T.text, fontFamily:"'Sora',sans-serif" }}>
          {feature.title}
        </h3>
        <p className="text-sm leading-7 transition-colors duration-200"
          style={{ color: hov ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.52)", fontFamily:"'DM Sans',sans-serif" }}>
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── SECURITY SECTION ───────────────────────────────────────────────────── */
function SecuritySection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-6 mb-28">
      <motion.div
        initial={{ opacity:0, y:20 }} animate={inView ? { opacity:1, y:0 } : {}}
        transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
        className="relative overflow-hidden rounded-[36px] p-10 sm:p-14"
        style={{ background:`linear-gradient(135deg,rgba(124,58,237,0.08),rgba(61,123,255,0.05))`, border:`1px solid rgba(255,77,109,0.15)`, backdropFilter:"blur(24px)" }}
      >
        {/* top bar */}
        <div className="h-0.5 absolute top-0 left-0 right-0" style={{ background:"linear-gradient(90deg,#FF4D6D,#F97316,transparent)" }} />
        {/* glow */}
        <div aria-hidden style={{ position:"absolute", top:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"rgba(255,77,109,0.10)", filter:"blur(80px)", pointerEvents:"none" }} />
        <div aria-hidden style={{ position:"absolute", bottom:-60, left:-60, width:240, height:240, borderRadius:"50%", background:"rgba(124,58,237,0.08)", filter:"blur(70px)", pointerEvents:"none" }} />

        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <SectionBadge icon={LockKeyhole} label="Trust & Security" color="#FDA4AF" lo="rgba(255,77,109,0.10)" md="rgba(255,77,109,0.22)" />
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight" style={{ fontFamily:"'Sora',sans-serif" }}>
              Built with platform<br />
              <span style={{ color:"#FF4D6D" }}>safety in mind.</span>
            </h2>
            <p className="text-lg leading-8" style={{ color:"rgba(255,255,255,0.70)", fontFamily:"'DM Sans',sans-serif" }}>
              NexSyncHub includes authentication systems, moderation tools, audit logs, permission controls, realtime monitoring, and AI-powered safety infrastructure to keep workspaces secure.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon:Shield,     label:"Audit Logs",      desc:"Every action tracked",   color:"#FF4D6D", lo:"rgba(255,77,109,0.10)", md:"rgba(255,77,109,0.22)" },
              { icon:LockKeyhole,label:"Auth Monitoring",  desc:"Realtime security logs",  color:"#F97316", lo:"rgba(249,115,22,0.10)", md:"rgba(249,115,22,0.22)" },
              { icon:ShieldCheck,label:"Moderation",       desc:"AI content safety",        color:T.emerald, lo:"rgba(16,185,129,0.10)", md:"rgba(16,185,129,0.22)" },
              { icon:Users,      label:"Role Control",     desc:"Granular permissions",     color:T.accent,  lo:T.accentLo,              md:T.accentMd },
            ].map(({ icon:Icon, label, desc, color, lo, md }, i) => (
              <motion.div
                key={label}
                initial={{ opacity:0, scale:0.95 }} animate={inView ? { opacity:1, scale:1 } : {}}
                transition={{ duration:0.4, delay:0.2+i*0.08 }}
                className="p-4 rounded-2xl"
                style={{ background:lo, border:`1px solid ${md}` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background:`${color}20`, border:`1px solid ${color}30` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <p className="text-sm font-bold text-white mb-0.5" style={{ fontFamily:"'DM Sans',sans-serif" }}>{label}</p>
                <p className="text-xs" style={{ color:"rgba(255,255,255,0.45)" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── TECH STACK ─────────────────────────────────────────────────────────── */
function TechStack() {
  return (
    <section className="max-w-7xl mx-auto px-6 mb-28 text-center">
      <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}>
        <SectionBadge icon={Sparkles} label="Technology Stack" color={T.text} lo="rgba(255,255,255,0.04)" md="rgba(255,255,255,0.08)" />
        <h2 className="text-4xl md:text-5xl font-black mb-12" style={{ fontFamily:"'Sora',sans-serif" }}>
          Powered by modern technologies.
        </h2>

        <div className="flex flex-wrap justify-center gap-3">
          {TECH.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity:0, scale:0.9 }}
              whileInView={{ opacity:1, scale:1 }}
              viewport={{ once:true }}
              transition={{ duration:0.35, delay:i*0.06 }}
              whileHover={{ scale:1.06, y:-3 }}
              className="px-5 py-3 rounded-2xl text-sm font-semibold cursor-default transition-all duration-200"
              style={{
                background: `${tech.color}12`,
                border: `1px solid ${tech.color}25`,
                color: tech.color,
                backdropFilter: "blur(20px)",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {tech.name}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <motion.div
        initial={{ opacity:0, y:24 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }}
        transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
        className="relative overflow-hidden rounded-[40px] p-12 sm:p-16 text-center"
        style={{ background:`linear-gradient(135deg,rgba(61,123,255,0.10),rgba(124,58,237,0.10),rgba(34,211,238,0.06))`, border:`1px solid ${T.borderHi}`, backdropFilter:"blur(24px)" }}
      >
        {/* top gradient bar */}
        <div className="h-0.5 absolute top-0 left-0 right-0" style={{ background:`linear-gradient(90deg,${T.accent},${T.violet},${T.cyan},transparent)` }} />

        {/* ambient orbs */}
        <div aria-hidden style={{ position:"absolute", top:-100, left:"20%", width:400, height:400, borderRadius:"50%", background:"rgba(61,123,255,0.08)", filter:"blur(100px)", pointerEvents:"none" }} />
        <div aria-hidden style={{ position:"absolute", bottom:-80, right:"15%", width:320, height:320, borderRadius:"50%", background:"rgba(124,58,237,0.08)", filter:"blur(80px)", pointerEvents:"none" }} />

        <div className="relative z-10">
          <motion.div
            animate={{ rotate:[0,360] }}
            transition={{ duration:20, repeat:Infinity, ease:"linear" }}
            className="inline-flex mb-6"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:`linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow:`0 8px 32px rgba(61,123,255,0.40)` }}>
              <Sparkles size={26} className="text-white" />
            </div>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight"
            style={{ fontFamily:"'Sora',sans-serif" }}>
            Ready to collaborate
            <br />
            <span style={{ background:`linear-gradient(135deg,${T.accent},${T.violet},${T.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              smarter?
            </span>
          </h2>

          <p className="max-w-xl mx-auto text-lg mb-10" style={{ color:"rgba(255,255,255,0.65)", fontFamily:"'DM Sans',sans-serif" }}>
            Create your workspace, manage projects, collaborate in realtime, and build faster with NexSyncHub.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-white"
                style={{ background:`linear-gradient(135deg,${T.accent},${T.violet})`, boxShadow:"0 10px 40px rgba(61,123,255,0.40)", fontFamily:"'DM Sans',sans-serif" }}
              >
                Get Started Free
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link href="/">
              <motion.button
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold"
                style={{ background:T.surface, border:`1px solid ${T.borderHi}`, color:T.text, backdropFilter:"blur(20px)", fontFamily:"'DM Sans',sans-serif" }}
              >
                Explore Platform
                <ChevronRight size={16} />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background:T.bg, color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::selection { background:rgba(61,123,255,0.25); color:#fff; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(99,140,255,0.20); border-radius:4px; }
      `}</style>

      {/* global ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position:"absolute", top:-200, left:-160, width:700, height:700, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(140px)" }} />
        <div style={{ position:"absolute", top:"30%", right:-100, width:500, height:500, borderRadius:"50%", background:"rgba(124,58,237,0.06)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", bottom:-100, left:"35%", width:450, height:450, borderRadius:"50%", background:"rgba(34,211,238,0.04)", filter:"blur(110px)" }} />
        {/* dot grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.025) 1px,transparent 1px)", backgroundSize:"56px 56px" }} />
      </div>

      <div className="relative z-10">
        <Hero />

        {/* WHY */}
        <WhySection />

        {/* FEATURES */}
        <section className="max-w-7xl mx-auto px-6 mb-28">
          <div className="text-center mb-14">
            <SectionBadge icon={Globe} label="Platform Features" color={T.emerald} lo="rgba(16,185,129,0.10)" md="rgba(16,185,129,0.22)" />
            <motion.h2
              initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              transition={{ duration:0.55 }}
              className="text-4xl md:text-5xl font-black mb-5"
              style={{ fontFamily:"'Sora',sans-serif" }}
            >
              Built for modern teamwork.
            </motion.h2>
            <motion.p
              initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
              transition={{ delay:0.1, duration:0.5 }}
              className="max-w-2xl mx-auto text-lg"
              style={{ color:"rgba(255,255,255,0.60)", fontFamily:"'DM Sans',sans-serif" }}
            >
              Realtime collaboration, AI productivity, moderation systems, and scalable workspace management — all in one platform.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.title} feature={feat} index={i} />
            ))}
          </div>
        </section>

        <SecuritySection />
        <TechStack />
        <CTA />
      </div>
    </main>
  );
}