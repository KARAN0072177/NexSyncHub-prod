import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";
import { getWorkspaceAccess } from "@/lib/billing/access";
import { getWorkspaceAiUsageSummary } from "@/lib/billing/ai-usage";
import { getPlanConfig } from "@/lib/billing/plans";
import { getWorkspaceBillingHistory } from "@/lib/billing/history";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
    }>;
  }
) {
  try {
    await connectDB();

    const session =
      await requireAuth();
    const { workspaceId } =
      await params;

    const {
      workspace,
      membership,
      isOwner,
    } = await getWorkspaceAccess({
      workspaceId,
      userId: session.user.id,
    });

    if (!workspace || !membership) {
      return NextResponse.json(
        {
          error: "Workspace not found",
        },
        {
          status: 404,
        }
      );
    }

    const canViewReceipts =
      membership.role === "OWNER" ||
      membership.role === "ADMIN";
    const [
      usage,
      billingHistory,
    ] = await Promise.all([
      getWorkspaceAiUsageSummary(
        workspaceId
      ),
      getWorkspaceBillingHistory({
        workspaceId,
        includeReceiptLinks:
          canViewReceipts,
        limit: 10,
      }),
    ]);
    const planConfig =
      getPlanConfig(workspace.plan);

    return NextResponse.json({
      workspace: {
        _id: workspace._id,
        name: workspace.name,
        avatar: workspace.avatar,
        plan: workspace.plan || "free",
        subscriptionStatus:
          workspace.subscriptionStatus || "free",
        currentPeriodStart:
          workspace.currentPeriodStart,
        currentPeriodEnd:
          workspace.currentPeriodEnd,
        cancelAtPeriodEnd:
          Boolean(workspace.cancelAtPeriodEnd),
      },
      role: membership.role,
      canManageBilling: isOwner,
      plan: {
        key: planConfig.key,
        name: planConfig.name,
        description: planConfig.description,
        monthlyCredits: planConfig.monthlyCredits,
        burstCreditsPer5Hours:
          planConfig.burstCreditsPer5Hours,
      },
      usage,
      canViewReceipts,
      billingHistory,
    });
  } catch (error) {
    console.error(
      "GET WORKSPACE BILLING ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }
}
