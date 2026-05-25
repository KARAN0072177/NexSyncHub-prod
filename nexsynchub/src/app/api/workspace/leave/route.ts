// Next.js API route for leaving a workspace (only for non-owners)

import { NextResponse } from "next/server";

import { connectDB }
    from "@/lib/db";

import Membership
    from "@/models/Membership";

import { createAuditLog } from "@/lib/audit";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(
    req: Request
) {

    try {

        await connectDB();

        // 🔐 Session
        const session =
            await requireAuth();

        // 🔥 Body
        const body =
            await req.json();

        const {
            workspaceId,
        } = body;

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

        // 🔐 Membership check
        const membership =
            await Membership.findOne({

                user: session.user.id,

                workspace: workspaceId,

            });

        if (!membership) {

            return NextResponse.json(
                {
                    error:
                        "Membership not found",
                },
                {
                    status: 404,
                }
            );

        }

        // ❌ Owner cannot leave

        // 🔥 Normalize role
        const role =
            membership.role.toLowerCase();

        // ❌ Owner cannot leave
        if (
            role === "owner"
        ) {

            return NextResponse.json(
                {
                    error:
                        "Transfer ownership before leaving workspace",
                },
                {
                    status: 403,
                }
            );

        }

        await createAuditLog({

            workspaceId,

            actorId:
                session.user.id,

            action:
                "member_left",

            targetType:
                "member",

            targetId:
                session.user.id,

            metadata: {

                role:
                    membership.role,

            },

        });

        // 🔥 Remove membership
        await Membership.findByIdAndDelete(
            membership._id
        );

        return NextResponse.json({

            success: true,

            message:
                "Left workspace successfully",

        });

    } catch (error) {

        console.error(
            "LEAVE WORKSPACE ERROR:",
            error
        );

        return handleApiError(
            error
        );
    }

}