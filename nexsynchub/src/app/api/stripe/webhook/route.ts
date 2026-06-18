import { NextResponse } from "next/server";
import type Stripe from "stripe";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";
import Workspace from "@/models/Workspace";
import Membership from "@/models/Membership";
import User from "@/models/User";
import WorkspaceBillingRecord from "@/models/WorkspaceBillingRecord";
import {
  getPlanConfig,
  resolvePlanFromPriceId,
  type SubscriptionStatus,
} from "@/lib/billing/plans";
import {
  formatBillingAmount,
  sendWorkspaceBillingMemberEmail,
  sendWorkspaceBillingReceiptEmail,
  uniqueEmails,
} from "@/lib/billing/receipt-email";

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

function getStripeResourceId(
  value:
    | string
    | {
        id?: string;
      }
    | null
    | undefined
) {
  return typeof value === "string"
    ? value
    : value?.id || "";
}

function getInvoiceLine(
  invoice: Stripe.Invoice
) {
  return (
    invoice as Stripe.Invoice & {
      lines?: {
        data?: Array<{
          price?: {
            id?: string;
          } | null;
          parent?: {
            subscription_details?: {
              subscription?: string | Stripe.Subscription;
            } | null;
            subscription_item_details?: {
              subscription?: string | Stripe.Subscription;
            } | null;
          } | null;
          pricing?: {
            price_details?: {
              price?: string | null;
            } | null;
          } | null;
          period?: {
            start?: number | null;
            end?: number | null;
          } | null;
        }>;
      };
    }
  ).lines?.data?.[0];
}

function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice
) {
  const invoiceWithSubscription =
    invoice as Stripe.Invoice & {
      subscription?:
        | string
        | Stripe.Subscription
        | null;
      parent?: {
        subscription_details?: {
          subscription?:
            | string
            | Stripe.Subscription;
        } | null;
      } | null;
    };
  const lineParent =
    getInvoiceLine(invoice)?.parent;
  const subscription =
    invoiceWithSubscription.subscription ||
    invoiceWithSubscription.parent
      ?.subscription_details
      ?.subscription ||
    lineParent?.subscription_details
      ?.subscription ||
    lineParent
      ?.subscription_item_details
      ?.subscription;

  return getStripeResourceId(
    subscription
  );
}

function getInvoicePriceId(
  invoice: Stripe.Invoice,
  subscription: Stripe.Subscription
) {
  const line =
    getInvoiceLine(invoice);

  return (
    line?.price?.id ||
    line?.pricing?.price_details?.price ||
    subscription.items.data[0]?.price?.id ||
    ""
  );
}

function getInvoicePeriodDate(
  invoice: Stripe.Invoice,
  key: "start" | "end"
) {
  const linePeriod =
    getInvoiceLine(invoice)?.period?.[key];

  if (linePeriod) {
    return getUnixDate(linePeriod);
  }

  const invoiceWithPeriod =
    invoice as Stripe.Invoice & {
      period_start?: number | null;
      period_end?: number | null;
    };

  return getUnixDate(
    key === "start"
      ? invoiceWithPeriod.period_start
      : invoiceWithPeriod.period_end
  );
}

function getInvoicePaidAt(
  invoice: Stripe.Invoice
) {
  const invoiceWithStatus =
    invoice as Stripe.Invoice & {
      status_transitions?: {
        paid_at?: number | null;
      } | null;
      created?: number;
    };

  return getUnixDate(
    invoiceWithStatus.status_transitions
      ?.paid_at || invoiceWithStatus.created
  );
}

async function getInvoiceFromEvent(
  event: Stripe.Event,
  stripe: Stripe
): Promise<Stripe.Invoice | null> {
  if (
    event.type === "invoice_payment.paid"
  ) {
    const invoicePayment =
      event.data.object as Stripe.InvoicePayment;
    const invoiceId =
      getStripeResourceId(
        invoicePayment.invoice
      );

    if (!invoiceId) {
      return null;
    }

    if (
      typeof invoicePayment.invoice !==
      "string"
    ) {
      const invoice =
        invoicePayment.invoice;

      if (
        invoice &&
        "object" in invoice &&
        invoice.object === "invoice" &&
        !(
          "deleted" in invoice &&
          invoice.deleted
        )
      ) {
        return invoice as Stripe.Invoice;
      }
    }

    return stripe.invoices.retrieve(
      invoiceId
    );
  }

  return event.data.object as Stripe.Invoice;
}

type BillingMember = {
  role: "OWNER" | "ADMIN" | "MEMBER";
  user?: {
    email?: string;
    username?: string;
    displayName?: string;
  } | null;
};

async function sendBillingRecordEmails({
  recordId,
  workspaceId,
  workspaceName,
  planName,
  amountLabel,
  invoiceNumber,
  invoicePdfUrl,
  hostedInvoiceUrl,
  purchasedByName,
  billingReason,
  paidAt,
  existingReceiptEmailSentAt,
  existingMemberEmailSentAt,
}: {
  recordId: string;
  workspaceId: string;
  workspaceName: string;
  planName: string;
  amountLabel: string;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  hostedInvoiceUrl?: string;
  purchasedByName: string;
  billingReason: string;
  paidAt: Date | null;
  existingReceiptEmailSentAt?: Date | null;
  existingMemberEmailSentAt?: Date | null;
}) {
  const memberships =
    await Membership.find({
      workspace: workspaceId,
    })
      .populate(
        "user",
        "email username displayName"
      )
      .lean<BillingMember[]>();

  const billingManagerEmails =
    uniqueEmails(
      memberships
        .filter((membership) =>
          [
            "OWNER",
            "ADMIN",
          ].includes(membership.role)
        )
        .map(
          (membership) =>
            membership.user?.email
        )
    );

  const memberEmails =
    uniqueEmails(
      memberships
        .filter(
          (membership) =>
            membership.role === "MEMBER"
        )
        .map(
          (membership) =>
            membership.user?.email
        )
    ).filter(
      (email) =>
        !billingManagerEmails.includes(email)
    );

  const billingUrl =
    `${getAppUrl()}/dashboard/pricing?workspaceId=${workspaceId}`;
  const paidAtLabel =
    paidAt
      ? paidAt.toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        )
      : "Payment completed";
  const shouldNotifyMembers =
    [
      "subscription_create",
      "subscription_update",
    ].includes(billingReason);

  if (!existingReceiptEmailSentAt) {
    try {
      await sendWorkspaceBillingReceiptEmail({
        recipients:
          billingManagerEmails,
        workspaceName,
        planName,
        amountLabel,
        invoiceNumber,
        invoicePdfUrl,
        hostedInvoiceUrl,
        purchasedByName,
        paidAtLabel,
        billingUrl,
      });

      await WorkspaceBillingRecord.updateOne(
        {
          _id: recordId,
        },
        {
          $set: {
            receiptEmailSentAt:
              new Date(),
            receiptEmailError: "",
          },
        }
      );
    } catch (error) {
      console.error(
        "BILLING RECEIPT EMAIL ERROR:",
        error
      );

      await WorkspaceBillingRecord.updateOne(
        {
          _id: recordId,
        },
        {
          $set: {
            receiptEmailError:
              error instanceof Error
                ? error.message
                : "Failed to send receipt email",
          },
        }
      );
    }
  }

  if (
    shouldNotifyMembers &&
    !existingMemberEmailSentAt
  ) {
    try {
      await sendWorkspaceBillingMemberEmail({
        recipients: memberEmails,
        workspaceName,
        planName,
        purchasedByName,
        billingUrl,
      });

      await WorkspaceBillingRecord.updateOne(
        {
          _id: recordId,
        },
        {
          $set: {
            memberEmailSentAt:
              new Date(),
            memberEmailError: "",
          },
        }
      );
    } catch (error) {
      console.error(
        "BILLING MEMBER EMAIL ERROR:",
        error
      );

      await WorkspaceBillingRecord.updateOne(
        {
          _id: recordId,
        },
        {
          $set: {
            memberEmailError:
              error instanceof Error
                ? error.message
                : "Failed to send member email",
          },
        }
      );
    }
  }
}

async function recordSuccessfulInvoice({
  invoice,
  subscription,
}: {
  invoice: Stripe.Invoice;
  subscription: Stripe.Subscription;
}) {
  const workspaceId =
    subscription.metadata?.workspaceId;

  if (!workspaceId) {
    return;
  }

  const workspace =
    await Workspace.findById(
      workspaceId
    )
      .select("name")
      .lean<{
        _id: unknown;
        name: string;
      } | null>();

  if (!workspace) {
    return;
  }

  const stripeInvoiceId =
    invoice.id;
  const existingRecord =
    await WorkspaceBillingRecord.findOne({
      stripeInvoiceId,
    })
      .select(
        "receiptEmailSentAt memberEmailSentAt"
      )
      .lean<{
        receiptEmailSentAt?: Date | null;
        memberEmailSentAt?: Date | null;
      } | null>();

  const stripePriceId =
    getInvoicePriceId(
      invoice,
      subscription
    );
  const plan =
    resolvePlanFromPriceId(
      stripePriceId
    );
  const planConfig =
    getPlanConfig(plan);
  const invoiceData =
    invoice as Stripe.Invoice & {
      amount_paid?: number;
      amount_due?: number;
      billing_reason?: string | null;
      hosted_invoice_url?: string | null;
      invoice_pdf?: string | null;
      number?: string | null;
      status?: string | null;
      status_transitions?: {
        paid_at?: number | null;
      } | null;
      customer?:
        | string
        | Stripe.Customer
        | Stripe.DeletedCustomer
        | null;
    };

  const purchaserId =
    subscription.metadata?.purchaserId;
  const purchaser =
    purchaserId &&
    mongoose.Types.ObjectId.isValid(
      purchaserId
    )
      ? await User.findById(
          purchaserId
        )
          .select(
            "email username displayName"
          )
          .lean<{
            email?: string;
            username?: string;
            displayName?: string;
          } | null>()
      : null;

  const purchasedByName =
    subscription.metadata?.purchaserName ||
    purchaser?.displayName ||
    purchaser?.username ||
    purchaser?.email ||
    "Workspace owner";
  const purchasedByEmail =
    subscription.metadata?.purchaserEmail ||
    purchaser?.email ||
    "";
  const amountPaid =
    invoiceData.amount_paid || 0;
  const paidAt =
    getInvoicePaidAt(invoice);

  const record =
    await WorkspaceBillingRecord.findOneAndUpdate(
      {
        stripeInvoiceId,
      },
      {
        $set: {
          workspace: workspaceId,
          purchasedBy:
            purchaserId &&
            mongoose.Types.ObjectId.isValid(
              purchaserId
            )
              ? purchaserId
              : null,
          purchasedByEmail,
          purchasedByName,
          plan,
          planName:
            planConfig.name,
          billingReason:
            invoiceData.billing_reason || "",
          stripeCustomerId:
            getStripeResourceId(
              invoiceData.customer
            ) ||
            getStripeResourceId(
              subscription.customer as
                | string
                | Stripe.Customer
                | Stripe.DeletedCustomer
                | null
            ),
          stripeSubscriptionId:
            subscription.id,
          stripePriceId,
          invoiceNumber:
            invoiceData.number || "",
          invoicePdfUrl:
            invoiceData.invoice_pdf || "",
          hostedInvoiceUrl:
            invoiceData.hosted_invoice_url ||
            "",
          amountPaid,
          amountDue:
            invoiceData.amount_due || 0,
          currency:
            invoice.currency || "usd",
          paymentStatus: "paid",
          invoiceStatus:
            invoiceData.status || "",
          periodStart:
            getInvoicePeriodDate(
              invoice,
              "start"
            ),
          periodEnd:
            getInvoicePeriodDate(
              invoice,
              "end"
            ),
          paidAt,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

  await sendBillingRecordEmails({
    recordId: String(record._id),
    workspaceId,
    workspaceName:
      workspace.name,
    planName:
      planConfig.name,
    amountLabel:
      formatBillingAmount(
        amountPaid,
        invoice.currency || "usd"
      ),
    invoiceNumber:
      invoiceData.number || "",
    invoicePdfUrl:
      invoiceData.invoice_pdf || "",
    hostedInvoiceUrl:
      invoiceData.hosted_invoice_url || "",
    purchasedByName,
    billingReason:
      invoiceData.billing_reason || "",
    paidAt,
    existingReceiptEmailSentAt:
      existingRecord?.receiptEmailSentAt ||
      null,
    existingMemberEmailSentAt:
      existingRecord?.memberEmailSentAt ||
      null,
  });
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
        "invoice_payment.paid" ||
      event.type ===
        "invoice.paid" ||
      event.type ===
        "invoice.payment_failed" ||
      event.type ===
        "invoice.payment_succeeded"
    ) {
      const invoice =
        await getInvoiceFromEvent(
          event,
          stripe
        );

      if (!invoice) {
        console.warn(
          "STRIPE WEBHOOK INVOICE SKIPPED: missing invoice object",
          event.id
        );
        return NextResponse.json({
          received: true,
        });
      }

      const subscriptionId =
        getInvoiceSubscriptionId(
          invoice
        );

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(
            subscriptionId
          );

        await syncSubscription(
          subscription
        );

        if (
          event.type ===
            "invoice.payment_succeeded" ||
          event.type ===
            "invoice.paid" ||
          event.type ===
            "invoice_payment.paid"
        ) {
          await recordSuccessfulInvoice({
            invoice,
            subscription,
          });
        }
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
