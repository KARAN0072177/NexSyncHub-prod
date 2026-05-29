import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { requireAdmin } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-error";
import { resend } from "@/lib/resend";
import SupportTicket from "@/models/SupportTicket";

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toHtmlParagraphs(value: string) {
    return escapeHtml(value)
        .split(/\n{2,}/)
        .map((paragraph) =>
            `<p style="margin:0 0 14px;line-height:1.7;">${paragraph.replace(/\n/g, "<br />")}</p>`
        )
        .join("");
}

export async function POST(req: Request) {
    try {
        await connectDB();

        const session =
            await requireAuth();

        await requireAdmin(
            session.user.id
        );

        const {
            ticketId,
            message,
        } = await req.json();

        const trimmedMessage =
            typeof message === "string"
                ? message.trim()
                : "";

        if (!ticketId || !trimmedMessage) {
            return NextResponse.json(
                {
                    error:
                        "Ticket ID and message are required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (trimmedMessage.length > 5000) {
            return NextResponse.json(
                {
                    error:
                        "Follow-up message must be 5000 characters or fewer.",
                },
                {
                    status: 400,
                }
            );
        }

        const ticket =
            await SupportTicket.findById(ticketId)
                .populate(
                    "user",
                    "username email avatar role"
                );

        if (!ticket) {
            return NextResponse.json(
                {
                    error:
                        "Ticket not found.",
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
                    error:
                        "This ticket does not have a user email address.",
                },
                {
                    status: 400,
                }
            );
        }

        await resend.emails.send({
            from:
                process.env.RESEND_FROM_EMAIL ||
                "NexSyncHub Support <support@karanart.com>",
            to:
                userEmail,
            subject:
                `More information needed: ${ticket.subject}`,
            html: `
                <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:28px;color:#111827;">
                    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                        <div style="padding:24px 28px;border-bottom:1px solid #eef2f7;">
                            <p style="margin:0 0 8px;color:#6C63FF;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">NexSyncHub Support</p>
                            <h1 style="margin:0;font-size:22px;line-height:1.35;color:#111827;">We need a little more information</h1>
                        </div>
                        <div style="padding:24px 28px;">
                            <p style="margin:0 0 16px;line-height:1.7;color:#374151;">Hi ${escapeHtml(ticket.user?.username || "there")},</p>
                            <p style="margin:0 0 18px;line-height:1.7;color:#374151;">Our support team reviewed your request and needs the following details before we can continue:</p>
                            <div style="margin:20px 0;padding:18px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;color:#111827;">
                                ${toHtmlParagraphs(trimmedMessage)}
                            </div>
                            <p style="margin:0 0 16px;line-height:1.7;color:#374151;"><strong>Ticket:</strong> ${escapeHtml(ticket.subject)}</p>
                            <p style="margin:0;line-height:1.7;color:#374151;">Please reply with the requested information so we can keep helping you.</p>
                        </div>
                        <div style="padding:18px 28px;background:#f9fafb;border-top:1px solid #eef2f7;">
                            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">This message was sent by the NexSyncHub support team regarding your existing support ticket.</p>
                        </div>
                    </div>
                </div>
            `,
        });

        await SupportTicket.updateOne(
            {
                _id:
                    ticket._id,
            },
            {
                $push: {
                    adminFollowUps: {
                        message:
                            trimmedMessage,
                        sentAt:
                            new Date(),
                        sentBy:
                            session.user.id,
                    },
                },
                $set: {
                    hasUnreadAdminReply: true,
                    ...(ticket.status === "open"
                        ? {
                            status:
                                "in_progress",
                        }
                        : {}),
                    handledBy:
                        session.user.id,
                },
            },
            {
                strict:
                    false,
            }
        );

        const updatedTicket =
            await SupportTicket.findById(ticket._id)
                .populate(
                    "user",
                    "username email avatar role"
                )
                .populate(
                    "handledBy",
                    "username email avatar"
                );

        const socketServerUrl =
            process.env.SOCKET_SERVER_URL ||
            process.env.NEXT_PUBLIC_SOCKET_URL;

        if (socketServerUrl) {
            try {
                await fetch(
                    `${socketServerUrl}/emit`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            channelId:
                                "admin_global",
                            event:
                                "support_ticket_updated",
                            data:
                                updatedTicket,
                        }),
                    }
                );
            } catch (error) {
                console.error(
                    "SUPPORT FOLLOW-UP REALTIME ERROR:",
                    error
                );
            }
        }

        return NextResponse.json({
            success:
                true,
            ticket:
                updatedTicket,
        });
    } catch (error) {
        console.error(
            "ADMIN SUPPORT FOLLOW-UP ERROR:",
            error
        );

        return handleApiError(error);
    }
}
