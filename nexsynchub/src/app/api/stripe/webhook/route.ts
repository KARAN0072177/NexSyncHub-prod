import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import Workspace from "@/models/Workspace";
import {
  resolvePlanFromPriceId,
  type SubscriptionStatus,
} from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapStripeStatus(
  status?: string | null
): SubscriptionStatus {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";

  return "incomplete";
}

function getUnixDate(value?: number | null) {
  return value
    ? new Date(value * 1000)
    : null;
}

async function syncSubscription(
  subscription: Stripe.Subscription
) {
  const subscriptionData =
    subscription as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };
  const priceId =
    subscription.items.data[0]?.price?.id || "";
  const workspaceId =
    subscription.metadata?.workspaceId;

  if (!workspaceId) {
    return;
  }

  const plan =
    resolvePlanFromPriceId(
      priceId
    );
  const status =
    mapStripeStatus(
      subscription.status
    );

  await Workspace.findByIdAndUpdate(
    workspaceId,
    {
      $set: {
        plan:
          status === "canceled"
            ? "free"
            : plan,
        subscriptionStatus:
          status === "canceled"
            ? "canceled"
            : status,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id || "",
        stripeSubscriptionId:
          subscription.id,
        stripePriceId:
          priceId,
        currentPeriodStart:
          getUnixDate(
            subscriptionData.current_period_start
          ),
        currentPeriodEnd:
          getUnixDate(
            subscriptionData.current_period_end
          ),
        cancelAtPeriodEnd:
          Boolean(subscription.cancel_at_period_end),
      },
    }
  );
}

export async function POST(req: Request) {
  const stripe =
    getStripe();
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Missing STRIPE_WEBHOOK_SECRET",
      },
      {
        status: 500,
      }
    );
  }

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe signature",
      },
      {
        status: 400,
      }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody =
      await req.text();

    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
  } catch (error) {
    console.error(
      "STRIPE WEBHOOK SIGNATURE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Invalid Stripe webhook signature",
      },
      {
        status: 400,
      }
    );
  }

  try {
    await connectDB();

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const checkoutSession =
        event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id;

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(
            subscriptionId
          );

        await syncSubscription(
          subscription
        );
      }
    }

    if (
      event.type ===
        "customer.subscription.created" ||
      event.type ===
        "customer.subscription.updated" ||
      event.type ===
        "customer.subscription.deleted"
    ) {
      await syncSubscription(
        event.data.object as Stripe.Subscription
      );
    }

    if (
      event.type ===
        "invoice.payment_failed" ||
      event.type ===
        "invoice.payment_succeeded"
    ) {
      const invoice =
        event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(
            subscriptionId
          );

        await syncSubscription(
          subscription
        );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "STRIPE WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Stripe webhook processing failed",
      },
      {
        status: 500,
      }
    );
  }
}
