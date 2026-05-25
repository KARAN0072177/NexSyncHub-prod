// src/app/api/support/create/route.ts

import { NextResponse }
    from "next/server";

import { getServerSession }
    from "next-auth";

import {
    PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
    authOptions,
} from "@/lib/auth-options";

import {
    connectDB,
} from "@/lib/db";

import {
    s3,
} from "@/lib/s3";

import { resend }
    from "@/lib/resend";

import SupportTicket
    from "@/models/SupportTicket";

import {
    moderateImage,
} from "@/lib/moderation";

import {
    createSecurityLog,
} from "@/lib/security";

import { requireAuth } from "@/lib/auth-guard";

export async function POST(
    req: Request
) {

    try {

        await connectDB();

        // 🔐 Session
        const session =
            await requireAuth();

        // 🔥 Parse form data
        const formData =
            await req.formData();

        const category =
            formData.get(
                "category"
            ) as string;

        const subject =
            formData.get(
                "subject"
            ) as string;

        const message =
            formData.get(
                "message"
            ) as string;

        const files =
            formData.getAll(
                "attachments"
            ) as File[];

        // 🔥 Validate
        if (
            !category ||
            !subject?.trim() ||
            !message?.trim()
        ) {

            return NextResponse.json(
                {
                    error:
                        "All fields are required",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Allowed categories
        const allowedCategories = [

            "general",

            "bug_report",

            "feedback",

            "feature_request",

            "workspace_report",

            "account_support",

            "billing",

            "other",

        ];

        if (
            !allowedCategories.includes(
                category
            )
        ) {

            return NextResponse.json(
                {
                    error:
                        "Invalid category",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Validate attachment types
        const allowedTypes = [

            "image/jpeg",
            "image/png",
            "image/webp",

            "application/pdf",

            "text/plain",

            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        ];

        // 🔥 Upload attachments
        const uploadedAttachments =
            [];

        for (
            const file of files
        ) {

            if (
                !(file instanceof File)
            ) continue;

            // ❌ Type check
            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                return NextResponse.json(
                    {
                        error:
                            `Unsupported file type: ${file.name}`,
                    },
                    {
                        status: 400,
                    }
                );

            }

            // ❌ Size limit
            const MAX_SIZE =
                10 * 1024 * 1024;

            if (
                file.size > MAX_SIZE
            ) {

                return NextResponse.json(
                    {
                        error:
                            `${file.name} exceeds 10MB limit`,
                    },
                    {
                        status: 400,
                    }
                );

            }

            // 🔥 Convert buffer
            const bytes =
                await file.arrayBuffer();

            const buffer =
                Buffer.from(bytes);

            // 🔥 Moderate support images
            if (
                file.type.startsWith(
                    "image/"
                )
            ) {

                const moderation =
                    await moderateImage(
                        buffer
                    );

                // ❌ Unsafe image
                if (!moderation.safe) {

                    // 🔥 Request info
                    const ip =
                        req.headers.get(
                            "x-forwarded-for"
                        ) || "Unknown IP";

                    const userAgent =
                        req.headers.get(
                            "user-agent"
                        ) || "Unknown Device";

                    // 🔥 Create security log
                    const securityLog =
                        await createSecurityLog({

                            userId:
                                session.user.id,

                            action:
                                "unsafe_support_attachment",

                            metadata: {

                                filename:
                                    file.name,

                                size:
                                    file.size,

                                contentType:
                                    file.type,

                                moderationLabels:

                                    moderation.labels

                                        .filter(
                                            (label: any) =>

                                                label.Confidence >= 70
                                        )

                                        .map(
                                            (label: any) => ({

                                                name:
                                                    label.Name,

                                                confidence:
                                                    label.Confidence,

                                                parentName:
                                                    label.ParentName,

                                            })
                                        ),

                                ip,
                                userAgent,

                            },

                        });

                    // 🔥 Emit realtime event
                    await fetch(
                        "http://localhost:4000/emit",
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
                                        "admin_security_log_created",

                                    data:
                                        securityLog,

                                }),

                        }
                    );

                    return NextResponse.json(

                        {

                            error:

                                "Support attachments must only contain relevant screenshots or documents.",

                        },

                        {

                            status: 400,

                        }

                    );

                }

            }

            // 🔥 Generate key
            const extension =
                file.name
                    .split(".")
                    .pop();

            const key =
                `support-attachments/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

            // 🔥 Upload to S3
            await s3.send(
                new PutObjectCommand({

                    Bucket:
                        process.env
                            .AWS_BUCKET_NAME!,

                    Key:
                        key,

                    Body:
                        buffer,

                    ContentType:
                        file.type,

                })
            );

            // Private URL (can be used to generate presigned URLs later)

            uploadedAttachments.push({

                filename:
                    file.name,

                key,

                size:
                    file.size,

                mimeType:
                    file.type,

            });

        }

        // 🔥 Create ticket
        const ticket =
            await SupportTicket.create({

                user:
                    session.user.id,

                category,

                subject:
                    subject.trim(),

                message:
                    message.trim(),

                attachments:
                    uploadedAttachments,

            });

        // 🔥 Send admin email
        await resend.emails.send({

            from:
                "NexSyncHub Support <support@karanart.com>",

            to:
                process.env
                    .SUPPORT_EMAIL!,

            subject:
                `New Support Ticket - ${subject}`,

            html: `

        <div style="font-family: Arial, sans-serif; padding: 24px;">

          <h2>
            New Support Ticket
          </h2>

          <p>
            <strong>Category:</strong>
            ${category}
          </p>

          <p>
            <strong>Subject:</strong>
            ${subject}
          </p>

          <p>
            <strong>Message:</strong>
          </p>

          <div style="padding:16px;background:#f5f5f5;border-radius:8px;">
            ${message}
          </div>

        </div>

      `,

        });

        // 🔥 Confirmation email
        await resend.emails.send({

            from:
                "NexSyncHub <noreply@karanart.com>",

            to:
                session.user.email!,

            subject:
                "We received your support request",

            html: `

        <div style="font-family: Arial, sans-serif; padding: 24px;">

          <h2>
            Support Request Received
          </h2>

          <p>
            Thanks for contacting NexSyncHub support.
          </p>

          <p>
            Our team has received your request and will review it shortly.
          </p>

          <p>
            <strong>Subject:</strong>
            ${subject}
          </p>

        </div>

      `,

        });

        // 🔥 Emit realtime support ticket
        await fetch(
            "http://localhost:4000/emit",
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
                            "support_ticket_created",

                        data:
                            ticket,

                    }),

            }
        );

        return NextResponse.json({

            success: true,

            ticketId:
                ticket._id,

        });

    } catch (error) {

        console.error(
            "SUPPORT CREATE ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Something went wrong",
            },
            {
                status: 500,
            }
        );

    }

}