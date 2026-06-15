import { resend } from "./resend";
import {
  getAppUrl,
  normalizeAppUrl,
} from "@/lib/app-url";

export async function sendVerificationEmail(
  email: string,
  token: string,
  appUrl = getAppUrl()
) {
  const verifyUrl =
    `${normalizeAppUrl(appUrl)}/verify-email?token=${token}`;

  await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "NexSyncHub <noreply@karanart.com>",
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Verify your email</h2>
      <p>Click below to verify your account:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link expires in 10 minutes.</p>
    `,
  });
}
