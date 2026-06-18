"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CreditCard,
  Gauge,
  Layers,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

type PlanKey = "free" | "pro" | "business";

type Plan = {
  key: PlanKey;
  name: string;
  label: string;
  audience: string;
  credits: string;
  burst: string;
  cta: string;
  href: string;
  accent: "slate" | "blue" | "emerald";
  highlights: string[];
};

type ComparisonRow = {
  capability: string;
  free: ReactNode;
  pro: ReactNode;
  business: ReactNode;
};

type Guide = {
  icon: LucideIcon;
  title: string;
  plan: string;
  body: string;
};

const plans: Plan[] = [
  {
    key: "free",
    name: "Free",
    label: "Start without a card",
    audience: "For trying NexSyncHub with one small workspace.",
    credits: "50 AI credits / month",
    burst: "10 credits / 5 hours",
    cta: "Start free",
    href: "/register",
    accent: "slate",
    highlights: [
      "Chat, tasks, Media Hub, Activity Timeline",
      "Owner, admin, and member roles",
      "Enough AI usage to test the workflow",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    label: "Most teams start here",
    audience: "For active teams using AI during normal project work.",
    credits: "1,000 AI credits / month",
    burst: "150 credits / 5 hours",
    cta: "Choose Pro",
    href: "/dashboard/pricing",
    accent: "blue",
    highlights: [
      "Higher workspace AI limits",
      "Better fit for repeated task enhancement",
      "Workspace-owned billing and usage visibility",
    ],
  },
  {
    key: "business",
    name: "Business",
    label: "For heavier operations",
    audience: "For larger workspaces with frequent AI-assisted work.",
    credits: "5,000 AI credits / month",
    burst: "700 credits / 5 hours",
    cta: "Choose Business",
    href: "/dashboard/pricing",
    accent: "emerald",
    highlights: [
      "Expanded AI capacity for busy teams",
      "More room for future intelligence workflows",
      "Designed for operational workspaces",
    ],
  },
];

const comparisonRows: ComparisonRow[] = [
  {
    capability: "Workspace chat, tasks, files, and activity",
    free: "Included",
    pro: "Included",
    business: "Included",
  },
  {
    capability: "Role Management",
    free: "Owner, admin, member",
    pro: "Owner, admin, member",
    business: "Owner, admin, member",
  },
  {
    capability: "Monthly workspace AI credits",
    free: "50",
    pro: "1,000",
    business: "5,000",
  },
  {
    capability: "5-hour burst protection",
    free: "10 credits",
    pro: "150 credits",
    business: "700 credits",
  },
  {
    capability: "Best fit",
    free: "Testing and small teams",
    pro: "Active project teams",
    business: "Heavy team operations",
  },
  {
    capability: "Stripe billing portal",
    free: <No />,
    pro: <Yes />,
    business: <Yes />,
  },
  {
    capability: "Future workspace intelligence capacity",
    free: "Limited",
    pro: "Higher",
    business: "Highest",
  },
];

const guides: Guide[] = [
  {
    icon: Sparkles,
    title: "Choose Free when you are validating the product.",
    plan: "Free",
    body:
      "Use it when you want to create a workspace, invite a small team, test chat/tasks/media, and see whether the AI workflow is useful.",
  },
  {
    icon: Users,
    title: "Choose Pro when the workspace is part of real work.",
    plan: "Pro",
    body:
      "Use it when multiple people depend on the workspace and AI is used regularly for task descriptions and daily project cleanup.",
  },
  {
    icon: Activity,
    title: "Choose Business when AI usage becomes operational.",
    plan: "Business",
    body:
      "Use it when the workspace has heavier activity and you want room for upcoming intelligence features like summaries, digests, and reports.",
  },
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

function Yes() {
  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-300">
      <CheckCircle2 className="h-4 w-4" />
      Yes
    </span>
  );
}

function No() {
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-500">
      <XCircle className="h-4 w-4" />
      No
    </span>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const isPro = plan.key === "pro";
  const accent =
    plan.accent === "emerald"
      ? "rgba(16,185,129,0.34)"
      : plan.accent === "blue"
        ? "rgba(99,102,241,0.38)"
        : "rgba(148,163,184,0.18)";

  return (
    <motion.article
      variants={fadeUp}
      transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      className="relative flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] p-6 transition-colors duration-300 hover:border-indigo-300/25 hover:bg-white/[0.04]"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl"
        style={{ background: accent }}
      />

      {isPro && (
        <div className="absolute right-4 top-4 rounded-full border border-indigo-300/25 bg-indigo-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">
          Practical pick
        </div>
      )}

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
          {plan.label}
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
          {plan.name}
        </h2>
        <p className="mt-3 min-h-[48px] text-sm leading-6 text-gray-400">
          {plan.audience}
        </p>
      </div>

      <div className="relative mt-6 rounded-lg border border-white/10 bg-black/25 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <BrainCircuit className="h-4 w-4 text-indigo-300" />
          {plan.credits}
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <Gauge className="h-3.5 w-3.5 text-emerald-300" />
          {plan.burst}
        </p>
      </div>

      <ul className="relative mt-6 space-y-3">
        {plan.highlights.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-gray-300">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.href}
        className={`relative mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
          isPro
            ? "bg-white text-black hover:bg-gray-100"
            : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
        }`}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.article>
  );
}

function GuideCard({ item, index }: { item: Guide; index: number }) {
  const Icon = item.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
      className="rounded-lg border border-white/10 bg-white/[0.025] p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
          {item.plan}
        </span>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-white">
        {item.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-gray-400">{item.body}</p>
    </motion.article>
  );
}

export default function PricingPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      <div className="fixed inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.13),transparent_64%)]" />
      <div className="fixed inset-x-0 bottom-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.08),transparent_62%)]" />

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <Eyebrow>Pricing</Eyebrow>
            <h1 className="mt-6 text-4xl font-bold tracking-tighter text-white sm:text-6xl">
              Pay for the workspace that actually uses AI.
            </h1>
            <p className="mt-6 text-base leading-8 text-gray-400 sm:text-lg">
              NexSyncHub plans are built around collaborative workspaces, not
              individual seats. Free is for validation. Pro and Business unlock
              more AI capacity for teams that use NexSyncHub as an operating
              workspace.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: shouldReduceMotion ? 0 : 0.08,
                  delayChildren: 0.12,
                },
              },
            }}
            className="mt-12 grid gap-5 lg:grid-cols-3"
          >
            {plans.map((plan, index) => (
              <PlanCard key={plan.key} plan={plan} index={index} />
            ))}
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 max-w-2xl">
            <Eyebrow>Comparison</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              What changes when you upgrade?
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              The core workspace stays accessible. Paid plans mainly increase
              AI capacity and make heavier operational workflows realistic.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-5 py-4 font-semibold text-gray-300">
                      Capability
                    </th>
                    <th className="px-5 py-4 font-semibold text-white">Free</th>
                    <th className="px-5 py-4 font-semibold text-indigo-200">Pro</th>
                    <th className="px-5 py-4 font-semibold text-emerald-200">
                      Business
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.capability} className="border-b border-white/[0.06] last:border-b-0">
                      <td className="px-5 py-4 font-medium text-white">
                        {row.capability}
                      </td>
                      <td className="px-5 py-4 text-gray-400">{row.free}</td>
                      <td className="px-5 py-4 text-gray-300">{row.pro}</td>
                      <td className="px-5 py-4 text-gray-300">{row.business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 max-w-2xl">
            <Eyebrow>Plan guidance</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Which plan should your workspace use?
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              Choose based on how central NexSyncHub is to your team, not on
              vanity size. A small team doing serious work may need Pro before a
              large team that is only testing.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {guides.map((item, index) => (
              <GuideCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-6"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Why AI is limited by plan
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-400">
                AI calls cost real infrastructure money. Workspace quotas keep
                the free tier sustainable while giving paid workspaces a clear,
                predictable pool of AI capacity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.06 }}
              className="rounded-xl border border-indigo-300/15 bg-indigo-400/[0.045] p-6"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Layers, label: "Workspace-owned", text: "Billing follows the team space, not one person." },
                  { icon: LockKeyhole, label: "Quota protected", text: "Monthly and burst limits prevent abuse." },
                  { icon: CreditCard, label: "Stripe handled", text: "Paid checkout and billing portal run through Stripe." },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <item.icon className="h-5 w-5 text-indigo-300" />
                    <p className="mt-4 text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-12">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-8 text-center">
            <Zap className="mx-auto h-6 w-6 text-indigo-300" />
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              Start free, upgrade when the workspace needs more AI.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-400">
              No team should pay before they understand the product. Use Free to
              validate the workspace, then move to Pro or Business when AI
              becomes part of the team workflow.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
              >
                Create free workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                Review features
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
