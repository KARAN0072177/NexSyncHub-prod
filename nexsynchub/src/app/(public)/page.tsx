"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 selection:text-white">
      {/* Subtle background grid */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl -z-10" />

      <Navbar />
      <main>
        <Hero />
        <Features />
        <WorkspacePreview />
        <TeamCollaboration />
        <Footer />
      </main>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">NexSyncHub</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">
            Product
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Docs
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Blog
          </a>
          <a
            href="#"
            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
          >
            Sign In
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-bold tracking-tighter leading-tight"
        >
          Real‑time collaboration <br />
          <span className="text-indigo-400">without the chaos.</span>
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

      {/* Realistic product mockup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="relative"
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
        <div className="absolute -bottom-4 -right-4 bg-gray-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-green-400 rounded-full absolute inset-0 animate-ping" />
            </div>
            <span className="text-gray-300">5 members online</span>
          </div>
        </div>
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

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold tracking-tight">
          Collaboration that feels like your code editor
        </h2>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto">
          Every tool you need to build, discuss, and ship – in one minimalist workspace.
        </p>
      </motion.div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.05 }}
            className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <feat.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{feat.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>
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
              <MockChatMessage user="Alex" time="Now" text="Can someone review my pull request? It's ready." />
              <MockChatMessage user="Priya" time="2m ago" text="On it. The tests are passing, nice work." />
              <MockChatMessage user="Alex" time="Now" text="Thanks! Merging after the standup." />
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
}: {
  user: string;
  time: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
        {user[0]}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{user}</span>
          <span className="text-gray-600 text-xs">{time}</span>
        </div>
        <p className="text-gray-300 mt-0.5">{text}</p>
      </div>
    </div>
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

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-6"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Built for how modern teams actually work
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Developers, designers, founders, and student teams use NexSyncHub to
            ship projects without overhead. Every role has the right level of
            access, and the platform adapts to your workflow, not the other way
            around.
          </p>
          <ul className="space-y-3">
            {roles.map((role) => (
              <li key={role} className="flex items-start gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                {role}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="bg-gray-900/80 border border-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-indigo-400 w-5 h-5" />
            <span className="font-medium text-sm">Team members</span>
            <span className="text-xs text-gray-500 ml-auto">12 online</span>
          </div>
          <div className="space-y-2">
            {["Alex Chen (Owner)", "Priya Singh (Admin)", "Marcus Lee", "Zara Miller"].map(
              (name, i) => (
                <div
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
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-6">
          <span>© {new Date().getFullYear()} NexSyncHub</span>
          <a href="#" className="hover:text-gray-300 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors">
            Terms
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-gray-300 transition-colors">
            <BirdIcon className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors">
            <TreesIcon className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors">
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}