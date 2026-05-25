import { Resend }
  from "resend";

const resend =
  new Resend(
    process.env.RESEND_API_KEY
  );

interface SendEmailOptions {

  to: string;

  subject: string;

  html: string;

}

export async function sendEmail({

  to,
  subject,
  html,

}: SendEmailOptions) {

  await resend.emails.send({

    from:
      process.env.RESEND_FROM_EMAIL!,

    to,

    subject,

    html,

  });

}