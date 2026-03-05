import { resend } from "./resend";

export async function sendPasswordChangedEmail(email: string) {
  await resend.emails.send({
    from: "NexSyncHub <onboarding@resend.dev>",
    to: email,
    subject: "Your password was changed",
    html: `
      <h2>Password Changed</h2>
      <p>Your NexSyncHub password was successfully updated.</p>
      <p>If this was not you, contact support immediately.</p>
    `,
  });
}