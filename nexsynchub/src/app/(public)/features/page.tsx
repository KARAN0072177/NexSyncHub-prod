"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crown,
  FileImage,
  Hash,
  LifeBuoy,
  LockKeyhole,
  MessageSquare,
  Radio,
  ShieldAlert,
  Sparkles,
  TicketCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

type Permission = "full" | "limited" | "blocked";

type Module = {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  signal: string;
};

type Flow = {
  icon: LucideIcon;
  title: string;
  description: string;
  steps: string[];
  accent: "cyan" | "violet" | "rose";
};

const workspaceModules: Module[] = [
  {
    icon: Users,
    label: "01",
    title: "Workspaces",
    description:
      "The starting point. Every channel, member, file, activity entry, and task belongs to a workspace.",
    signal: "A workspace is the container, not just a name in the sidebar.",
  },
  {
    icon: Hash,
    label: "02",
    title: "Channels",
    description:
      "Use channels for real working areas like frontend, backend, testing, launches, or client discussion.",
    signal: "Unread counts update live so users do not need to refresh.",
  },
  {
    icon: TicketCheck,
    label: "03",
    title: "Tickets",
    description:
      "Support requests become visible cases, not one-off messages. Users can reply when admins ask follow-up questions.",
    signal: "Ticket updates also show in notifications.",
  },
  {
    icon: FileImage,
    label: "04",
    title: "Media Hub",
    description:
      "Uploaded images, videos, PDFs, and files are kept accessible without scrolling through months of chat.",
    signal: "This is where uploaded work stays findable.",
  },
  {
    icon: Activity,
    label: "05",
    title: "Activity Timeline",
    description:
      "Role changes, updates, uploads, and task movement become a readable trail of what happened.",
    signal: "Useful when someone asks: what changed?",
  },
  {
    icon: ShieldAlert,
    label: "06",
    title: "Moderation",
    description:
      "Unsafe media from chat, profile photos, workspace avatars, and support attachments is routed to review.",
    signal: "Review includes evidence, labels, and user notification tools.",
  },
];

const flows: Flow[] = [
  {
    icon: MessageSquare,
    title: "Realtime Workspace Loop",
    description:
      "The basic expectation: if something changes, the person looking at the workspace should see it without guessing.",
    accent: "cyan",
    steps: [
      "A teammate sends a message or uploads safe media.",
      "Channel unread counters update for the right members.",
      "The activity trail keeps important workspace movement visible.",
      "Notification history keeps later follow-up from getting lost.",
    ],
  },
  {
    icon: LifeBuoy,
    title: "Support Case Loop",
    description:
      "Support is treated like a case thread. The user and admin can both add context until the issue is closed.",
    accent: "violet",
    steps: [
      "User submits a ticket with context and optional attachments.",
      "Admins review the request, notes, AI summary, and evidence.",
      "Admins send follow-up questions or a final resolution.",
      "The user sees ticket changes live from the dashboard.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Safety Review Loop",
    description:
      "Moderation is tied to upload surfaces, so risky media does not silently pass through the product.",
    accent: "rose",
    steps: [
      "Media is scanned when uploaded through supported product surfaces.",
      "Unsafe labels, confidence, and evidence are logged.",
      "Super admins review the original media in the unsafe media panel.",
      "Approval or rejection emails can explain the decision clearly.",
    ],
  },
];

const roleRows: {
  capability: string;
  owner: Permission;
  admin: Permission;
  member: Permission;
}[] = [
  {
    capability: "Workspace settings and ownership",
    owner: "full",
    admin: "limited",
    member: "blocked",
  },
  {
    capability: "Invite members and manage access",
    owner: "full",
    admin: "full",
    member: "blocked",
  },
  {
    capability: "Create channels and coordinate work",
    owner: "full",
    admin: "full",
    member: "limited",
  },
  {
    capability: "Chat, reply, upload safe files",
    owner: "full",
    admin: "full",
    member: "full",
  },
  {
    capability: "Review support requests",
    owner: "blocked",
    admin: "full",
    member: "blocked",
  },
  {
    capability: "Review unsafe media",
    owner: "blocked",
    admin: "limited",
    member: "blocked",
  },
];

const auditSignals = [
  "Role changes",
  "Workspace updates",
  "Task movement",
  "Support replies",
  "Unsafe uploads",
  "Notification events",
];

const dayNotes = [
  ["09:12", "A frontend channel gets two unread messages."],
  ["09:18", "A task moves and the Activity Timeline records it."],
  ["10:03", "A user opens a support ticket with an attachment."],
  ["10:04", "Admins receive the support event live."],
  ["10:11", "Unsafe media is caught before becoming normal workspace content."],
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const staggerGroup = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300/80">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
      {children}
    </span>
  );
}

function PermissionMark({ value }: { value: Permission }) {
  if (value === "full") {
    return (
      <span className="inline-flex items-center justify-center text-emerald-300">
        <CheckCircle2 className="h-5 w-5" aria-label="Allowed" />
      </span>
    );
  }

  if (value === "limited") {
    return (
      <span className="inline-flex items-center justify-center text-amber-300">
        <Clock3 className="h-5 w-5" aria-label="Limited" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center text-rose-300">
      <XCircle className="h-5 w-5" aria-label="Blocked" />
    </span>
  );
}

function ModuleRow({ item, index }: { item: Module; index: number }) {
  const Icon = item.icon;

  return (
    <motion.article
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: "easeOut" }}
      className="group grid gap-4 border-b border-white/10 py-6 transition-colors duration-300 last:border-b-0 hover:border-indigo-300/20 md:grid-cols-[84px_1fr_0.9fr]"
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-semibold text-gray-600">{item.label}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300 transition-all duration-300 group-hover:border-indigo-300/40 group-hover:bg-indigo-400/15 group-hover:shadow-[0_0_24px_rgba(129,140,248,0.16)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-white">
          {item.title}
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
          {item.description}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm leading-6 text-gray-400 transition-all duration-300 group-hover:border-white/15 group-hover:bg-white/[0.04]">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">
          Product signal
        </span>
        {item.signal}
      </div>
    </motion.article>
  );
}

function FlowPanel({ flow, index }: { flow: Flow; index: number }) {
  const Icon = flow.icon;
  const accent =
    flow.accent === "rose"
      ? "border-rose-400/20 bg-rose-400/5 text-rose-200"
      : flow.accent === "cyan"
        ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-200"
        : "border-indigo-400/20 bg-indigo-400/5 text-indigo-200";

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950/70 p-6 transition-colors duration-300 hover:border-indigo-300/20"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" />
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-white">
        {flow.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-gray-400">{flow.description}</p>

      <div className="mt-7 space-y-4">
        {flow.steps.map((step, stepIndex) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.06 + stepIndex * 0.04, duration: 0.35 }}
            className="grid grid-cols-[32px_1fr] gap-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold text-gray-400">
              {stepIndex + 1}
            </span>
            <p className="pt-1 text-sm leading-6 text-gray-300">{step}</p>
          </motion.div>
        ))}
      </div>
    </motion.article>
  );
}

export default function FeaturesPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      <div className="fixed left-1/3 top-0 -z-10 h-[480px] w-[480px] rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="fixed bottom-0 right-1/4 -z-10 h-[420px] w-[420px] rounded-full bg-blue-500/5 blur-3xl" />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="space-y-6"
          >
            <Eyebrow>Features</Eyebrow>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tighter sm:text-5xl lg:text-6xl">
              A closer look at what NexSyncHub actually does.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-gray-400">
              This is not a long feature checklist. It is the working map of the product:
              workspaces, channels, tickets, Media Hub, Activity Timeline, Role Management,
              notifications, and moderation.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-100"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/support-center"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
              >
                Support center
                <LifeBuoy className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 220, damping: 24 }}
            className="relative rounded-2xl border border-white/10 bg-gray-950/80 p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <motion.span
                  animate={shouldReduceMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="h-2.5 w-2.5 rounded-full bg-emerald-400/80"
                />
              </div>
              <span className="text-xs text-gray-500">workspace view</span>
            </div>

            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="space-y-2 border-white/10 md:border-r md:pr-4">
                {["# general", "# frontend", "# backend", "# support"].map((channel, index) => (
                  <div
                    key={channel}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                      index === 0
                        ? "border border-indigo-400/20 bg-indigo-400/10 text-white"
                        : "text-gray-500"
                    }`}
                  >
                    <span>{channel}</span>
                    {index === 1 ? (
                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                        2
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      What changed
                    </span>
                    <motion.span
                      animate={shouldReduceMotion ? undefined : { scale: [1, 1.14, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Radio className="h-4 w-4 text-emerald-300" />
                    </motion.span>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Ticket updated", "Admin asked for more details"],
                      ["Media Hub", "3 files added to frontend"],
                      ["Role changed", "A member became workspace admin"],
                    ].map(([title, detail]) => (
                      <div key={title} className="grid grid-cols-[8px_1fr] gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-indigo-300" />
                        <div>
                          <p className="font-medium text-gray-200">{title}</p>
                          <p className="text-gray-500">{detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  {[
                    ["Live", "updates"],
                    ["Role", "aware"],
                    ["Safety", "logged"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-black/25 px-3 py-4">
                      <p className="font-semibold text-white">{label}</p>
                      <p className="mt-1 text-gray-500">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-10 max-w-3xl"
          >
            <Eyebrow>Product surfaces</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              The pieces are separate in the UI, but connected in the workflow.
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-400">
              The point is not to add more screens. The point is that when something happens
              in one place, the rest of the workspace can react to it.
            </p>
          </motion.div>

          <motion.div
            variants={staggerGroup}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-2xl border border-white/10 bg-gray-950/60 px-5 sm:px-7"
          >
            {workspaceModules.map((item, index) => (
              <ModuleRow key={item.title} item={item} index={index} />
            ))}
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>How it moves</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                The product is built around small events, not static pages.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-gray-500">
              A message, upload, ticket reply, role change, or moderation event should not
              stay isolated. It should become part of the workspace state.
            </p>
          </div>

          <motion.div
            variants={staggerGroup}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-5 lg:grid-cols-3"
          >
            {flows.map((flow, index) => (
              <FlowPanel key={flow.title} flow={flow} index={index} />
            ))}
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-8 rounded-2xl border border-white/10 bg-gray-950/70 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <div>
              <Eyebrow>A normal morning</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Less presentation. More product behavior.
              </h2>
              <p className="mt-4 text-sm leading-6 text-gray-400">
                This is the kind of sequence NexSyncHub is built for. Not a flashy demo,
                just the daily movement of work across a real workspace.
              </p>
            </div>
            <div className="space-y-3">
              {dayNotes.map(([time, note], index) => (
                <motion.div
                  key={note}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className="grid grid-cols-[64px_1fr] gap-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-xs text-indigo-300">{time}</span>
                  <span className="text-gray-300">{note}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <Eyebrow>Role Management</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Clear permissions without turning the workspace into a maze.
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-400">
              Owners hold the keys, admins handle operations, and members get enough access
              to collaborate without touching controls they should not own.
            </p>

            <div className="mt-8 grid gap-3 text-sm text-gray-400">
            {[
                [Crown, "Owner", "Final authority over workspace control."],
                [UserCog, "Admin", "Manages day-to-day team operations."],
                [Users, "Member", "Collaborates inside approved surfaces."],
              ].map(([Icon, title, detail]) => {
                const RoleIcon = Icon as LucideIcon;

                return (
                  <motion.div
                    key={title as string}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.42, ease: "easeOut" }}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition-all duration-300 hover:border-indigo-300/20 hover:bg-white/[0.04]"
                  >
                    <RoleIcon className="mt-0.5 h-5 w-5 text-indigo-300" />
                    <div>
                      <p className="font-semibold text-white">{title as string}</p>
                      <p className="mt-1">{detail as string}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-gray-950/70"
          >
            <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr] border-b border-white/10 bg-white/[0.025] text-sm">
              <div className="p-4 text-gray-500">Capability</div>
              <div className="p-4 text-center font-semibold text-white">Owner</div>
              <div className="p-4 text-center font-semibold text-white">Admin</div>
              <div className="p-4 text-center font-semibold text-white">Member</div>
            </div>
            {roleRows.map((row) => (
              <motion.div
                key={row.capability}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr] border-b border-white/10 text-sm last:border-b-0"
              >
                <div className="p-4 text-gray-300">{row.capability}</div>
                <div className="p-4 text-center">
                  <PermissionMark value={row.owner} />
                </div>
                <div className="p-4 text-center">
                  <PermissionMark value={row.admin} />
                </div>
                <div className="p-4 text-center">
                  <PermissionMark value={row.member} />
                </div>
              </motion.div>
            ))}
            <div className="flex flex-wrap gap-4 border-t border-white/10 px-4 py-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Full
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-amber-300" /> Limited
              </span>
              <span className="inline-flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-300" /> Blocked
              </span>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-2xl border border-white/10 bg-gray-950/70 p-6 sm:p-8"
          >
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <Eyebrow>Activity Timeline</Eyebrow>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  The app should remember the boring details.
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-400">
                  Role changes, uploads, task movement, support replies, and moderation events
                  are exactly the details teams forget later. NexSyncHub keeps them close to
                  the workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {auditSignals.map((signal) => (
                  <motion.div
                    key={signal}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-gray-300"
                  >
                    <LockKeyhole className="h-4 w-4 text-indigo-300" />
                    {signal}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.08] p-8 sm:p-10"
          >
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-300/10 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Less switching, more continuity
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Start with a workspace. The rest should stay connected.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/65">
                  Create channels, invite members, manage roles, track activity, submit tickets,
                  review media, and keep notifications flowing from the same product.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-100"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
