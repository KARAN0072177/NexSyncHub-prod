import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";
import SupportTicket from "@/models/SupportTicket";
import { s3 } from "@/lib/s3";

type SupportAttachment = {
    filename?: string;
    key?: string;
    url?: string;
    size?: number;
    mimeType?: string;
};

type SupportTicketRecord = {
    attachments?: SupportAttachment[];
    [key: string]: unknown;
};

async function signAttachments(
    attachments: SupportAttachment[] = []
) {
    return Promise.all(
        attachments.map(async (file) => {
            if (file.url || !file.key) {
                return file;
            }

            const command =
                new GetObjectCommand({
                    Bucket:
                        process.env.AWS_BUCKET_NAME!,
                    Key:
                        file.key,
                });

            return {
                ...file,
                url:
                    await getSignedUrl(
                        s3,
                        command,
                        {
                            expiresIn:
                                3600,
                        }
                    ),
            };
        })
    );
}

export async function GET() {
    try {
        await connectDB();

        const session =
            await requireAuth();

        const rawTickets =
            await SupportTicket.find({
                user:
                    session.user.id,
            })
                .populate(
                    "handledBy",
                    "username email avatar"
                )
                .sort({
                    createdAt:
                        -1,
                })
                .lean();

        const tickets =
            await Promise.all(
                (rawTickets as SupportTicketRecord[]).map(
                    async (ticket) => ({
                        ...ticket,
                        attachments:
                            await signAttachments(
                                ticket.attachments
                            ),
                    })
                )
            );

        return NextResponse.json({
            success:
                true,
            tickets,
        });
    } catch (error) {
        console.error(
            "USER SUPPORT TICKETS ERROR:",
            error
        );

        return handleApiError(error);
    }
}
