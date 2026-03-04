import { resend } from "./resend";

export async function sendVerificationEmail(
  email: string,
  token: string
) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "NexSyncHub <onboarding@resend.dev>",
    to: email,
    subject: "Verify your NexSyncHub account",
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to verify your account:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
  });
}