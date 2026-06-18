import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";
import Membership from "@/models/Membership";
import "@/models/Workspace";
import { getWorkspaceAiUsageSummary } from "@/lib/billing/ai-usage";
import { getPlanConfig } from "@/lib/billing/plans";

type PopulatedBillingMembership = {
  role: "OWNER" | "ADMIN" | "MEMBER";
  workspace: {
    _id: unknown;
    name: string;
    avatar?: string;
    plan?: string;
    subscriptionStatus?: string;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
};

export async function GET() {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const memberships =
      await Membership.find({
        user: session.user.id,
      })
        .populate({
          path: "workspace",
          select:
            "name avatar owner plan subscriptionStatus currentPeriodStart currentPeriodEnd cancelAtPeriodEnd",
        })
        .lean<PopulatedBillingMembership[]>();

    const workspaces =
      await Promise.all(
        memberships
          .filter(
            (
              membership
            ): membership is PopulatedBillingMembership & {
              workspace: NonNullable<
                PopulatedBillingMembership["workspace"]
              >;
            } => Boolean(membership.workspace)
          )
          .map(async (membership) => {
            const workspace =
              membership.workspace;
            const usage =
              await getWorkspaceAiUsageSummary(
                String(workspace._id)
              );
            const plan =
              getPlanConfig(
                workspace.plan
              );

            return {
              _id: workspace._id,
              name: workspace.name,
              avatar: workspace.avatar,
              role: membership.role,
              canManageBilling:
                membership.role === "OWNER",
              plan: {
                key: plan.key,
                name: plan.name,
                description: plan.description,
                monthlyCredits:
                  plan.monthlyCredits,
                burstCreditsPer5Hours:
                  plan.burstCreditsPer5Hours,
              },
              subscriptionStatus:
                workspace.subscriptionStatus || "free",
              currentPeriodStart:
                workspace.currentPeriodStart,
              currentPeriodEnd:
                workspace.currentPeriodEnd,
              cancelAtPeriodEnd:
                Boolean(workspace.cancelAtPeriodEnd),
              usage,
            };
          })
      );

    return NextResponse.json({
      workspaces,
    });
  } catch (error) {
    console.error(
      "GET BILLING WORKSPACES ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }
}
