import { NextResponse }
    from "next/server";

import {
    PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
    connectDB,
} from "@/lib/db";

import {
    s3,
} from "@/lib/s3";

import Workspace
    from "@/models/Workspace";

import Membership
    from "@/models/Membership";

import {
    moderateImage,
} from "@/lib/moderation";

import {
    createSecurityLog,
} from "@/lib/security";
import { uploadModerationEvidence } from "@/lib/upload-moderation-evidence";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

type ModerationLabel = {
    Name?: string;
    Confidence?: number;
    ParentName?: string;
};

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

        const file =
            formData.get(
                "avatar"
            ) as File;

        const workspaceId =
            formData.get(
                "workspaceId"
            ) as string;

        // 🔥 Validate workspace
        if (!workspaceId) {

            return NextResponse.json(
                {
                    error:
                        "Workspace ID required",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Validate file
        if (!file) {

            return NextResponse.json(
                {
                    error:
                        "No image uploaded",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔐 Permission check
        const membership =
            await Membership.findOne({

                user:
                    session.user.id,

                workspace:
                    workspaceId,

            });

        if (!membership) {

            return NextResponse.json(
                {
                    error:
                        "Access denied",
                },
                {
                    status: 403,
                }
            );

        }

        // 🔥 Normalize role
        const role =
            membership.role
                .toLowerCase();

        // ❌ Only owner/admin
        const allowedRoles = [
            "owner",
            "admin",
        ];

        if (
            !allowedRoles.includes(
                role
            )
        ) {

            return NextResponse.json(
                {
                    error:
                        "Insufficient permissions",
                },
                {
                    status: 403,
                }
            );

        }

        // 🔥 Validate type
        const allowedTypes = [

            "image/jpeg",
            "image/png",
            "image/webp",

        ];

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            return NextResponse.json(
                {
                    error:
                        "Only JPG, PNG, and WEBP allowed",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Validate size
        const MAX_SIZE =
            5 * 1024 * 1024;

        if (
            file.size > MAX_SIZE
        ) {

            return NextResponse.json(
                {
                    error:
                        "Image must be under 5MB",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Convert to buffer
        const bytes =
            await file.arrayBuffer();

        const buffer =
            Buffer.from(bytes);

        // 🔥 Moderate image
        const moderation =
            await moderateImage(
                buffer
            );

        // ❌ Unsafe image
        if (!moderation.safe) {

            const evidence =
                await uploadModerationEvidence({
                    buffer,
                    fileName:
                        file.name,
                    contentType:
                        file.type,
                });

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
            await createSecurityLog({

                    userId:
                        session.user.id,

                    action:
                        "unsafe_workspace_avatar_upload",

                    metadata: {

                        workspaceId,

                        filename:
                            file.name,

                        size:
                            file.size,

                        contentType:
                            file.type,

                        moderationLabels:

                            moderation.labels

                                .filter(
                                    (label: ModerationLabel) =>

                                        (label.Confidence ?? 0) >= 70
                                )

                                .map(
                                    (label: ModerationLabel) => ({

                                        name:
                                            label.Name,

                                        confidence:
                                            label.Confidence ?? 0,

                                        parentName:
                                            label.ParentName,

                                    })
                                ),

                        ip,
                        userAgent,

                        evidenceUrl:
                            evidence.url,

                        evidenceKey:
                            evidence.key,

                        evidenceExpiresAt:
                            new Date(
                                Date.now() +
                                1000 * 60 * 60 * 24 * 30
                            ),

                    },

                });

            return NextResponse.json(

                {

                    error:

                        "This image violates community guidelines.",

                },

                {

                    status: 400,

                }

            );

        }

        // 🔥 Generate key
        const extension =
            file.name
                .split(".")
                .pop();

        const key =
            `workspace-avatars/${workspaceId}/logo-${Date.now()}.${extension}`;

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

        // 🔥 Public URL
        const avatarUrl =
            `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // 🔥 Save workspace
        const workspace =
            await Workspace.findByIdAndUpdate(

                workspaceId,

                {
                    $set: {
                        avatar: avatarUrl,
                    },
                },

                {
                    new: true,
                    runValidators: true,
                }

            );

        if (!workspace) {

            return NextResponse.json(
                {
                    error: "Workspace not found",
                },
                {
                    status: 404,
                }
            );

        }

        console.log(
            "UPDATED WORKSPACE:",
            workspace
        );

        return NextResponse.json({

            success: true,

            avatar:
                workspace?.avatar,

        });

    } catch (error) {

        console.error(
            "WORKSPACE AVATAR ERROR:",
            error
        );

        return handleApiError(
            error
        );
    }

}
