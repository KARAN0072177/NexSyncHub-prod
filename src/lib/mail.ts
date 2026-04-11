import { resend } from "./resend";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "NexSyncHub <noreply@karanart.com>",
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