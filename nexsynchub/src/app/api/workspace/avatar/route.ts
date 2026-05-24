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

import Workspace
    from "@/models/Workspace";

import Membership
    from "@/models/Membership";

export async function POST(
    req: Request
) {

    try {

        await connectDB();

        // 🔐 Session
        const session =
            await getServerSession(
                authOptions
            );

        if (!session?.user?.id) {

            return NextResponse.json(
                {
                    error:
                        "Unauthorized",
                },
                {
                    status: 401,
                }
            );

        }

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