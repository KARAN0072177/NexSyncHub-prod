"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Box,
  BookOpen,
  Building2,
  Scale,
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer className="relative border-t border-white/5 bg-[#03060F] text-slate-400 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Ambient Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="absolute -top-24 left-1/4 w-[500px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#03060F]/50 to-[#03060F] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-20px" }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12"
      >
        {/* Main Grid split into Top Info/Newsletter and Links */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-16 pb-16 border-b border-white/5">
          
          {/* Brand & Newsletter Section */}
          <div className="xl:col-span-1 flex flex-col justify-between space-y-10">
            <motion.div variants={itemVariants} className="space-y-5">
              <Link href="/" className="flex items-center gap-3 w-max group">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]">
                  <Zap className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "'Sora', sans-serif" }}>NexSyncHub</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                The modern layer for team collaboration. Securely centralizing asynchronous engineering workspaces with AI-driven insights.
              </p>
            </motion.div>

            {/* Serious SaaS Newsletter Section */}
            <motion.div variants={itemVariants} className="space-y-4 max-w-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                Subscribe to updates
              </p>
              {!subscribed ? (
                <form onSubmit={handleSubscribe} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative flex items-center bg-[#0A0E1A]/80 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-inner">
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)] active:scale-95"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">Subscribed successfully.</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Links Grid System */}
          <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-8 xl:pl-16">
            {[
              {
                title: "Product",
                icon: Box,
                links: [
                  { name: "Features", href: "/features" },
                  { name: "Integrations", href: "/integrations" },
                  { name: "Pricing", href: "/pricing" },
                  { name: "Changelog", href: "/changelog" },
                  { name: "Enterprise Security", href: "/security" },
                ],
              },
              {
                title: "Resources",
                icon: BookOpen,
                links: [
                  { name: "Documentation", href: "/docs" },
                  { name: "Guides & Playbooks", href: "/guides" },
                  { name: "API Reference", href: "/api" },
                  { name: "Open Source", href: "/system-status" },
                ],
              },
              {
                title: "Company",
                icon: Building2,
                links: [
                  { name: "About Us", href: "/about" },
                  { name: "Careers", href: "/careers", badge: "Hiring" },
                  { name: "Blog", href: "/blog" },
                  { name: "Customers", href: "/customers" },
                ],
              },
              {
                title: "Legal",
                icon: Scale,
                links: [
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Terms of Service", href: "/terms" },
                  { name: "Cookie Policy", href: "/cookies" },
                  { name: "Data Processing", href: "/dpa" },
                ],
              },
            ].map((section) => (
              <motion.div key={section.title} variants={itemVariants} className="space-y-5">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-200">
                  <section.icon className="w-4 h-4 text-indigo-400" />
                  {section.title}
                </h4>
                <ul className="space-y-3 text-sm">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-slate-400 hover:text-indigo-300 transition-colors duration-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/0 group-hover:bg-indigo-400 transition-colors duration-300" />
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                          {link.name}
                          {link.badge && (
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold uppercase tracking-widest">
                              {link.badge}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Metadata & System Status */}
        <motion.div 
          variants={itemVariants} 
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
            <p className="font-medium">© {new Date().getFullYear()} NexSyncHub Inc. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-slate-300 transition-colors">Twitter / X</a>
              <a href="#" className="hover:text-slate-300 transition-colors">GitHub</a>
              <a href="#" className="hover:text-slate-300 transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Infrastructure Health Indicator */}
          <Link 
            href="/status" 
            className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-full transition-all duration-300 backdrop-blur-md hover:border-white/10"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="text-slate-300 text-xs font-bold tracking-wide uppercase">All Systems Operational</span>
          </Link>
        </motion.div>
      </motion.div>
    </footer>
  );
}