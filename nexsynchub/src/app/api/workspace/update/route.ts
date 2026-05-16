// Next.js API route for updating a workspace details (name, description)

import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";

import Workspace from "@/models/Workspace";
import Membership from "@/models/Membership";

import { createAuditLog } from "@/lib/audit";

export async function PATCH(
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
                    error: "Unauthorized",
                },
                {
                    status: 401,
                }
            );

        }

        // 🔥 Body
        const body =
            await req.json();

        const {
            workspaceId,
            name,
            description,
        } = body;

        // 🔥 Validate
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

        if (!name?.trim()) {

            return NextResponse.json(
                {
                    error:
                        "Workspace name required",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔐 Permission check
        const membership =
            await Membership.findOne({

                user: session.user.id,

                workspace: workspaceId,

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

        // ❌ Only owner/admin
        // 🔥 Normalize role
        const role =
            membership.role.toLowerCase();

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

        // 🔥 Audit log

        const existingWorkspace =
            await Workspace.findById(
                workspaceId
            );

        // 🔥 Update workspace
        const workspace =
            await Workspace.findByIdAndUpdate(

                workspaceId,

                {
                    name: name.trim(),

                    description:
                        description?.trim() || "",
                },

                {
                    new: true,
                }
            );

        await createAuditLog({

            workspaceId,

            actorId:
                session.user.id,

            action:
                "workspace_renamed",

            targetType:
                "workspace",

            targetId:
                workspaceId,

            metadata: {

                oldName:
                    existingWorkspace?.name,

                newName:
                    name.trim(),

                    workspaceName: name.trim(),

            },

        });

        return NextResponse.json({

            success: true,

            workspace,

        });

    } catch (error) {

        console.error(
            "WORKSPACE UPDATE ERROR:",
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