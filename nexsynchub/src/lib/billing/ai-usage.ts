import mongoose from "mongoose";

import AIUsage from "@/models/AIUsage";
import Workspace from "@/models/Workspace";
import {
  AI_FEATURE_CREDITS,
  type AiFeatureKey,
  getBurstWindowStart,
  getCurrentCalendarMonthRange,
  getPlanConfig,
  normalizeWorkspacePlan,
} from "@/lib/billing/plans";

type WorkspaceBillingFields = {
  _id: mongoose.Types.ObjectId;
  plan?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
};

type UsageTotal = {
  _id: null;
  credits: number;
};

export class AiQuotaExceededError extends Error {
  code = "AI_QUOTA_EXCEEDED";
  status = 402;
  usage: Awaited<ReturnType<typeof getWorkspaceAiUsageSummary>>;

  constructor(
    message: string,
    usage: Awaited<ReturnType<typeof getWorkspaceAiUsageSummary>>
  ) {
    super(message);
    this.name = "AiQuotaExceededError";
    this.usage = usage;
  }
}

function getBillingPeriod(workspace: WorkspaceBillingFields) {
  if (workspace.currentPeriodStart && workspace.currentPeriodEnd) {
    return {
      start: new Date(workspace.currentPeriodStart),
      end: new Date(workspace.currentPeriodEnd),
    };
  }

  return getCurrentCalendarMonthRange();
}

async function sumCredits(match: Record<string, unknown>) {
  const [result] =
    await AIUsage.aggregate<UsageTotal>([
      {
        $match: match,
      },
      {
        $group: {
          _id: null,
          credits: {
            $sum: "$creditsUsed",
          },
        },
      },
    ]);

  return result?.credits || 0;
}

export async function getWorkspaceAiUsageSummary(workspaceId: string) {
  const workspace =
    await Workspace.findById(
      workspaceId
    )
      .select(
        "plan currentPeriodStart currentPeriodEnd"
      )
      .lean<WorkspaceBillingFields | null>();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const plan =
    normalizeWorkspacePlan(workspace.plan);
  const planConfig =
    getPlanConfig(plan);
  const period =
    getBillingPeriod(workspace);
  const workspaceObjectId =
    new mongoose.Types.ObjectId(workspaceId);

  const [monthlyUsed, burstUsed] =
    await Promise.all([
      sumCredits({
        scope: "workspace",
        workspace: workspaceObjectId,
        createdAt: {
          $gte: period.start,
          $lt: period.end,
        },
      }),
      sumCredits({
        scope: "workspace",
        workspace: workspaceObjectId,
        createdAt: {
          $gte: getBurstWindowStart(),
        },
      }),
    ]);

  return {
    plan,
    planName: planConfig.name,
    monthlyCredits: planConfig.monthlyCredits,
    monthlyUsed,
    monthlyRemaining: Math.max(
      planConfig.monthlyCredits - monthlyUsed,
      0
    ),
    burstCreditsPer5Hours: planConfig.burstCreditsPer5Hours,
    burstUsed,
    burstRemaining: Math.max(
      planConfig.burstCreditsPer5Hours - burstUsed,
      0
    ),
    periodStart: period.start,
    periodEnd: period.end,
  };
}

export async function assertWorkspaceAiQuota({
  workspaceId,
  credits,
}: {
  workspaceId: string;
  credits: number;
}) {
  const usage =
    await getWorkspaceAiUsageSummary(
      workspaceId
    );

  if (usage.monthlyRemaining < credits) {
    throw new AiQuotaExceededError(
      "This workspace has used its monthly AI credits.",
      usage
    );
  }

  if (usage.burstRemaining < credits) {
    throw new AiQuotaExceededError(
      "This workspace is cooling down after recent AI usage.",
      usage
    );
  }

  return usage;
}

export async function recordAiUsage({
  scope,
  workspaceId,
  userId,
  featureKey,
  creditsUsed,
  model,
  metadata,
}: {
  scope: "workspace" | "platform";
  workspaceId?: string | null;
  userId?: string | null;
  featureKey: AiFeatureKey;
  creditsUsed?: number;
  model?: string;
  metadata?: Record<string, unknown>;
}) {
  const resolvedCredits =
    creditsUsed ?? AI_FEATURE_CREDITS[featureKey];

  await AIUsage.create({
    scope,
    workspace: workspaceId || null,
    user: userId || null,
    featureKey,
    creditsUsed: resolvedCredits,
    provider: "openai",
    model: model || "",
    metadata: metadata || {},
  });
}

export function isAiQuotaExceededError(
  error: unknown
): error is AiQuotaExceededError {
  return error instanceof AiQuotaExceededError;
}
