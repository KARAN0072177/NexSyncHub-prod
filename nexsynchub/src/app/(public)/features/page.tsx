"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Crown,
  Hash,
  LifeBuoy,
  MessageSquare,
  Shield,
  ShieldAlert,
  Ticket,
  User,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

type Permission = "yes" | "no" | "limited";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
};

const features: Feature[] = [
  {
    icon: Users,
    title: "Workspace system",
    description: "Create project spaces, invite teammates, set roles, and keep team activity organized.",
    points: ["Create a workspace", "Invite members", "Manage roles"],
  },
  {
    icon: Hash,
    title: "Channel system",
    description: "Separate frontend, backend, planning, support, and announcements into focused channels.",
    points: ["Realtime chat", "Unread counters", "File sharing"],
  },
  {
    icon: Ticket,
    title: "Ticket system",
    description: "Users can submit support requests, track replies, and respond when admins need details.",
    points: ["Create tickets", "Reply to admins", "Track status"],
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Important updates appear in the navbar bell and notification history without refreshing.",
    points: ["Live updates", "History page", "Support events"],
  },
  {
    icon: ShieldAlert,
    title: "Moderation",
    description: "Unsafe media from chat, profiles, workspaces, and support attachments is logged for review.",
    points: ["AI scan", "Unsafe media page", "Admin review"],
  },
  {
    icon: LifeBuoy,
    title: "Support operations",
    description: "Admins can follow up, use AI enhancement, resolve cases, and keep a clean support record.",
    points: ["Follow-up email", "AI polish", "Resolved lock"],
  },
];

const roleRows: {
  action: string;
  owner: Permission;
  admin: Permission;
  member: Permission;
}[] = [
  { action: "Manage workspace settings", owner: "yes", admin: "yes", member: "no" },
  { action: "Invite and manage members", owner: "yes", admin: "yes", member: "no" },
  { action: "Promote admins", owner: "yes", admin: "limited", member: "no" },
  { action: "Delete workspace", owner: "yes", admin: "no", member: "no" },
  { action: "Create channels and collaborate", owner: "yes", admin: "yes", member: "limited" },
  { action: "Chat, upload safe files, and reply to tickets", owner: "yes", admin: "yes", member: "yes" },
];

const supportSteps = [
  "User submits a ticket from the support center.",
  "Admin reviews details, attachments, and AI summary.",
  "Admin sends a follow-up or final resolution email.",
  "User sees live updates in tickets, bell notifications, and history.",
];

const moderationSteps = [
  "Media is uploaded from chat, profile, workspace, or support.",
  "The platform scans it for unsafe labels and confidence.",
  "Unsafe media is logged for admin and super admin review.",
  "Super admins can notify the user with approval or rejection reasons.",
];

function PermissionIcon({ value }: { value: Permission }) {
  if (value === "yes") {
    return <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" aria-label="Allowed" />;
  }

  if (value === "limited") {
    return <CheckCircle2 className="mx-auto h-5 w-5 text-amber-400" aria-label="Limited" />;
  }

  return <XCircle className="mx-auto h-5 w-5 text-rose-400" aria-label="Not allowed" />;
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto mb-12 max-w-2xl text-center"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-gray-400">{description}</p>
    </motion.div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-7 transition-all duration-300 hover:border-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 transition-all duration-300 group-hover:bg-indigo-500/20">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-3 text-lg font-bold text-gray-200 transition-colors group-hover:text-white">
          {feature.title}
        </h3>
        <p className="text-sm leading-relaxed text-gray-500 transition-colors group-hover:text-gray-400">
          {feature.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {feature.points.map((point) => (
            <span
              key={point}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-400"
            >
              {point}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function MiniFlow({
  title,
  icon: Icon,
  steps,
}: {
  title: string;
  icon: LucideIcon;
  steps: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-2xl border border-white/10 bg-gray-900/80 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-sm"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">{title}</h3>
      </div>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step} className="flex gap-3 text-sm leading-6 text-gray-400">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-indigo-300">
              {index + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      <div className="fixed left-1/3 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="fixed bottom-0 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-3xl" />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <p className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300">
              NexSyncHub feature guide
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl">
              Everything your workspace needs, without the chaos.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-gray-400">
              NexSyncHub brings workspaces, channels, tickets, roles, support, moderation, and
              notifications into one calm operational system.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-black transition-all hover:bg-gray-100"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/support-center"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-6 py-3 text-white transition-all hover:bg-white/5"
              >
                Visit support
                <LifeBuoy className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="rounded-2xl border border-white/10 bg-gray-900/80 p-4 shadow-2xl shadow-indigo-500/5 backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-600" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-600" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-600" />
              </div>
              <span className="text-xs text-gray-500">workspace overview</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Users, label: "Workspaces", value: "Team spaces" },
                { icon: Hash, label: "Channels", value: "Focused chat" },
                { icon: Ticket, label: "Tickets", value: "Support cases" },
                { icon: Shield, label: "Moderation", value: "Safety review" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <Icon className="mb-5 h-5 w-5 text-indigo-400" />
                  <p className="text-sm font-semibold text-gray-200">{label}</p>
                  <p className="mt-1 text-xs text-gray-500">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm text-gray-400">
              Realtime events connect chat, tickets, notifications, and moderation so teams do not
              need to refresh pages to understand what changed.
            </div>
          </motion.div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <SectionHeading
            eyebrow="Platform features"
            title="A cleaner way to run team operations"
            description="Each feature is simple on the surface, but connected underneath through roles, realtime events, and admin workflows."
          />

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
                }}
              >
                <FeatureCard feature={feature} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeading
            eyebrow="Roles and permissions"
            title="Clear control for owners, admins, and members"
            description="Owners keep final authority, admins manage day-to-day operations, and members collaborate without getting unsafe access."
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="overflow-x-auto rounded-2xl border border-white/10 bg-gray-900/80 shadow-2xl shadow-indigo-500/5 backdrop-blur-sm"
          >
            <div className="grid min-w-[760px] grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] border-b border-white/5 text-sm">
              <div className="p-4 text-gray-500">Capability</div>
              <div className="flex items-center justify-center gap-2 p-4 font-semibold text-gray-200">
                <Crown className="h-4 w-4 text-amber-400" />
                Owner
              </div>
              <div className="flex items-center justify-center gap-2 p-4 font-semibold text-gray-200">
                <UserCog className="h-4 w-4 text-indigo-400" />
                Admin
              </div>
              <div className="flex items-center justify-center gap-2 p-4 font-semibold text-gray-200">
                <User className="h-4 w-4 text-emerald-400" />
                Member
              </div>
            </div>
            {roleRows.map((row) => (
              <div
                key={row.action}
                className="grid min-w-[760px] grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] border-b border-white/5 text-sm last:border-b-0"
              >
                <div className="p-4 text-gray-300">{row.action}</div>
                <div className="p-4 text-center">
                  <PermissionIcon value={row.owner} />
                </div>
                <div className="p-4 text-center">
                  <PermissionIcon value={row.admin} />
                </div>
                <div className="p-4 text-center">
                  <PermissionIcon value={row.member} />
                </div>
              </div>
            ))}
          </motion.div>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Allowed
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-amber-400" /> Limited
            </span>
            <span className="inline-flex items-center gap-1">
              <XCircle className="h-4 w-4 text-rose-400" /> Not allowed
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeading
            eyebrow="Support and moderation"
            title="How important operational flows work"
            description="The page stays simple for users, while admins still get the structure they need behind the scenes."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <MiniFlow title="Support flow" icon={MessageSquare} steps={supportSteps} />
            <MiniFlow title="Moderation flow" icon={ShieldAlert} steps={moderationSteps} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-2xl border border-white/10 bg-gray-900/80 p-8 text-center shadow-2xl shadow-indigo-500/5 backdrop-blur-sm sm:p-10"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white">Ready to use the platform?</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-400">
              Create a workspace, open channels, submit tickets, and keep every update visible in one place.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-black transition-all hover:bg-gray-100"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/support-center"
                className="flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-white transition-all hover:bg-white/5"
              >
                Contact support
                <LifeBuoy className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
