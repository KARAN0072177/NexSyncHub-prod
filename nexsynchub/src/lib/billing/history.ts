import WorkspaceBillingRecord
  from "@/models/WorkspaceBillingRecord";

export type WorkspaceBillingHistoryItem = {
  _id: string;
  plan: string;
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

type BillingRecordLean = {
  _id: unknown;
  plan?: string;
  planName?: string;
  billingReason?: string;
  amountPaid?: number;
  amountDue?: number;
  currency?: string;
  paymentStatus?: string;
  invoiceStatus?: string;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  hostedInvoiceUrl?: string;
  paidAt?: Date | string | null;
  periodStart?: Date | string | null;
  periodEnd?: Date | string | null;
  receiptEmailSentAt?: Date | string | null;
};

function toIsoDate(
  value?: Date | string | null
) {
  if (!value) return null;

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function getWorkspaceBillingHistory({
  workspaceId,
  includeReceiptLinks,
  limit = 6,
}: {
  workspaceId: string;
  includeReceiptLinks: boolean;
  limit?: number;
}): Promise<WorkspaceBillingHistoryItem[]> {
  const records =
    await WorkspaceBillingRecord.find({
      workspace: workspaceId,
    })
      .sort({
        paidAt: -1,
        createdAt: -1,
      })
      .limit(limit)
      .lean<BillingRecordLean[]>();

  return records.map((record) => ({
    _id: String(record._id),
    plan: record.plan || "free",
    planName: record.planName || "Plan",
    billingReason:
      record.billingReason || "subscription",
    amountPaid: record.amountPaid || 0,
    amountDue: record.amountDue || 0,
    currency: record.currency || "usd",
    paymentStatus:
      record.paymentStatus || "paid",
    invoiceStatus:
      record.invoiceStatus || "",
    invoiceNumber:
      includeReceiptLinks
        ? record.invoiceNumber || ""
        : "",
    invoicePdfUrl:
      includeReceiptLinks
        ? record.invoicePdfUrl || ""
        : "",
    hostedInvoiceUrl:
      includeReceiptLinks
        ? record.hostedInvoiceUrl || ""
        : "",
    paidAt: toIsoDate(record.paidAt),
    periodStart: toIsoDate(
      record.periodStart
    ),
    periodEnd: toIsoDate(
      record.periodEnd
    ),
    receiptEmailSentAt: toIsoDate(
      record.receiptEmailSentAt
    ),
  }));
}
