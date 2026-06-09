"use client";

import React, {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Box,
  BookOpen,
  Building2,
  Scale,
  Globe,
  Loader2,
} from "lucide-react";

const NEWSLETTER_PENDING_EMAIL_KEY =
  "nexsynchub:newsletter:pending-email";

const NEWSLETTER_VERIFIED_EVENT_KEY =
  "nexsynchub:newsletter:verified";

function getInitialPendingEmail() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem(
      NEWSLETTER_PENDING_EMAIL_KEY
    ) || ""
  );
}

function getInitialStatus() {
  return getInitialPendingEmail()
    ? "success"
    : "idle";
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(getInitialStatus);
  const [successType, setSuccessType] =
    useState<
      "verification_sent" | "already_verified"
    >("verification_sent");
  const [message, setMessage] = useState(() =>
    getInitialPendingEmail()
      ? "Confirmation link sent. Check your inbox."
      : ""
  );
  const [submittedEmail, setSubmittedEmail] =
    useState(getInitialPendingEmail);

  const markVerified = () => {
    setSuccessType("already_verified");
    setMessage(
      "Verified. You are now on the intelligence list."
    );
    window.localStorage.removeItem(
      NEWSLETTER_PENDING_EMAIL_KEY
    );
  };

  useEffect(() => {
    if (
      status !== "success" ||
      successType !== "verification_sent" ||
      !submittedEmail
    ) {
      return;
    }

    const checkVerificationStatus = async () => {
      try {
        const response = await fetch(
          "/api/newsletter/status",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email: submittedEmail,
            }),
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as {
            subscriptionStatus?:
              | "verified"
              | "pending_verification"
              | "unsubscribed"
              | "not_found";
          };

        if (
          data.subscriptionStatus ===
          "verified"
        ) {
          markVerified();
        }
      } catch {
        // Keep the pending state; the next poll can recover.
      }
    };

    checkVerificationStatus();

    const handleVerifiedSignal = () => {
      void checkVerificationStatus();
    };

    const handleStorageEvent = (
      event: StorageEvent
    ) => {
      if (
        event.key ===
        NEWSLETTER_VERIFIED_EVENT_KEY
      ) {
        void checkVerificationStatus();
      }
    };

    window.addEventListener(
      NEWSLETTER_VERIFIED_EVENT_KEY,
      handleVerifiedSignal
    );
    window.addEventListener(
      "storage",
      handleStorageEvent
    );

    const pollTimer =
      window.setInterval(
        checkVerificationStatus,
        30000
      );

    return () => {
      window.removeEventListener(
        NEWSLETTER_VERIFIED_EVENT_KEY,
        handleVerifiedSignal
      );
      window.removeEventListener(
        "storage",
        handleStorageEvent
      );
      window.clearInterval(pollTimer);
    };
  }, [
    status,
    successType,
    submittedEmail,
  ]);

  const resetSubscribeForm = () => {
    setStatus("idle");
    setMessage("");
    setSubmittedEmail("");
    window.localStorage.removeItem(
      NEWSLETTER_PENDING_EMAIL_KEY
    );
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.02 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } },
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || status === "loading") {
      return;
    }

      setStatus("loading");
      setMessage("");
      setSubmittedEmail(normalizedEmail);
      window.localStorage.setItem(
        NEWSLETTER_PENDING_EMAIL_KEY,
        normalizedEmail
      );

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          source: "public_site",
          tags: [
            "workspace-intelligence",
            "operational-digest",
          ],
        }),
      });

      const data = (await response.json()) as {
        subscriptionStatus?:
          | "verification_sent"
          | "already_verified"
          | "received";
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        window.localStorage.removeItem(
          NEWSLETTER_PENDING_EMAIL_KEY
        );
        setMessage(
          data.error ||
            "Unable to register this email right now."
        );
        return;
      }

      setStatus("success");
      if (
        data.subscriptionStatus ===
        "already_verified"
      ) {
        setSuccessType("already_verified");
        setMessage(
          "Already verified for intelligence updates."
        );
        window.localStorage.removeItem(
          NEWSLETTER_PENDING_EMAIL_KEY
        );
      } else {
        setSuccessType("verification_sent");
        setMessage(
          "Confirmation link sent. Check your inbox."
        );
      }
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(
        "Connection failed. Please try again in a moment."
      );
    }
  };

  return (
    <footer className="relative border-t border-white/[0.06] bg-[#03060F] text-slate-400 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      
      {/* --- Ambient Lighting Layers --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="absolute -top-40 left-1/3 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/10 to-violet-500/5 blur-[140px] rounded-full pointer-events-none animate-pulse duration-[8s]" />
      <div className="absolute -bottom-20 right-1/4 w-[400px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Fine-line Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none mix-blend-overlay" />

      {/* --- Massive Edge Title Effect (The Uniqueness Factor) --- */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-0 opacity-[0.02] transition-opacity duration-700 w-full flex justify-center">
        <h2 className="text-[14vw] font-bold text-white tracking-tighter whitespace-nowrap text-center leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>
          NexSyncHub
        </h2>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-12"
      >
        {/* --- Top Hub Structure --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-16 xl:gap-8 pb-20 border-b border-white/[0.06]">
          
          {/* Brand Pillar */}
          <div className="xl:col-span-1 flex flex-col justify-between space-y-12">
            <motion.div variants={itemVariants} className="space-y-6">
              <Link href="/" className="flex items-center gap-3 w-max group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/30 flex items-center justify-center group-hover:border-indigo-400/60 transition-all duration-300 shadow-[0_0_25px_-5px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_30px_-2px_rgba(99,102,241,0.5)]">
                  <Zap className="w-5 h-5 text-indigo-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-indigo-200" style={{ fontFamily: "'Sora', sans-serif" }}>
                  NexSyncHub
                </span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-light">
                NexSyncHub brings chat, tasks, files, and activity tracking into one workspace so teams can collaborate without switching between tools.
              </p>
            </motion.div>

            {/* Premium Interactive Newsletter Input */}
            <motion.div variants={itemVariants} className="space-y-4 max-w-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Intelligence updates
              </p>
              
              {status !== "success" ? (
                <form onSubmit={handleSubscribe} className="relative group" noValidate>
                  <div className="absolute -inset-px bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl opacity-20 blur-sm group-hover:opacity-50 transition duration-500 group-focus-within:opacity-60" />
                  <div className="relative flex items-center bg-[#070b19]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-1.5 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "loading"}
                      className="w-full bg-transparent pl-3 pr-2 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-700/60 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center shadow-lg active:scale-[0.97] group/btn shrink-0 min-w-[72px]"
                    >
                      {status === "loading" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline mr-1.5 text-xs tracking-wide">Join</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-rose-300"
                    >
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{message}</span>
                    </motion.div>
                  )}
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3 p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 backdrop-blur-md"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0" />
                    <span className="font-medium tracking-wide leading-relaxed">
                      {successType === "already_verified"
                        ? "Verified. You are already on the intelligence list."
                        : message}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetSubscribeForm}
                    className="ml-7 text-xs font-semibold text-emerald-300/80 transition-colors hover:text-emerald-200"
                  >
                    Use another email
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Links Grid System */}
          <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-10 xl:pl-12">
            {[
              {
                title: "Product",
                icon: Box,
                links: [
                  { name: "Features", href: "/features" },
                  { name: "Integrations", href: "/integrations" },
                  { name: "Pricing Matrix", href: "/pricing" },
                  { name: "Changelog", href: "/changelog" },
                  { name: "Shield Engine", href: "/security", badge: "Core" },
                ],
              },
              {
                title: "Resources",
                icon: BookOpen,
                links: [
                  { name: "Documentation", href: "/docs" },
                  { name: "System Status", href: "/status" },
                  { name: "API Blueprint", href: "/api" },
                  { name: "Open Source", href: "/oss" },
                ],
              },
              {
                title: "Company",
                icon: Building2,
                links: [
                  { name: "About Us", href: "/about" },
                  { name: "Careers", href: "/careers", badge: "Active" },
                  { name: "Intel/Blog", href: "/blog" },
                  { name: "Press Kit", href: "/press" },
                ],
              },
              {
                title: "Legal",
                icon: Scale,
                links: [
                  { name: "Privacy Protocol", href: "/privacy" },
                  { name: "Terms of Use", href: "/terms" },
                  { name: "Cookie Schema", href: "/cookies" },
                  { name: "DPA Agreement", href: "/dpa" },
                ],
              },
            ].map((section) => (
              <motion.div key={section.title} variants={itemVariants} className="space-y-6">
                <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-200">
                  <section.icon className="w-3.5 h-3.5 text-indigo-400/80" />
                  {section.title}
                </h4>
                <ul className="space-y-3.5 text-sm">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
                      >
                        <span className="relative py-0.5">
                          {link.name}
                          {/* Premium Center-out underline link micro-animation */}
                          <span className="absolute left-1/2 bottom-0 w-0 h-px bg-indigo-400 group-hover:w-full group-hover:left-0 transition-all duration-300" />
                        </span>
                        {link.badge && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md font-semibold tracking-wider uppercase scale-90 group-hover:bg-indigo-500/20 transition-colors">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- Bottom Row Utilities & Credits --- */}
        <motion.div 
          variants={itemVariants} 
          className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-light"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 order-2 md:order-1">
            <p className="font-normal text-slate-600">© {new Date().getFullYear()} NexSyncHub Inc. System architecture stable.</p>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="#" className="hover:text-indigo-400 transition-colors duration-200">X / Twitter</a>
              <span className="text-slate-800">/</span>
              <a href="#" className="hover:text-indigo-400 transition-colors duration-200">GitHub</a>
              <span className="text-slate-800">/</span>
              <a href="#" className="hover:text-indigo-400 transition-colors duration-200">Discord</a>
            </div>
          </div>

          <div className="flex items-center gap-4 order-1 md:order-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Geo Location / Language Mock Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.01] border border-white/[0.04] rounded-full text-slate-400 hover:border-white/[0.08] transition-colors cursor-pointer">
              <Globe className="w-3 h-3 text-slate-500" />
              <span>US-EN</span>
            </div>

            {/* Infrastructure Health Capsule */}
            <Link 
              href="/status" 
              className="flex items-center gap-2.5 px-3.5 py-1.5 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05] border border-emerald-500/10 hover:border-emerald-500/20 rounded-full transition-all duration-300 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 font-medium tracking-wider uppercase text-[10px]">Operational</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
