import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";
import { getRequestAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";
import { getWorkspaceAccess } from "@/lib/billing/access";

const portalSchema =
  z.object({
    workspaceId: z.string().min(1),
  });

export async function POST(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();
    const parsed =
      portalSchema.safeParse(
        await req.json()
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid billing request",
        },
        {
          status: 400,
        }
      );
    }

    const {
      workspaceId,
    } = parsed.data;

    const {
      workspace,
      isOwner,
    } = await getWorkspaceAccess({
      workspaceId,
      userId: session.user.id,
    });

    if (!workspace || !isOwner) {
      return NextResponse.json(
        {
          error:
            "Only the workspace owner can manage billing.",
        },
        {
          status: 403,
        }
      );
    }

    if (!workspace.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "This workspace does not have a Stripe customer yet.",
        },
        {
          status: 400,
        }
      );
    }

    const stripe =
      getStripe();
    const appUrl =
      getRequestAppUrl(req);

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer:
          workspace.stripeCustomerId,
        return_url:
          `${appUrl}/dashboard/pricing?workspaceId=${workspaceId}`,
      });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error(
      "CREATE STRIPE PORTAL ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }
}
