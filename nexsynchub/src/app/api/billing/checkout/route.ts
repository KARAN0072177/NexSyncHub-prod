import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";
import { getRequestAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";
import { getWorkspaceAccess } from "@/lib/billing/access";
import {
  getPaidPlanPriceId,
  type WorkspacePlan,
} from "@/lib/billing/plans";

const checkoutSchema =
  z.object({
    workspaceId: z.string().min(1),
    plan: z.enum([
      "pro",
      "business",
    ]),
  });

export async function POST(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();
    const parsed =
      checkoutSchema.safeParse(
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
      plan,
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

    const hasManagedSubscription =
      Boolean(workspace.stripeSubscriptionId) &&
      [
        "active",
        "trialing",
        "past_due",
        "incomplete",
      ].includes(
        workspace.subscriptionStatus
      );

    if (hasManagedSubscription) {
      return NextResponse.json(
        {
          error:
            "This workspace already has a subscription. Use the billing portal to manage it.",
        },
        {
          status: 409,
        }
      );
    }

    const priceId =
      getPaidPlanPriceId(
        plan as WorkspacePlan
      );

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Stripe price ID is not configured for this plan.",
        },
        {
          status: 500,
        }
      );
    }

    const stripe =
      getStripe();
    const appUrl =
      getRequestAppUrl(req);

    let customerId =
      workspace.stripeCustomerId;

    if (!customerId) {
      const customer =
        await stripe.customers.create({
          email:
            session.user.email || undefined,
          name:
            workspace.name,
          metadata: {
            workspaceId:
              String(workspace._id),
            ownerId:
              session.user.id,
          },
        });

      customerId = customer.id;
      workspace.stripeCustomerId =
        customerId;
      await workspace.save();
    }

    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        success_url:
          `${appUrl}/dashboard/pricing?billing=success&workspaceId=${workspaceId}`,
        cancel_url:
          `${appUrl}/dashboard/pricing?billing=cancelled&workspaceId=${workspaceId}`,
        metadata: {
          workspaceId,
          plan,
        },
        subscription_data: {
          metadata: {
            workspaceId,
            plan,
          },
        },
      });

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error(
      "CREATE STRIPE CHECKOUT ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }
}
