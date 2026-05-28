// Next.js API route for updating a workspace details (name, description)

import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import Workspace from "@/models/Workspace";
import Membership from "@/models/Membership";

import { createAuditLog } from "@/lib/audit";
import { createWorkspaceActivityMessage } from "@/lib/workspace-activity";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(
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

        if (existingWorkspace?.name !== name.trim()) {
            await createWorkspaceActivityMessage({
                workspaceId,
                senderId: session.user.id,
                content: `${session.user.username} renamed workspace from ${existingWorkspace?.name || "Unknown"} to ${name.trim()}`,
            });
        } else if ((existingWorkspace as any)?.description !== (description?.trim() || "")) {
            await createWorkspaceActivityMessage({
                workspaceId,
                senderId: session.user.id,
                content: `${session.user.username} updated workspace settings`,
            });
        }

        return NextResponse.json({

            success: true,

            workspace,

        });

    } catch (error) {

        console.error(
            "WORKSPACE UPDATE ERROR:",
            error
        );

        return handleApiError(
            error
        );
    }

}
