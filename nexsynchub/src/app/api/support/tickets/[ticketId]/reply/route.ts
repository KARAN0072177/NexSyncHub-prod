import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
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

export async function POST(
    req: NextRequest,
    context: {
        params: Promise<{
            ticketId: string;
        }>;
    }
) {
    try {
        await connectDB();

        const session =
            await requireAuth();

        const {
            ticketId,
        } = await context.params;

        const {
            message,
        } = await req.json();

        const trimmedMessage =
            typeof message === "string"
                ? message.trim()
                : "";

        if (!trimmedMessage) {
            return NextResponse.json(
                {
                    error:
                        "Reply message is required.",
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
                        "Reply must be 5000 characters or fewer.",
                },
                {
                    status: 400,
                }
            );
        }

        const ticket =
            await SupportTicket.findOne({
                _id:
                    ticketId,
                user:
                    session.user.id,
            });

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

        await SupportTicket.updateOne(
            {
                _id:
                    ticket._id,
            },
            {
                $push: {
                    userReplies: {
                        message:
                            trimmedMessage,
                        sentAt:
                            new Date(),
                    },
                },
                $set: {
                    status:
                        "in_progress",
                },
            },
            {
                strict:
                    false,
            }
        );

        if (process.env.SUPPORT_EMAIL) {
            await resend.emails.send({
                from:
                    process.env.RESEND_FROM_EMAIL ||
                    "NexSyncHub <noreply@karanart.com>",
                to:
                    process.env.SUPPORT_EMAIL,
                subject:
                    `User replied to support ticket: ${ticket.subject}`,
                html: `
                    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:28px;color:#111827;">
                        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                            <div style="padding:24px 28px;border-bottom:1px solid #eef2f7;">
                                <p style="margin:0 0 8px;color:#6C63FF;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">NexSyncHub Support</p>
                                <h1 style="margin:0;font-size:22px;line-height:1.35;">User reply received</h1>
                            </div>
                            <div style="padding:24px 28px;">
                                <p style="margin:0 0 12px;line-height:1.7;"><strong>Ticket:</strong> ${escapeHtml(ticket.subject)}</p>
                                <p style="margin:0 0 18px;line-height:1.7;"><strong>User:</strong> ${escapeHtml(session.user.email || "Unknown")}</p>
                                <div style="margin:20px 0;padding:18px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                                    ${toHtmlParagraphs(trimmedMessage)}
                                </div>
                            </div>
                        </div>
                    </div>
                `,
            });
        }

        const updatedTicket =
            await SupportTicket.findById(ticket._id)
                .populate(
                    "handledBy",
                    "username email avatar"
                )
                .lean();

        const socketServerUrl =
            process.env.SOCKET_SERVER_URL ||
            process.env.NEXT_PUBLIC_SOCKET_URL;

        if (socketServerUrl) {
            try {
                await fetch(
                    `${socketServerUrl}/emit`,
                    {
                        method:
                            "POST",
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
                                    updatedTicket,
                            }),
                    }
                );
            } catch (error) {
                console.error(
                    "USER SUPPORT REPLY REALTIME ERROR:",
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
            "USER SUPPORT REPLY ERROR:",
            error
        );

        return handleApiError(error);
    }
}
