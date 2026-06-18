"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  MailCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

type WorkspacePlanKey =
  | "free"
  | "pro"
  | "business";

type BillingWorkspace = {
  _id: string;
  name: string;
  avatar?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  canManageBilling: boolean;
  canViewReceipts: boolean;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string | null;
  plan: {
    key: WorkspacePlanKey;
    name: string;
    description: string;
    monthlyCredits: number;
    burstCreditsPer5Hours: number;
  };
  usage: {
    monthlyCredits: number;
    monthlyUsed: number;
    monthlyRemaining: number;
    burstCreditsPer5Hours: number;
    burstUsed: number;
    burstRemaining: number;
    periodEnd: string;
  };
  billingHistory: BillingHistoryItem[];
};

type BillingHistoryItem = {
  _id: string;
  plan: WorkspacePlanKey;
  planName: string;
  billingReason: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  paymentStatus: string;
  invoiceStatus: string;
  invoiceNumber: string;
  invoicePdfUrl: string;
  hostedInvoiceUrl: string;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  receiptEmailSentAt: string | null;
};

const T = {
  bg: "#03060F",
  surface: "rgba(8,14,32,0.86)",
  panel: "rgba(12,20,44,0.72)",
  border: "rgba(61,123,255,0.14)",
  borderHi: "rgba(61,123,255,0.34)",
  blue: "#3D7BFF",
  violet: "#7C3AED",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  text: "#E2E8F8",
  muted: "#8393B7",
};

const paidPlans: Array<{
  key: Exclude<WorkspacePlanKey, "free">;
  name: string;
  credits: string;
  description: string;
}> = [
  {
    key: "pro",
    name: "Pro",
    credits: "1,000 AI credits / month",
    description:
      "For active teams using AI inside everyday workspace tasks.",
  },
  {
    key: "business",
    name: "Business",
    credits: "5,000 AI credits / month",
    description:
      "For larger workspaces with heavier AI-assisted operations.",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "Current cycle";

  return new Date(value).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatCurrency(
  amountInMinorUnits: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency:
          currency.toUpperCase(),
      }
    ).format(
      amountInMinorUnits / 100
    );
  } catch {
    return `${(
      amountInMinorUnits / 100
    ).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatBillingReason(
  reason: string
) {
  const labels: Record<
    string,
    string
  > = {
    subscription_create:
      "New subscription",
    subscription_cycle:
      "Renewal",
    subscription_update:
      "Plan update",
    manual:
      "Manual invoice",
  };

  return (
    labels[reason] ||
    reason
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      ) ||
    "Payment"
  );
}

function getUsagePercent(
  used: number,
  total: number
) {
  if (!total) return 0;

  return Math.min(
    Math.round((used / total) * 100),
    100
  );
}

function WorkspaceAvatar({
  workspace,
}: {
  workspace: BillingWorkspace;
}) {
  const initials =
    workspace.name
      .slice(0, 2)
      .toUpperCase() || "WS";

  if (workspace.avatar) {
    return (
      <div
        aria-hidden
        className="h-12 w-12 rounded-2xl bg-cover bg-center"
        style={{
          backgroundImage:
            `url("${workspace.avatar}")`,
        }}
      />
    );
  }

  return (
    <div
      className="h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black"
      style={{
        background:
          "linear-gradient(135deg, rgba(61,123,255,0.22), rgba(124,58,237,0.16))",
        color: T.text,
        border: `1px solid ${T.borderHi}`,
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const isHealthy =
    status === "active" ||
    status === "trialing" ||
    status === "free";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
      style={{
        color: isHealthy ? T.emerald : T.amber,
        background: isHealthy
          ? "rgba(16,185,129,0.10)"
          : "rgba(245,158,11,0.10)",
        border: `1px solid ${
          isHealthy
            ? "rgba(16,185,129,0.24)"
            : "rgba(245,158,11,0.24)"
        }`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: isHealthy
            ? T.emerald
            : T.amber,
        }}
      />
      {status.replace("_", " ")}
    </span>
  );
}

function BillingHistoryPanel({
  workspace,
}: {
  workspace: BillingWorkspace;
}) {
  const history =
    workspace.billingHistory || [];

  return (
    <div
      className="border-t px-5 py-5 lg:px-6"
      style={{
        borderColor: T.border,
        background:
          "linear-gradient(180deg, rgba(3,6,15,0.12), rgba(3,6,15,0.34))",
      }}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{
              background:
                "rgba(61,123,255,0.10)",
              border: `1px solid ${T.borderHi}`,
              color: T.blue,
            }}
          >
            <FileText size={16} />
          </div>
          <div>
            <p className="text-sm font-black text-white">
              Purchase history
            </p>
            <p
              className="text-xs"
              style={{
                color: T.muted,
              }}
            >
              Stripe-confirmed payments and receipts for this workspace.
            </p>
          </div>
        </div>

        {!workspace.canViewReceipts && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{
              color: T.muted,
              border: `1px solid ${T.border}`,
              background:
                "rgba(255,255,255,0.035)",
            }}
          >
            <Lock size={12} />
            links hidden
          </span>
        )}
      </div>

      {history.length === 0 ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            background:
              "rgba(255,255,255,0.035)",
            border: `1px solid ${T.border}`,
            color: T.muted,
          }}
        >
          No completed payments recorded yet. Once Stripe confirms a paid
          invoice, the receipt appears here automatically.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const canOpenReceipt =
              workspace.canViewReceipts &&
              (item.invoicePdfUrl ||
                item.hostedInvoiceUrl);

            return (
              <div
                key={item._id}
                className="flex flex-col gap-4 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between"
                style={{
                  background:
                    "rgba(255,255,255,0.035)",
                  border: `1px solid ${T.border}`,
                }}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        color: T.emerald,
                        background:
                          "rgba(16,185,129,0.10)",
                        border:
                          "1px solid rgba(16,185,129,0.24)",
                      }}
                    >
                      {item.paymentStatus}
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{
                        color: T.muted,
                      }}
                    >
                      {formatBillingReason(
                        item.billingReason
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-white">
                    {item.planName} plan
                    {" - "}
                    {formatCurrency(
                      item.amountPaid,
                      item.currency
                    )}
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{
                      color: T.muted,
                    }}
                  >
                    {formatDate(item.paidAt)}
                    {item.invoiceNumber
                      ? ` - Invoice ${item.invoiceNumber}`
                      : ""}
                    {item.receiptEmailSentAt
                      ? " - receipt emailed"
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.receiptEmailSentAt && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                      style={{
                        color: T.emerald,
                        background:
                          "rgba(16,185,129,0.10)",
                        border:
                          "1px solid rgba(16,185,129,0.20)",
                      }}
                    >
                      <MailCheck size={14} />
                      Emailed
                    </span>
                  )}

                  {workspace.canViewReceipts &&
                    item.invoicePdfUrl && (
                      <a
                        href={item.invoicePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                        style={{
                          color: "#FFFFFF",
                          background:
                            "linear-gradient(135deg, #3D7BFF, #7C3AED)",
                        }}
                      >
                        <Download size={14} />
                        Download
                      </a>
                    )}

                  {workspace.canViewReceipts &&
                    item.hostedInvoiceUrl && (
                      <a
                        href={item.hostedInvoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                        style={{
                          color: T.text,
                          background:
                            "rgba(255,255,255,0.05)",
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        <ExternalLink size={14} />
                        View
                      </a>
                    )}

                  {!canOpenReceipt && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                      style={{
                        color: T.muted,
                        background:
                          "rgba(255,255,255,0.035)",
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <Lock size={14} />
                      Receipt restricted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BillingContent() {
  const searchParams =
    useSearchParams();
  const [workspaces, setWorkspaces] =
    useState<BillingWorkspace[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [actionKey, setActionKey] =
    useState("");

  const billingMessage =
    useMemo(() => {
      const status =
        searchParams.get("billing");

      if (status === "success") {
        return {
          tone: "success" as const,
          message:
            "Stripe checkout completed. Your workspace plan will sync automatically.",
        };
      }

      if (status === "cancelled") {
        return {
          tone: "warning" as const,
          message:
            "Checkout was cancelled. No billing changes were made.",
        };
      }

      return null;
    }, [searchParams]);

  const fetchWorkspaces = async () => {
    setLoading(true);
    setError("");

    try {
      const res =
        await fetch(
          "/api/billing/workspaces"
        );
      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to load billing data."
        );
      }

      setWorkspaces(
        data.workspaces || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load billing data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const startCheckout =
    async (
      workspaceId: string,
      plan: "pro" | "business"
    ) => {
      const key =
        `${workspaceId}:${plan}`;
      setActionKey(key);
      setError("");

      try {
        const res =
          await fetch(
            "/api/billing/checkout",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                workspaceId,
                plan,
              }),
            }
          );
        const data =
          await res.json();

        if (!res.ok || !data.url) {
          throw new Error(
            data.error ||
              "Failed to start checkout."
          );
        }

        window.location.href =
          data.url;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to start checkout."
        );
        setActionKey("");
      }
    };

  const openPortal =
    async (workspaceId: string) => {
      const key =
        `${workspaceId}:portal`;
      setActionKey(key);
      setError("");

      try {
        const res =
          await fetch(
            "/api/billing/portal",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                workspaceId,
              }),
            }
          );
        const data =
          await res.json();

        if (!res.ok || !data.url) {
          throw new Error(
            data.error ||
              "Failed to open billing portal."
          );
        }

        window.location.href =
          data.url;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to open billing portal."
        );
        setActionKey("");
      }
    };

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(61,123,255,0.12), transparent 34%), radial-gradient(circle at top right, rgba(16,185,129,0.08), transparent 28%), #03060F",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow:
              "0 24px 70px rgba(0,0,0,0.34)",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(61,123,255,0.8), rgba(16,185,129,0.5), transparent)",
            }}
          />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: T.blue,
                  background:
                    "rgba(61,123,255,0.10)",
                  border: `1px solid ${T.borderHi}`,
                }}
              >
                <Sparkles size={13} />
                Workspace AI billing
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                AI credits belong to the workspace.
              </h1>

              <p
                className="mt-4 max-w-2xl text-sm leading-7 sm:text-base"
                style={{
                  color: T.muted,
                }}
              >
                Upgrade the workspaces that actually use AI. Admin,
                support, and moderation AI stay platform-owned so customer
                quotas remain clean.
              </p>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                background:
                  "rgba(3,6,15,0.58)",
                border: `1px solid ${T.border}`,
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{
                  color: T.muted,
                }}
              >
                Quota model
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Zap
                  size={16}
                  color={T.emerald}
                />
                Monthly credits + 5-hour burst guard
              </p>
            </div>
          </div>
        </motion.section>

        {billingMessage && (
          <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{
              background:
                billingMessage.tone ===
                "success"
                  ? "rgba(16,185,129,0.10)"
                  : "rgba(245,158,11,0.10)",
              border: `1px solid ${
                billingMessage.tone ===
                "success"
                  ? "rgba(16,185,129,0.24)"
                  : "rgba(245,158,11,0.24)"
              }`,
              color:
                billingMessage.tone ===
                "success"
                  ? T.emerald
                  : T.amber,
            }}
          >
            {billingMessage.tone ===
            "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <p className="text-sm font-medium">
              {billingMessage.message}
            </p>
          </div>
        )}

        {error && (
          <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{
              background:
                "rgba(244,63,94,0.10)",
              border:
                "1px solid rgba(244,63,94,0.24)",
              color: T.rose,
            }}
          >
            <AlertCircle size={18} />
            <p className="text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-[26px]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(12,20,44,0.72), rgba(20,32,64,0.62), rgba(12,20,44,0.72))",
                  border: `1px solid ${T.border}`,
                }}
              />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div
            className="rounded-[26px] p-8 text-center"
            style={{
              background: T.panel,
              border: `1px solid ${T.border}`,
            }}
          >
            <p className="text-lg font-bold text-white">
              No workspaces yet
            </p>
            <p
              className="mt-2 text-sm"
              style={{
                color: T.muted,
              }}
            >
              Create a workspace first, then choose an AI plan for it.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {workspaces.map(
              (workspace, index) => {
                const monthlyPercent =
                  getUsagePercent(
                    workspace.usage.monthlyUsed,
                    workspace.usage.monthlyCredits
                  );
                const burstPercent =
                  getUsagePercent(
                    workspace.usage.burstUsed,
                    workspace.usage.burstCreditsPer5Hours
                  );

                return (
                  <motion.article
                    key={workspace._id}
                    initial={{
                      opacity: 0,
                      y: 18,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.04,
                    }}
                    className="overflow-hidden rounded-[26px]"
                    style={{
                      background: T.panel,
                      border: `1px solid ${T.border}`,
                      boxShadow:
                        "0 18px 50px rgba(0,0,0,0.24)",
                    }}
                  >
                    <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_1fr] lg:p-6">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <WorkspaceAvatar
                              workspace={workspace}
                            />
                            <div>
                              <h2 className="text-xl font-black text-white">
                                {workspace.name}
                              </h2>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <StatusBadge
                                  status={
                                    workspace.subscriptionStatus
                                  }
                                />
                                <span
                                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                                  style={{
                                    color: T.muted,
                                    border: `1px solid ${T.border}`,
                                  }}
                                >
                                  {workspace.role}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className="text-[11px] font-bold uppercase tracking-widest"
                              style={{
                                color: T.muted,
                              }}
                            >
                              Current plan
                            </p>
                            <p
                              className="mt-1 text-2xl font-black"
                              style={{
                                color:
                                  workspace.plan.key ===
                                  "free"
                                    ? T.text
                                    : T.blue,
                              }}
                            >
                              {workspace.plan.name}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span
                                style={{
                                  color: T.muted,
                                }}
                              >
                                Monthly AI credits
                              </span>
                              <span className="font-semibold text-white">
                                {workspace.usage.monthlyUsed}
                                {" / "}
                                {workspace.usage.monthlyCredits}
                              </span>
                            </div>
                            <div
                              className="h-2 overflow-hidden rounded-full"
                              style={{
                                background:
                                  "rgba(255,255,255,0.06)",
                              }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${monthlyPercent}%`,
                                  background:
                                    "linear-gradient(90deg, #3D7BFF, #10B981)",
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span
                                style={{
                                  color: T.muted,
                                }}
                              >
                                5-hour burst guard
                              </span>
                              <span className="font-semibold text-white">
                                {workspace.usage.burstUsed}
                                {" / "}
                                {
                                  workspace.usage
                                    .burstCreditsPer5Hours
                                }
                              </span>
                            </div>
                            <div
                              className="h-2 overflow-hidden rounded-full"
                              style={{
                                background:
                                  "rgba(255,255,255,0.06)",
                              }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${burstPercent}%`,
                                  background:
                                    "linear-gradient(90deg, #7C3AED, #F59E0B)",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <p
                          className="mt-4 text-xs"
                          style={{
                            color: T.muted,
                          }}
                        >
                          Cycle ends:{" "}
                          {formatDate(
                            workspace.usage.periodEnd ||
                              workspace.currentPeriodEnd
                          )}
                          {workspace.cancelAtPeriodEnd
                            ? " - cancellation scheduled"
                            : ""}
                        </p>
                      </div>

                      <div
                        className="rounded-3xl p-4"
                        style={{
                          background:
                            "rgba(3,6,15,0.42)",
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <CreditCard
                            size={17}
                            color={T.blue}
                          />
                          <p className="text-sm font-black text-white">
                            Plan actions
                          </p>
                        </div>

                        {!workspace.canManageBilling ? (
                          <div
                            className="flex items-start gap-3 rounded-2xl p-4"
                            style={{
                              background:
                                "rgba(255,255,255,0.04)",
                              border: `1px solid ${T.border}`,
                              color: T.muted,
                            }}
                          >
                            <Lock
                              size={16}
                              className="mt-0.5"
                            />
                            <p className="text-sm leading-6">
                              Only the workspace owner can upgrade or manage billing.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {paidPlans.map(
                              (plan) => {
                                const isCurrent =
                                  workspace.plan.key ===
                                  plan.key;
                                const usesPortal =
                                  workspace.plan.key !==
                                  "free";
                                const key =
                                  usesPortal
                                    ? `${workspace._id}:portal`
                                    : `${workspace._id}:${plan.key}`;

                                return (
                                  <div
                                    key={plan.key}
                                    className="rounded-2xl p-4"
                                    style={{
                                      background:
                                        isCurrent
                                          ? "rgba(61,123,255,0.10)"
                                          : "rgba(255,255,255,0.035)",
                                      border: `1px solid ${
                                        isCurrent
                                          ? T.borderHi
                                          : T.border
                                      }`,
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-bold text-white">
                                          {plan.name}
                                        </p>
                                        <p
                                          className="mt-1 text-xs"
                                          style={{
                                            color: T.muted,
                                          }}
                                        >
                                          {plan.credits}
                                        </p>
                                      </div>

                                      {isCurrent ? (
                                        <span
                                          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                                          style={{
                                            color:
                                              T.emerald,
                                            background:
                                              "rgba(16,185,129,0.10)",
                                            border:
                                              "1px solid rgba(16,185,129,0.24)",
                                          }}
                                        >
                                          active
                                        </span>
                                      ) : null}
                                    </div>

                                    <p
                                      className="mt-3 text-xs leading-5"
                                      style={{
                                        color: T.muted,
                                      }}
                                    >
                                      {plan.description}
                                    </p>

                                    <button
                                      disabled={
                                        isCurrent ||
                                        Boolean(actionKey)
                                      }
                                      onClick={() => {
                                        if (usesPortal) {
                                          openPortal(
                                            workspace._id
                                          );
                                          return;
                                        }

                                        startCheckout(
                                          workspace._id,
                                          plan.key
                                        );
                                      }}
                                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-55"
                                      style={{
                                        background:
                                          isCurrent
                                            ? "rgba(255,255,255,0.04)"
                                            : "linear-gradient(135deg, #3D7BFF, #7C3AED)",
                                        color:
                                          "#FFFFFF",
                                      }}
                                    >
                                      {actionKey ===
                                      key ? (
                                        <Loader2
                                          size={15}
                                          className="animate-spin"
                                        />
                                      ) : isCurrent ? (
                                        <CheckCircle2
                                          size={15}
                                        />
                                      ) : (
                                        <ArrowUpRight
                                          size={15}
                                        />
                                      )}
                                      {isCurrent
                                        ? "Current plan"
                                        : usesPortal
                                          ? "Change in portal"
                                          : `Upgrade to ${plan.name}`}
                                    </button>
                                  </div>
                                );
                              }
                            )}

                            {workspace.subscriptionStatus !==
                              "free" &&
                              workspace.plan.key !==
                                "free" && (
                                <button
                                  disabled={Boolean(
                                    actionKey
                                  )}
                                  onClick={() =>
                                    openPortal(
                                      workspace._id
                                    )
                                  }
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-55"
                                  style={{
                                    background:
                                      "rgba(255,255,255,0.05)",
                                    border: `1px solid ${T.border}`,
                                    color: T.text,
                                  }}
                                >
                                  {actionKey ===
                                  `${workspace._id}:portal` ? (
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CreditCard
                                      size={15}
                                    />
                                  )}
                                  Manage billing portal
                                </button>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    <BillingHistoryPanel
                      workspace={workspace}
                    />
                  </motion.article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <BillingContent />
    </Suspense>
  );
}
