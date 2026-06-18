import { resend } from "@/lib/resend";

type BillingReceiptEmailInput = {
  recipients: string[];
  workspaceName: string;
  planName: string;
  amountLabel: string;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  hostedInvoiceUrl?: string;
  purchasedByName: string;
  paidAtLabel: string;
  billingUrl: string;
};

type BillingMemberEmailInput = {
  recipients: string[];
  workspaceName: string;
  planName: string;
  purchasedByName: string;
  billingUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function uniqueEmails(
  emails: Array<string | null | undefined>
) {
  return Array.from(
    new Set(
      emails
        .filter(
          (email): email is string =>
            Boolean(email?.trim())
        )
        .map((email) =>
          email.trim().toLowerCase()
        )
    )
  );
}

export function formatBillingAmount(
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

export async function sendWorkspaceBillingReceiptEmail({
  recipients,
  workspaceName,
  planName,
  amountLabel,
  invoiceNumber,
  invoicePdfUrl,
  hostedInvoiceUrl,
  purchasedByName,
  paidAtLabel,
  billingUrl,
}: BillingReceiptEmailInput) {
  if (!recipients.length) {
    return;
  }

  const safeWorkspace =
    escapeHtml(workspaceName);
  const safePlan =
    escapeHtml(planName);
  const safePurchaser =
    escapeHtml(purchasedByName);
  const safeAmount =
    escapeHtml(amountLabel);
  const safeInvoice =
    escapeHtml(invoiceNumber || "Receipt");

  await resend.emails.send({
    from:
      "NexSyncHub Billing <billing@karanart.com>",
    to: recipients,
    subject:
      `${safeWorkspace} ${safePlan} payment receipt`,
    html: `
      <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
            <div style="padding:28px 30px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fbff 0%,#ffffff 72%);">
              <p style="margin:0 0 10px;color:#3D7BFF;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                NexSyncHub Billing
              </p>
              <h1 style="margin:0;color:#111827;font-size:25px;line-height:1.35;">
                Payment receipt
              </h1>
              <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:1.7;">
                A workspace subscription payment was completed successfully.
              </p>
            </div>

            <div style="padding:26px 30px;">
              <div style="display:grid;gap:12px;margin:0 0 22px;">
                <div style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <p style="margin:0;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Workspace</p>
                  <p style="margin:6px 0 0;color:#111827;font-size:16px;font-weight:700;">${safeWorkspace}</p>
                </div>
                <div style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <p style="margin:0;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Plan</p>
                  <p style="margin:6px 0 0;color:#111827;font-size:16px;font-weight:700;">${safePlan}</p>
                </div>
                <div style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <p style="margin:0;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Amount paid</p>
                  <p style="margin:6px 0 0;color:#111827;font-size:16px;font-weight:700;">${safeAmount}</p>
                </div>
              </div>

              <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px;">
                <tr>
                  <td style="padding:8px 0;color:#6b7280;">Purchased by</td>
                  <td style="padding:8px 0;color:#111827;text-align:right;font-weight:700;">${safePurchaser}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#6b7280;">Payment date</td>
                  <td style="padding:8px 0;color:#111827;text-align:right;font-weight:700;">${escapeHtml(paidAtLabel)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#6b7280;">Invoice</td>
                  <td style="padding:8px 0;color:#111827;text-align:right;font-weight:700;">${safeInvoice}</td>
                </tr>
              </table>

              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                ${
                  invoicePdfUrl
                    ? `<a href="${escapeHtml(invoicePdfUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 16px;">Download receipt PDF</a>`
                    : ""
                }
                ${
                  hostedInvoiceUrl
                    ? `<a href="${escapeHtml(hostedInvoiceUrl)}" style="display:inline-block;background:#eef2ff;color:#3730a3;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 16px;">View Stripe invoice</a>`
                    : ""
                }
                <a href="${escapeHtml(billingUrl)}" style="display:inline-block;background:#f3f4f6;color:#111827;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 16px;">Open billing history</a>
              </div>

              <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.7;">
                This receipt is sent to workspace owners and admins for record keeping.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendWorkspaceBillingMemberEmail({
  recipients,
  workspaceName,
  planName,
  purchasedByName,
  billingUrl,
}: BillingMemberEmailInput) {
  if (!recipients.length) {
    return;
  }

  const safeWorkspace =
    escapeHtml(workspaceName);
  const safePlan =
    escapeHtml(planName);
  const safePurchaser =
    escapeHtml(purchasedByName);

  await resend.emails.send({
    from:
      "NexSyncHub Billing <billing@karanart.com>",
    to: recipients,
    subject:
      `${safeWorkspace} upgraded to ${safePlan}`,
    html: `
      <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:620px;margin:0 auto;padding:30px 20px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
            <div style="padding:26px 28px;">
              <p style="margin:0 0 10px;color:#10B981;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                Workspace plan updated
              </p>
              <h1 style="margin:0;color:#111827;font-size:23px;line-height:1.35;">
                ${safeWorkspace} is now on ${safePlan}.
              </h1>
              <p style="margin:14px 0 0;color:#4b5563;font-size:15px;line-height:1.8;">
                ${safePurchaser} purchased the ${safePlan} plan for ${safeWorkspace}. Your team now has the workspace AI capacity attached to that plan.
              </p>
              <a href="${escapeHtml(billingUrl)}" style="display:inline-block;margin-top:20px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 16px;">
                View workspace plan
              </a>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}
