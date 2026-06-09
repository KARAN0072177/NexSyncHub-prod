"use client";

import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  MessageSquare,
  CheckSquare,
  Bell,
  CalendarDays,
  Clock,
  Users,
  Layers,
  GitBranch,
  Shield,
  ArrowRight,
  Play,
  FileText,
  CircleCheck,
} from "lucide-react";
import { Typewriter } from "react-simple-typewriter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 selection:text-white">
      {/* Subtle background grid */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl -z-10" />

      <main>
        <Hero />
        <Features />
        <WhyNexSyncHub />
        <WorkspacePreview />
        <TeamCollaboration />
      </main>
    </div>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 150]);

  return (
    <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-bold tracking-tighter leading-tight"
        >
          Real‑time collaboration <br />
          <span className="text-indigo-400">
            <Typewriter
              words={["without the chaos.", "for modern teams.", "at the speed of light.", "in one workspace."]}
              loop={0}
              cursor
              cursorStyle="|"
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={2000}
            />
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-400 max-w-xl"
        >
          NexSyncHub brings chat, tasks, documents, and workspaces into one
          calm, fast, and focused environment. Built for teams that ship.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 pt-2"
        >
          <button className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-all">
            Get started free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-transparent border border-white/10 text-white hover:bg-white/5 transition-all">
            <Play className="w-4 h-4" />
            Watch demo
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-sm text-gray-400"
        >
          {[
            "Real-time chat",
            "Task management",
            "File collaboration",
            "Role-based permissions",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CircleCheck className="h-4 w-4 text-emerald-400" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Parallax wrapper for Realistic product mockup */}
      <motion.div style={{ y }} className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="w-full h-full"
        >
        <div className="bg-gray-900/80 border border-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl shadow-indigo-500/5">
          {/* Mock header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
            </div>
            <span className="text-xs text-gray-500"># general</span>
          </div>
          {/* Chat messages */}
          <div className="space-y-3">
            <div className="flex gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                U
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2 max-w-[80%]">
                <p className="text-gray-300">Just pushed the new API integration, everyone can test now.</p>
                <span className="text-gray-600">2:41 PM</span>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-[10px] font-bold">
                K
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2 max-w-[80%]">
                <p className="text-gray-300">Nice, I&lsquo;ll review after lunch. The Kanban board is synced.</p>
                <span className="text-gray-600">2:42 PM</span>
              </div>
            </div>
          </div>
          {/* Quick tasks preview */}
          <div className="mt-4 border-t border-white/5 pt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" /> 3 tasks open
              </span>
              <span>Docs</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded border border-gray-600" />
                <span className="text-gray-300">Update onboarding flow</span>
                <span className="ml-auto text-gray-600">Tomorrow</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded border border-gray-600" />
                <span className="text-gray-300">Fix auth token refresh</span>
                <span className="ml-auto text-gray-600">In progress</span>
              </div>
            </div>
          </div>
        </div>
        {/* Floating activity indicator */}
        <div className="absolute -bottom-4 -right-4 bg-gray-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-lg backdrop-blur-md group cursor-default hover:bg-gray-800/90 transition-colors">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-green-400 rounded-full absolute inset-0 animate-ping" />
            </div>
            <span className="text-gray-300">5 members online</span>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
            <div className="bg-gray-800 border border-white/10 rounded-lg p-2.5 shadow-xl">
              <div className="flex flex-col gap-1.5 text-[11px] text-gray-300">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Alex Chen</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Priya Singh</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Marcus Lee</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Zara Miller</div>
                <div className="flex items-center gap-2 text-gray-500 pl-3.5 italic">+ 1 more</div>
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800" />
          </div>
        </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: MessageSquare,
      title: "Real‑time chat",
      desc: "Fast, persistent messaging with threads, reactions, and file sharing. Built for developers who hate context switching.",
    },
    {
      icon: CheckSquare,
      title: "Task management",
      desc: "Kanban boards, lists, and calendar views. Assign tasks, set deadlines, and track progress without leaving the workspace.",
    },
    {
      icon: Layers,
      title: "Shared documents",
      desc: "Collaborative notes and docs with rich text. Keep meeting notes, specs, and guides in one place.",
    },
    {
      icon: Bell,
      title: "Smart notifications",
      desc: "Customizable alerts for mentions, task updates, and workspace changes. Zero noise, only signal.",
    },
    {
      icon: GitBranch,
      title: "Activity timeline",
      desc: "A transparent log of every change across the workspace. Know who did what and when.",
    },
    {
      icon: Shield,
      title: "Roles & permissions",
      desc: "Granular access control. Invite guests, set project leads, and keep sensitive channels private.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <section className="relative py-24 px-6 max-w-6xl mx-auto">
      {/* Subtle background glow for the section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Collaboration that feels like your code editor
        </h2>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
          Every tool you need to build, discuss, and ship – in one minimalist workspace.
        </p>
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative"
      >
        {features.map((feat) => (
          <motion.div
            key={feat.title}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="group relative bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-8 transition-all duration-300 overflow-hidden"
          >
            {/* Hover gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] transition-all duration-300">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-gray-200 group-hover:text-white transition-colors">
                {feat.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                {feat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function WhyNexSyncHub() {
  const scatteredTools = [
    ["Chat app", "Conversations"],
    ["Task board", "Assignments"],
    ["Docs tool", "Specs"],
    ["File drive", "Uploads"],
    ["Email inbox", "Alerts"],
  ];

  const frustrations = [
    "Lost files",
    "Missed updates",
    "Too many tabs",
    "Context switching",
    "Duplicate notifications",
  ];

  const workspaceTools = [
    "Chat",
    "Tasks",
    "Media Hub",
    "Docs",
    "Activity Timeline",
    "Role Management",
    "Smart Notifications",
  ];

  const outcomes = [
    {
      icon: Layers,
      title: "Stop Context Switching",
      desc: "Chat, tasks, docs, and Media Hub stay inside the same workspace.",
    },
    {
      icon: GitBranch,
      title: "Track Everything",
      desc: "Assignments, role changes, uploads, and updates appear in the Activity Timeline.",
    },
    {
      icon: Shield,
      title: "Built For Real Teams",
      desc: "Role Management, workspace controls, and collaboration settings are included.",
    },
    {
      icon: FileText,
      title: "Centralized Workspace Media",
      desc: "Access uploaded files, images, videos, and documents without digging through months of chat history.",
    },
  ];

  const comparisons = [
    ["Important updates get lost in chat", "Task activity stays attached to work"],
    ["Files are scattered across tools", "Media Hub keeps uploads centralized"],
    ["Too many browser tabs", "Everything lives in one focused workspace"],
    ["No visibility into changes", "Every action has an activity trail"],
    ["Permissions become messy", "Role Management keeps access clear"],
  ];

  return (
    <section className="relative py-24 px-6 max-w-6xl mx-auto">
      <div className="absolute inset-x-8 top-20 h-64 bg-indigo-500/5 blur-[120px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="mb-14 max-w-3xl"
      >
        <span className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-300/80">
          Why NexSyncHub
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
          Work from one workspace, not five apps.
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Chat, tasks, files, activity tracking, and team collaboration in one focused workspace.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_1.05fr] gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-300">Traditional Workflow</p>
              <p className="text-sm text-gray-500">Scattered work, scattered context.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-500">
              5 tabs
            </span>
          </div>

          <div className="space-y-3">
            {scatteredTools.map(([tool, job], index) => (
              <div
                key={tool}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3 opacity-70"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-xs text-gray-500">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-300">{tool}</span>
                </div>
                <span className="text-sm text-gray-500">{job}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
            {["5 tools", "5 logins", "5 places to search"].map((item) => (
              <div key={item} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-gray-500">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-red-200/60">
              Common frustrations
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {frustrations.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-sm text-gray-500">
                  <span className="text-red-300/70">x</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.08] p-6 shadow-2xl shadow-indigo-500/10"
        >
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">NexSyncHub Workflow</p>
                <p className="text-sm text-indigo-100/60">One workspace, connected work.</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                unified
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-400/10">
                  <Layers className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">NexSyncHub</p>
                  <p className="text-sm text-gray-500">Your team&apos;s operating workspace.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {workspaceTools.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-gray-300">
                    <CircleCheck className="h-4 w-4 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {comparisons.map(([problem, solution]) => (
                <div key={problem} className="grid gap-2 rounded-xl border border-white/5 bg-black/25 p-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <span className="text-gray-500">{problem}</span>
                  <ArrowRight className="hidden h-4 w-4 text-indigo-300 sm:block" />
                  <span className="text-gray-200">{solution}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {outcomes.map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function WorkspacePreview() {
  const tabs = ["Chat", "Tasks", "Docs", "Calendar", "Files"];
  const [activeTab, setActiveTab] = useState("Chat");

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">
          See how your team works together
        </h2>
        <p className="text-gray-400 mt-3 max-w-lg mx-auto">
          A real workspace view – no mockups, no abstractions.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="bg-gray-900/80 border border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/5"
      >
        {/* Tabs */}
        <div className="flex border-b border-white/5 px-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="workspace-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                />
              )}
            </button>
          ))}
        </div>
        {/* Content area */}
        <div className="p-5 h-64 overflow-hidden relative">
          {activeTab === "Chat" && (
            <div className="space-y-3">
              <MockChatMessage user="Alex" time="Now" text="Can someone review my pull request? It's ready." delay={0.2} />
              <MockChatMessage user="Priya" time="2m ago" text="On it. The tests are passing, nice work." delay={1.8} />
              <MockChatMessage user="Alex" time="Now" text="Thanks! Merging after the standup." delay={3.5} />
            </div>
          )}
          {activeTab === "Tasks" && (
            <div className="grid gap-3 md:grid-cols-3">
              <MockTaskColumn
                title="To Do"
                count={4}
                tasks={[
                  { title: "Finalize onboarding checklist", meta: "Alex · Today", tone: "indigo" },
                  { title: "Upload launch assets to Media Hub", meta: "Priya · Tomorrow", tone: "emerald" },
                ]}
              />
              <MockTaskColumn
                title="In Progress"
                count={2}
                tasks={[
                  { title: "Review workspace role settings", meta: "Marcus · 72%", tone: "amber" },
                  { title: "Connect task activity updates", meta: "Zara · Live", tone: "indigo" },
                ]}
              />
              <MockTaskColumn
                title="Done"
                count={5}
                tasks={[
                  { title: "Create product roadmap channel", meta: "Completed", tone: "emerald", done: true },
                  { title: "Publish support workflow notes", meta: "Completed", tone: "emerald", done: true },
                ]}
              />
            </div>
          )}
          {activeTab === "Docs" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300"><FileText className="w-4 h-4"/> Engineering Guide</div>
                <p className="text-gray-600 text-xs mt-1">Last edited 3h ago</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300"><FileText className="w-4 h-4"/> Meeting Notes Q2</div>
                <p className="text-gray-600 text-xs mt-1">Last edited 1d ago</p>
              </div>
            </div>
          )}
          {activeTab === "Calendar" && (
            <div className="grid h-full gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.06] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-400/10 text-indigo-300">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Calendar Sync</p>
                    <p className="text-xs text-gray-500">Planned for team timelines</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-400">
                  Soon, task deadlines and workspace activity will connect into a clean planning view.
                </p>
                <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300">
                  Designed to turn task updates into a shared team schedule.
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ["Today", "Review launch checklist", "Task deadline"],
                  ["Tomorrow", "Workspace permissions audit", "Activity reminder"],
                  ["Friday", "Media Hub cleanup", "Team review"],
                ].map(([day, title, type], index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.25 }}
                    className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3"
                  >
                    <div className="rounded-lg border border-white/5 bg-black/25 px-3 py-2 text-center">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-indigo-300">{day}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-200">{title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        {type}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "Files" && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white/5 rounded-lg p-3">design-mock.fig</div>
              <div className="bg-white/5 rounded-lg p-3">api-spec.md</div>
              <div className="bg-white/5 rounded-lg p-3">logo.svg</div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function MockChatMessage({
  user,
  time,
  text,
  delay = 0,
}: {
  user: string;
  time: string;
  text: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex gap-3 text-sm"
    >
      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
        {user[0]}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{user}</span>
          <span className="text-gray-600 text-xs">{time}</span>
        </div>
        <p className="text-gray-300 mt-0.5 leading-relaxed">
          {text.split("").map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + index * 0.02, duration: 0.1 }}
            >
              {char}
            </motion.span>
          ))}
        </p>
      </div>
    </motion.div>
  );
}

function MockTaskColumn({
  title,
  count,
  tasks,
}: {
  title: string;
  count: number;
  tasks: {
    title: string;
    meta: string;
    tone: "indigo" | "emerald" | "amber";
    done?: boolean;
  }[];
}) {
  const toneClasses = {
    indigo: "border-indigo-400/20 bg-indigo-400/10 text-indigo-300",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
      <div className="mb-3 flex justify-between text-xs">
        <span className="font-medium text-gray-300">{title}</span>
        <span className="text-gray-600">{count}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <motion.div
            key={task.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25 }}
            className="rounded-lg border border-white/5 bg-black/20 p-3"
          >
            <div className="flex items-start gap-2">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${toneClasses[task.tone]}`}
              >
                {task.done ? (
                  <CircleCheck className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug text-gray-200">
                  {task.title}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">{task.meta}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TeamCollaboration() {
  const roles = [
    "Owners – full control over workspace settings and billing.",
    "Admins – manage members, channels, and permissions.",
    "Members – collaborate on tasks and docs within assigned channels.",
    "Guests – limited access to specific projects or conversations.",
  ];

  const containerLeft = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const containerRight = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemLeft = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  const itemRight = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          variants={containerLeft}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-6"
        >
          <motion.h2 variants={itemLeft} className="text-3xl font-bold tracking-tight">
            Built for how modern teams actually work
          </motion.h2>
          <motion.p variants={itemLeft} className="text-gray-400 leading-relaxed">
            Developers, designers, founders, and student teams use NexSyncHub to
            ship projects without overhead. Every role has the right level of
            access, and the platform adapts to your workflow, not the other way
            around.
          </motion.p>
          <ul className="space-y-3">
            {roles.map((role) => (
              <motion.li variants={itemLeft} key={role} className="flex items-start gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                {role}
              </motion.li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          variants={containerRight}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="bg-gray-900/80 border border-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-xl"
        >
          <motion.div variants={itemRight} className="flex items-center gap-2 mb-4">
            <Users className="text-indigo-400 w-5 h-5" />
            <span className="font-medium text-sm">Team members</span>
            <span className="text-xs text-gray-500 ml-auto">12 online</span>
          </motion.div>
          <div className="space-y-2">
            {["Alex Chen (Owner)", "Priya Singh (Admin)", "Marcus Lee", "Zara Miller"].map(
              (name) => (
                <motion.div
                  variants={itemRight}
                  key={name}
                  className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                    {name[0]}
                  </div>
                  <span className="text-sm text-gray-200">{name}</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    online
                  </span>
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
