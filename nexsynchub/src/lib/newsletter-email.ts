import { resend } from "@/lib/resend";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export async function sendNewsletterVerificationEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const verifyUrl =
    `${getAppUrl()}/api/newsletter/verify?token=${token}`;

  await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "NexSyncHub <noreply@karanart.com>",
    to: email,
    subject:
      "Confirm NexSyncHub intelligence updates",
    html: `
      <h2>Confirm intelligence updates</h2>
      <p>Confirm this email to receive future NexSyncHub workspace intelligence, operational summaries, and productivity digests.</p>
      <p><a href="${verifyUrl}">Confirm subscription</a></p>
      <p>This confirmation link expires in 24 hours.</p>
    `,
  });
}
