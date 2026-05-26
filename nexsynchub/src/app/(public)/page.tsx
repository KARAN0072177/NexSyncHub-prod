"use client";

import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  MessageSquare,
  CheckSquare,
  Bell,
  Users,
  Activity,
  Layers,
  GitBranch,
  Shield,
  Zap,
  ArrowRight,
  Mail,
  ChevronRight,
  Play,
  FileText,
  CalendarDays,
  Hash,
  TreesIcon,
  BirdIcon,
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
                <p className="text-gray-300">Nice, I'll review after lunch. The Kanban board is synced.</p>
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
            <div className="grid grid-cols-3 gap-3">
              <MockTaskColumn title="To Do" count={4} />
              <MockTaskColumn title="In Progress" count={2} />
              <MockTaskColumn title="Done" count={5} />
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
            <div className="text-gray-400 text-sm">Calendar integration view (coming soon)</div>
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

function MockTaskColumn({ title, count }: { title: string; count: number }) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="flex justify-between text-xs mb-2">
        <span className="font-medium text-gray-300">{title}</span>
        <span className="text-gray-600">{count}</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 bg-white/10 rounded-full w-3/4" />
        <div className="h-1.5 bg-white/10 rounded-full w-1/2" />
        <div className="h-1.5 bg-white/10 rounded-full w-2/3" />
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
              (name, i) => (
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