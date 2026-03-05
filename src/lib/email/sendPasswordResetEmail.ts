import { resend } from "./resend";

export async function sendPasswordResetEmail(email: string, otp: string) {
  await resend.emails.send({
    from: "NexSyncHub <onboarding@resend.dev>",
    to: email,
    subject: "Password Reset OTP",
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}