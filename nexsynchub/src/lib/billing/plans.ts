export type WorkspacePlan =
  | "free"
  | "pro"
  | "business";

export type SubscriptionStatus =
  | "free"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export type AiUsageScope =
  | "workspace"
  | "platform";

export type AiFeatureKey =
  | "task_description_enhance"
  | "workspace_summary"
  | "workspace_digest"
  | "workspace_report"
  | "support_request_enhance"
  | "admin_support_summary"
  | "admin_support_enhance"
  | "admin_moderation_enhance"
  | "admin_platform_insight"
  | "admin_moderation_lab";

export type PlanConfig = {
  key: WorkspacePlan;
  name: string;
  description: string;
  monthlyCredits: number;
  burstCreditsPer5Hours: number;
  stripePriceId?: string;
};

export const AI_FEATURE_CREDITS: Record<AiFeatureKey, number> = {
  task_description_enhance: 1,
  workspace_summary: 5,
  workspace_digest: 10,
  workspace_report: 15,
  support_request_enhance: 1,
  admin_support_summary: 3,
  admin_support_enhance: 1,
  admin_moderation_enhance: 1,
  admin_platform_insight: 5,
  admin_moderation_lab: 5,
};

export const WORKSPACE_PLANS: Record<WorkspacePlan, PlanConfig> = {
  free: {
    key: "free",
    name: "Free",
    description: "A starter workspace for trying NexSyncHub AI.",
    monthlyCredits: 50,
    burstCreditsPer5Hours: 10,
  },
  pro: {
    key: "pro",
    name: "Pro",
    description: "Higher AI limits for active teams shipping real work.",
    monthlyCredits: 1000,
    burstCreditsPer5Hours: 150,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  business: {
    key: "business",
    name: "Business",
    description: "Expanded AI capacity for larger collaborative workspaces.",
    monthlyCredits: 5000,
    burstCreditsPer5Hours: 700,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
  },
};

export function normalizeWorkspacePlan(plan?: string | null): WorkspacePlan {
  return plan === "pro" || plan === "business"
    ? plan
    : "free";
}

export function getPlanConfig(plan?: string | null) {
  return WORKSPACE_PLANS[normalizeWorkspacePlan(plan)];
}

export function getPaidPlanPriceId(plan: WorkspacePlan) {
  if (plan === "free") {
    return null;
  }

  return WORKSPACE_PLANS[plan].stripePriceId || null;
}

export function resolvePlanFromPriceId(priceId?: string | null): WorkspacePlan {
  if (!priceId) {
    return "free";
  }

  const matchingPlan = Object.values(WORKSPACE_PLANS).find(
    (plan) => plan.stripePriceId === priceId
  );

  return matchingPlan?.key || "free";
}

export function getCurrentCalendarMonthRange(now = new Date()) {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );

  return {
    start,
    end,
  };
}

export function getBurstWindowStart(now = new Date()) {
  return new Date(
    now.getTime() - 5 * 60 * 60 * 1000
  );
}
