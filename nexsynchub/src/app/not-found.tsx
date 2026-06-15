"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Compass,
  Home,
  Radar,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

const quickLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Compass,
    desc: "Return to your workspaces",
  },
  {
    label: "Features",
    href: "/features",
    icon: Sparkles,
    desc: "Explore what NexSyncHub can do",
  },
  {
    label: "Support",
    href: "/support-center",
    icon: ShieldAlert,
    desc: "Ask for help if something broke",
  },
];

const signalDots = [
  "left-[12%] top-[22%]",
  "left-[76%] top-[18%]",
  "left-[22%] top-[72%]",
  "left-[66%] top-[62%]",
  "left-[48%] top-[36%]",
];

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03060f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(61,123,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(61,123,255,0.06)_1px,transparent_1px)] bg-[size:54px_54px] opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(61,123,255,0.18),transparent_34%),linear-gradient(180deg,transparent,rgba(3,6,15,0.9))]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-500/10 shadow-[0_0_24px_rgba(61,123,255,0.18)]">
              <Zap className="h-5 w-5 text-blue-300 transition-transform group-hover:scale-110" />
            </span>
            <span className="text-lg font-black tracking-tight">
              NexSync<span className="text-blue-300">Hub</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-4 py-2 text-sm text-blue-100/80 sm:flex">
            <Activity className="h-4 w-4 text-emerald-300" />
            Route signal lost
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300">
              <Search className="h-4 w-4 text-blue-300" />
              404 - workspace route not found
            </div>

            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              This page slipped out of sync.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-gray-400 sm:text-lg">
              The link may be outdated, moved, or typed incorrectly. Your workspace is still safe, so let&apos;s get you back to a valid NexSyncHub path.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200"
              >
                <Home className="h-4 w-4" />
                Go home
              </Link>

              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[360px] rounded-[2rem] border border-blue-400/15 bg-slate-950/70 p-5 shadow-2xl shadow-blue-950/30"
          >
            <div className="absolute inset-x-5 top-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-200/50">
                recovery scan
              </span>
            </div>

            <div className="absolute inset-5 mt-10 overflow-hidden rounded-[1.5rem] border border-white/5 bg-black/30">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:34px_34px]" />

              {signalDots.map((position, index) => (
                <motion.span
                  key={position}
                  className={`absolute h-2.5 w-2.5 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(147,197,253,0.8)] ${position}`}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.55, 1, 0.55],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: index * 0.25,
                    ease: "easeInOut",
                  }}
                />
              ))}

              <motion.div
                className="absolute left-1/2 top-1/2 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                <div className="h-32 w-32 rounded-full border border-blue-300/15" />
                <Radar className="absolute h-16 w-16 text-blue-300/70" />
              </motion.div>

              <motion.div
                className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-blue-300/80 to-transparent"
                animate={{ y: [-120, 120, -120] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ letterSpacing: "0.35em", opacity: 0 }}
                  animate={{ letterSpacing: "0.08em", opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="font-mono text-7xl font-black text-white sm:text-8xl"
                >
                  404
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="grid gap-3 pb-4 md:grid-cols-3"
        >
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-blue-300/30 hover:bg-blue-500/10"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300 transition group-hover:scale-105">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
