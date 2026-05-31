import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { requireSuperAdmin } from "@/lib/super-admin";
import { handleApiError } from "@/lib/api-error";
import { resend } from "@/lib/resend";
import SecurityLog from "@/models/SecurityLog";

const rejectionReasonLabels: Record<string, string> = {
  explicit_content: "Explicit or adult content",
  violent_or_graphic: "Violent, graphic, or disturbing content",
  harassment_or_hate: "Harassment, hateful, or abusive material",
  privacy_or_identity: "Privacy, identity, or impersonation concern",
  platform_policy: "Does not meet NexSyncHub community safety standards",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getMediaTypeLabel(action: string) {
  const labels: Record<string, string> = {
    unsafe_avatar_upload: "profile avatar",
    unsafe_workspace_avatar_upload: "workspace profile image",
    unsafe_support_attachment: "support attachment",
    unsafe_chat_attachment: "chat attachment",
  };

  return labels[action] || "uploaded media";
}

function getApprovedEmailHtml({
  username,
  mediaType,
}: {
  username?: string;
  mediaType: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
          <div style="padding:26px 30px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f0fdf4 0%,#ffffff 72%);">
            <p style="margin:0 0 10px;color:#10b981;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">NexSyncHub Trust & Safety</p>
            <h1 style="margin:0;color:#111827;font-size:24px;line-height:1.35;">Media review approved</h1>
            <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:1.7;">Hi ${escapeHtml(username || "there")}, your ${escapeHtml(mediaType)} has been reviewed and approved.</p>
          </div>
          <div style="padding:26px 30px;">
            <div style="margin:0 0 22px;padding:16px 18px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;">
              <p style="margin:0;color:#047857;font-size:15px;line-height:1.7;">No further action is needed. You can continue using NexSyncHub normally.</p>
            </div>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;">Automated safety checks sometimes flag media for human review. Thanks for your patience while our team checked it.</p>
          </div>
          <div style="padding:18px 30px;background:#f9fafb;border-top:1px solid #eef2f7;">
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">This message was sent by the NexSyncHub Trust & Safety team.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getRejectedEmailHtml({
  username,
  mediaType,
  reasons,
}: {
  username?: string;
  mediaType: string;
  reasons: string[];
}) {
  const reasonList =
    reasons.length > 0
      ? reasons
        .map((reason) => `
          <li style="margin:0 0 8px;line-height:1.65;color:#7f1d1d;">
            ${escapeHtml(reason)}
          </li>
        `)
        .join("")
      : `
          <li style="margin:0;line-height:1.65;color:#7f1d1d;">
            The media did not meet NexSyncHub community safety standards.
          </li>
        `;

  return `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
          <div style="padding:26px 30px;border-bottom:1px solid #fee2e2;background:linear-gradient(135deg,#fff1f2 0%,#ffffff 72%);">
            <p style="margin:0 0 10px;color:#e11d48;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">NexSyncHub Trust & Safety</p>
            <h1 style="margin:0;color:#111827;font-size:24px;line-height:1.35;">Media review not approved</h1>
            <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:1.7;">Hi ${escapeHtml(username || "there")}, our team reviewed your ${escapeHtml(mediaType)} and could not approve it.</p>
          </div>
          <div style="padding:26px 30px;">
            <div style="margin:0 0 22px;padding:18px 20px;background:#fef2f2;border:1px solid #fecdd3;border-radius:14px;">
              <p style="margin:0 0 10px;color:#991b1b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Reason for rejection</p>
              <ul style="margin:0;padding-left:20px;">
                ${reasonList}
              </ul>
            </div>
            <p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.7;">Please upload a different image or attachment that follows platform safety rules.</p>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;">If you believe this decision was made in error, contact support with the details of your upload.</p>
          </div>
          <div style="padding:18px 30px;background:#f9fafb;border-top:1px solid #eef2f7;">
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">This message was sent by the NexSyncHub Trust & Safety team.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function POST(
  req: Request,
  context: {
    params: Promise<{
      logId: string;
    }>;
  }
) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    await requireSuperAdmin(
      session.user.id
    );

    const { logId } =
      await context.params;

    const {
      decision,
      rejectionReasons = [],
    } = await req.json();

    if (
      decision !== "approved" &&
      decision !== "rejected"
    ) {
      return NextResponse.json(
        {
          error: "Decision must be approved or rejected.",
        },
        {
          status: 400,
        }
      );
    }

    const ticket =
      await SecurityLog.findById(logId)
        .populate(
          "user",
          "username email"
        );

    if (!ticket) {
      return NextResponse.json(
        {
          error: "Unsafe media record not found.",
        },
        {
          status: 404,
        }
      );
    }

    const userEmail =
      ticket.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        {
          error: "This media record does not have a user email.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedReasons =
      Array.isArray(rejectionReasons)
        ? rejectionReasons
          .filter((reason) => typeof reason === "string")
          .map((reason) => rejectionReasonLabels[reason] || reason)
        : [];

    const mediaType =
      getMediaTypeLabel(ticket.action);

    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "NexSyncHub Trust & Safety <support@karanart.com>",
      to:
        userEmail,
      subject:
        decision === "approved"
          ? "Your NexSyncHub media review was approved"
          : "Your NexSyncHub media review was not approved",
      html:
        decision === "approved"
          ? getApprovedEmailHtml({
            username:
              ticket.user?.username,
            mediaType,
          })
          : getRejectedEmailHtml({
            username:
              ticket.user?.username,
            mediaType,
            reasons:
              selectedReasons,
          }),
    });

    await SecurityLog.findByIdAndUpdate(
      logId,
      {
        $set: {
          "metadata.reviewNotice": {
            decision,
            rejectionReasons:
              decision === "rejected"
                ? selectedReasons
                : [],
            sentAt:
              new Date(),
            sentBy:
              session.user.id,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Moderation email sent.",
    });
  } catch (error) {
    console.error(
      "UNSAFE MEDIA NOTIFY ERROR:",
      error
    );

    return handleApiError(error);
  }
}
