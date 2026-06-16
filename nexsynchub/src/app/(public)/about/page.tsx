"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Bell,
  CircleCheck,
  FileImage,
  GitBranch,
  Hash,
  Layers,
  LifeBuoy,
  LockKeyhole,
  MessageSquare,
  PanelTop,
  ShieldAlert,
  TicketCheck,
  Users,
} from "lucide-react";

type Principle = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type TimelineItem = {
  label: string;
  title: string;
  body: string;
};

const principles: Principle[] = [
  {
    icon: Layers,
    title: "The workspace should not be a dumping ground.",
    body:
      "Chat is useful, but work also needs tasks, media, tickets, permissions, and activity history. NexSyncHub is built around the whole workspace, not just the message box.",
  },
  {
    icon: Activity,
    title: "Small changes should not disappear.",
    body:
      "Teams should not need to ask who changed something, where a file went, or whether a ticket moved forward. Those details belong near the work.",
  },
  {
    icon: ShieldAlert,
    title: "Safety should happen where uploads happen.",
    body:
      "Uploads, support attachments, workspace images, and profile media can all affect trust. Moderation needs to be connected to the actual upload surfaces.",
  },
];

const timeline: TimelineItem[] = [
  {
    label: "Problem",
    title: "The same project keeps getting split into pieces.",
    body:
      "Chat lives in one tab, tasks in another, files somewhere else, and support conversations drift into email. The result is not dramatic. It is just slow, annoying context loss.",
  },
  {
    label: "Direction",
    title: "NexSyncHub tries to keep the pieces close together.",
    body:
      "Channels, tickets, Media Hub, Role Management, notifications, and Activity Timeline are designed to live around the workspace instead of floating as separate tools.",
  },
  {
    label: "Next",
    title: "The intelligence layer comes after the foundation.",
    body:
      "The long-term goal is useful workspace insight: digests, summaries, and clearer signals. But that only works if the underlying events, permissions, tickets, and files are clean first.",
  },
];

const surfaces = [
  { icon: MessageSquare, label: "Chat", detail: "Realtime channel conversation" },
  { icon: Hash, label: "Channels", detail: "Focused workspace rooms" },
  { icon: TicketCheck, label: "Tickets", detail: "Tracked support cases" },
  { icon: FileImage, label: "Media Hub", detail: "Workspace files and uploads" },
  { icon: Users, label: "Roles", detail: "Owner, admin, member control" },
  { icon: Bell, label: "Notifications", detail: "Live updates and history" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300/80">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
      {children}
    </span>
  );
}

function PrincipleCard({ item, index }: { item: Principle; index: number }) {
  const Icon = item.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group rounded-lg border border-white/10 bg-white/[0.025] p-6 transition-colors duration-300 hover:border-indigo-300/20 hover:bg-white/[0.04]"
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-400/10 text-indigo-300 transition-all duration-300 group-hover:border-indigo-300/40 group-hover:shadow-[0_0_24px_rgba(129,140,248,0.16)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-white">
        {item.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-gray-400">{item.body}</p>
    </motion.article>
  );
}

export default function AboutPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      <div className="fixed inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_65%)]" />
      <div className="fixed inset-x-0 bottom-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.08),transparent_60%)]" />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="space-y-6"
          >
            <Eyebrow>About</Eyebrow>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tighter sm:text-5xl lg:text-6xl">
              NexSyncHub is for the work that gets lost between tools.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-gray-400">
              The idea is simple: a workspace should not forget what happened in it.
              Messages, files, tickets, role changes, activity, and moderation decisions
              should feel like parts of the same place.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/features"
                className="group inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-100"
              >
                See product map
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/support-center"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
              >
                Contact support
                <LifeBuoy className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 220, damping: 24 }}
            className="rounded-lg border border-white/10 bg-gray-950/80 p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <PanelTop className="h-4 w-4 text-indigo-300" />
                <span className="text-sm font-semibold text-white">Workspace memory</span>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                connected
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {surfaces.map(({ icon: Icon, label, detail }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.04, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                  className="rounded-lg border border-white/10 bg-white/[0.025] p-4 transition-colors duration-300 hover:border-indigo-300/20 hover:bg-white/[0.04]"
                >
                  <Icon className="mb-4 h-5 w-5 text-indigo-300" />
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{detail}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              animate={shouldReduceMotion ? undefined : { borderColor: ["rgba(255,255,255,0.1)", "rgba(129,140,248,0.22)", "rgba(255,255,255,0.1)"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mt-4 rounded-lg border border-white/10 bg-black/25 p-4"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <GitBranch className="h-4 w-4 text-cyan-300" />
                Product note
              </div>
              <p className="text-sm leading-6 text-gray-400">
                This is not trying to be another chat clone with a nicer sidebar. The point
                is to make the surrounding work easier to follow: files, tickets, roles,
                activity, safety, and notifications.
              </p>
            </motion.div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.035] p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
                What it is
              </p>
              <ul className="space-y-3 text-sm leading-6 text-gray-300">
                <li>A workspace system with chat, channels, roles, tickets, media, and activity.</li>
                <li>A place where support and moderation are part of the product, not afterthoughts.</li>
                <li>A foundation for future workspace intelligence that uses real operational events.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-rose-400/15 bg-rose-400/[0.025] p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/80">
                What it is not
              </p>
              <ul className="space-y-3 text-sm leading-6 text-gray-400">
                <li>Not a generic company intranet page with a chat box attached.</li>
                <li>Not a fake AI dashboard promising magic summaries before the workflow exists.</li>
                <li>Not a replacement for discipline; it is meant to make discipline easier to maintain.</li>
              </ul>
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
            <Eyebrow>Why it exists</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              The problem is not that teams refuse to collaborate.
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-400">
              Most teams already have plenty of tools. The pain starts when every tool owns
              a tiny piece of the truth, and nobody can quickly answer what changed, who owns
              it, or where the important context lives.
            </p>
          </motion.div>

          <div className="rounded-lg border border-white/10 bg-gray-950/60 p-5 sm:p-7">
            {timeline.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
                className="group grid gap-4 border-b border-white/10 py-6 transition-colors duration-300 last:border-b-0 hover:border-indigo-300/20 md:grid-cols-[140px_1fr]"
              >
                <div>
                  <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200 transition-all duration-300 group-hover:border-indigo-300/40 group-hover:bg-indigo-400/15">
                    {item.label}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{item.body}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>Product principles</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                A few decisions keep the product from becoming noise.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-gray-500">
              The goal is not to add every feature possible. The goal is to make the
              workspace less scattered every time a new system is added.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {principles.map((item, index) => (
              <PrincipleCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <Eyebrow>What makes it different</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              The useful part is what happens around the message.
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-400">
              Chat alone cannot explain the state of a workspace. NexSyncHub connects
              conversation to the surrounding systems teams need to actually manage work.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-3"
          >
            {[
              ["From chat to workspace", "Channels are tied to workspace membership, unread counts, and shared context."],
              ["From uploads to Media Hub", "Files become part of the workspace instead of disappearing inside old messages."],
              ["From support form to case thread", "Tickets carry admin replies, user replies, status changes, and notifications."],
              ["From safety check to review workflow", "Unsafe media is logged with labels, evidence, and admin decision tools."],
            ].map(([title, body]) => (
              <motion.div
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.38, ease: "easeOut" }}
                whileHover={{ x: 3 }}
                className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-[32px_1fr]"
              >
                <CircleCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-400">{body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-lg border border-white/10 bg-gray-950/70 p-6 sm:p-8"
          >
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <Eyebrow>Built with restraint</Eyebrow>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Intelligence is only useful when the basics are clean.
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-400">
                  NexSyncHub is being prepared for workspace intelligence: digests,
                  summaries, and operational insights. But the foundation comes first:
                  clean data, clear events, strong permissions, and reliable workflows.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [LockKeyhole, "Permission-aware"],
                  [Activity, "Activity-first"],
                  [ShieldAlert, "Moderation-ready"],
                  [TicketCheck, "Support-connected"],
                ].map(([Icon, label]) => {
                  const ItemIcon = Icon as LucideIcon;

                  return (
                    <motion.div
                      key={label as string}
                      initial={{ opacity: 0, scale: 0.96 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-sm text-gray-300"
                    >
                      <ItemIcon className="h-4 w-4 text-indigo-300" />
                      {label as string}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative overflow-hidden rounded-lg border border-indigo-400/20 bg-indigo-500/[0.08] p-8 sm:p-10"
          >
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Eyebrow>Next step</Eyebrow>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
                  See the product surfaces behind the idea.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/65">
                  The features page shows how workspaces, channels, tickets, Media Hub,
                  roles, moderation, notifications, and activity connect.
                </p>
              </div>
              <Link
                href="/features"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-100"
              >
                View features
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
