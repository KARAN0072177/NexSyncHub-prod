import { sendEmail } from "@/lib/send-email";

export async function sendBanEmail({

  email,
  username,
  reason,
  expiresAt,

}: {

  email: string;
  username?: string;
  reason: string;
  expiresAt?: Date | null;

}) {

  await sendEmail({

    to: email,

    subject: expiresAt 
      ? "Action Required: NexSyncHub Account Suspension" 
      : "Notice: NexSyncHub Account Restriction",

    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #111827; margin: 0; font-size: 24px;">Account Moderation Notice</h2>
        </div>
        <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">Dear ${username || "User"},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">This email is to formally inform you that an administrative action has been taken regarding your NexSyncHub account due to a violation of our platform's community guidelines or terms of service.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Reason for action</p>
          <p style="margin: 0; color: #7f1d1d; font-size: 15px;">${reason}</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #374151; font-size: 15px;">
            <strong>Account Status:</strong> 
            ${expiresAt ? `Temporarily Suspended until ${new Date(expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : `Permanently Restricted`}
          </p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">If you believe this action was taken in error and would like to formally appeal this decision, please reach out to our support team.</p>
        <p style="color: #374151; font-size: 15px; margin: 0;">Sincerely,</p>
        <p style="color: #111827; font-size: 15px; font-weight: bold; margin: 4px 0 0 0;">The NexSyncHub Trust & Safety Team</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 24px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">This is an automated administrative message from NexSyncHub. Please do not reply directly to this email.</p>
      </div>
    `,

  });

}

export async function sendUnbanEmail({

  email,
  username,

}: {

  email: string;
  username?: string;

}) {

  await sendEmail({

    to: email,

    subject: "Account Update: NexSyncHub Access Restored",

    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #111827; margin: 0; font-size: 24px;">Account Access Restored</h2>
        </div>
        <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">Dear ${username || "User"},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">We are writing to confirm that full access to your NexSyncHub account has been successfully restored.</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">You may now log in and continue using all platform services without restriction. We appreciate your patience and cooperation throughout this process.</p>
        <p style="color: #374151; font-size: 15px; margin: 0;">Welcome back,</p>
        <p style="color: #111827; font-size: 15px; font-weight: bold; margin: 4px 0 0 0;">The NexSyncHub Team</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 24px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">This is an automated message from NexSyncHub. Please do not reply directly to this email.</p>
      </div>
    `,

  });

}