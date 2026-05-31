// src/app/api/admin/support/update/route.ts

import { NextResponse }
    from "next/server";

import { requireAuth } from "@/lib/auth-guard";

import {
    connectDB,
} from "@/lib/db";

import {
    requireAdmin,
} from "@/lib/permissions";

import SupportTicket
    from "@/models/SupportTicket";

import { resend }
    from "@/lib/resend";
import { handleApiError } from "@/lib/api-error";
import { createSupportTicketNotification } from "@/lib/support-ticket-notifications";

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatInlineSupportText(value: string) {
    return escapeHtml(value)
        .replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        );
}

function formatSupportMessage(value: string) {
    const normalized =
        value
            .trim()
            .replace(/\r\n/g, "\n")
            .replace(/\s+\*\*([^*]+):\*\*/g, "\n\n**$1:**")
            .replace(/\s+(\d+\.\s+)/g, "\n$1")
            .replace(/\s+-\s+/g, "\n- ");

    return normalized
        .split(/\n{2,}/)
        .map((block) => {
            const lines =
                block
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean);

            if (!lines.length) {
                return "";
            }

            if (
                lines.every((line) =>
                    /^\d+\.\s+/.test(line)
                )
            ) {
                return `
                    <ol style="margin:10px 0 0 22px;padding:0;color:#374151;">
                        ${lines
                            .map((line) => `
                                <li style="margin:0 0 8px;line-height:1.7;">
                                    ${formatInlineSupportText(
                                        line.replace(/^\d+\.\s+/, "")
                                    )}
                                </li>
                            `)
                            .join("")}
                    </ol>
                `;
            }

            if (
                lines.every((line) =>
                    /^-\s+/.test(line)
                )
            ) {
                return `
                    <ul style="margin:10px 0 0 22px;padding:0;color:#374151;">
                        ${lines
                            .map((line) => `
                                <li style="margin:0 0 8px;line-height:1.7;">
                                    ${formatInlineSupportText(
                                        line.replace(/^-\s+/, "")
                                    )}
                                </li>
                            `)
                            .join("")}
                    </ul>
                `;
            }

            return `
                <p style="margin:0 0 14px;line-height:1.75;color:#374151;">
                    ${formatInlineSupportText(lines.join("\n")).replace(/\n/g, "<br />")}
                </p>
            `;
        })
        .join("");
}

export async function PATCH(
    req: Request
) {

    try {

        await connectDB();

        // 🔐 Session
        const session =
            await requireAuth();

        // 🔐 Admin check
        await requireAdmin(
            session.user.id
        );

        // 🔥 Parse body
        const body =
            await req.json();

        const {

            ticketId,

            status,

            adminNotes,

            resolutionMessage,

        } = body;

        // ❌ Validate
        if (!ticketId) {

            return NextResponse.json(
                {
                    error:
                        "Ticket ID required",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Allowed statuses
        const allowedStatuses = [

            "open",

            "in_progress",

            "resolved",

            "closed",

        ];

        if (
            status &&
            !allowedStatuses.includes(
                status
            )
        ) {

            return NextResponse.json(
                {
                    error:
                        "Invalid status",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Existing ticket
        const existingTicket =
            await SupportTicket.findById(
                ticketId
            )

                .populate(
                    "user",
                    "username email"
                );

        if (!existingTicket) {

            return NextResponse.json(
                {
                    error:
                        "Ticket not found",
                },
                {
                    status: 404,
                }
            );

        }

        const oldStatus =
            existingTicket.status;

        // 🔥 Update ticket
        const ticket =
            await SupportTicket.findByIdAndUpdate(

                ticketId,

                {

                    ...(status && {
                        status,
                    }),

                    ...(adminNotes !== undefined && {

                        adminNotes,

                    }),

                    ...(resolutionMessage !== undefined && {

                        resolutionMessage,

                    }),

                    handledBy:
                        session.user.id,

                },

                {
                    new: true,
                }

            )

                .populate(

                    "user",

                    "username email avatar role"

                )

                .populate(

                    "handledBy",

                    "username email avatar"

                );

        // 🔥 Send user email
        const userEmail =
            existingTicket.user?.email;

        const userId =
            existingTicket.user?._id?.toString() ||
            existingTicket.user?.toString();

        if (userEmail) {

            // 🔥 IN PROGRESS
            if (

                oldStatus !==
                "in_progress"

                &&

                status ===
                "in_progress"

            ) {

                await resend.emails.send({

                    from:
                        "NexSyncHub Support <support@karanart.com>",

                    to:
                        userEmail,

                    subject:
                        "Your support request is being reviewed",

                    html: `

            <div style="font-family: Arial, sans-serif; padding: 24px;">

              <h2>
                Support Request Update
              </h2>

              <p>
                Our support team is now reviewing your request.
              </p>

              <p>
                <strong>Subject:</strong>
                ${existingTicket.subject}
              </p>

              <p>
                We may contact you if additional information is needed.
              </p>

            </div>

          `,

                });

            }

            // 🔥 RESOLVED
            if (

                oldStatus !==
                "resolved"

                &&

                status ===
                "resolved"

            ) {

                await resend.emails.send({

                    from:
                        "NexSyncHub Support <support@karanart.com>",

                    to:
                        userEmail,

                    subject:
                        "Your support request has been resolved",

                    html: `
            <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
              <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
                <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
                  <div style="padding:26px 30px;border-bottom:1px solid #eef2f7;background:linear-gradient(135deg,#f8fbff 0%,#ffffff 70%);">
                    <p style="margin:0 0 10px;color:#6C63FF;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                      NexSyncHub Support
                    </p>
                    <h1 style="margin:0;color:#111827;font-size:24px;line-height:1.35;">
                      Support request resolved
                    </h1>
                    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:1.7;">
                      Your support request has been marked as resolved.
                    </p>
                  </div>

                  <div style="padding:26px 30px;">
                    <div style="margin:0 0 22px;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                      <p style="margin:0;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">
                        Ticket subject
                      </p>
                      <p style="margin:6px 0 0;color:#111827;font-size:15px;line-height:1.6;">
                        ${escapeHtml(existingTicket.subject)}
                      </p>
                    </div>

                    ${resolutionMessage ? `
                      <div style="margin-top:16px;padding:20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;">
                        <p style="margin:0 0 14px;color:#111827;font-size:15px;font-weight:700;">
                          Resolution message
                        </p>
                        <div style="font-size:15px;">
                          ${formatSupportMessage(resolutionMessage)}
                        </div>
                      </div>
                    ` : ""}

                    <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.7;">
                      If you still need help, you can reply from your ticket page in NexSyncHub.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `,

                });

            }

            // 🔥 CLOSED
            if (

                oldStatus !==
                "closed"

                &&

                status ===
                "closed"

            ) {

                await resend.emails.send({

                    from:
                        "NexSyncHub Support <support@karanart.com>",

                    to:
                        userEmail,

                    subject:
                        "Your support request has been closed",

                    html: `

            <div style="font-family: Arial, sans-serif; padding: 24px;">

              <h2>
                Support Ticket Closed
              </h2>

              <p>
                Your support ticket has now been closed.
              </p>

              <p>
                <strong>Subject:</strong>
                ${existingTicket.subject}
              </p>

              <p>
                Thank you for contacting NexSyncHub support.
              </p>

            </div>

          `,

                });

            }

        }

        if (
            userId &&
            status &&
            oldStatus !== status
        ) {
            await createSupportTicketNotification({
                userId,
                ticketId:
                    ticketId.toString(),
                subject:
                    existingTicket.subject,
                kind:
                    "status_update",
                status,
            });
        }

        // 🔥 Emit realtime ticket update
        const socketUrl = process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        await fetch(
            `${socketUrl}/emit`,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                },

                body:
                    JSON.stringify({

                        channelId:
                            "admin_global",

                        event:
                            "support_ticket_updated",

                        data:
                            ticket,

                    }),

            }
        );
        
        // Emit to specific user
        await fetch(
            `${socketUrl}/emit`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    channelId: ticket?.user?._id?.toString() || ticket?.user?.toString(),
                    event: "support_ticket_updated",
                    data: ticket,
                }),
            }
        );

        return NextResponse.json({

            success: true,

            ticket,

        });

    } catch (error) {

        console.error(
            "ADMIN SUPPORT UPDATE ERROR:",
            error
        );

        return handleApiError(
            error
        );
    }

}
