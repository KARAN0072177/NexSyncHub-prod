// Next.js API route for removing a member from a workspace (by owner/admin)

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import { createAuditLog } from "@/lib/audit";
import { createWorkspaceActivityMessage } from "@/lib/workspace-activity";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const { workspaceId, targetUserId } = await req.json();

    if (!workspaceId || !targetUserId) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    const current = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    }).populate("user"); // ✅ for username

    if (!current) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const target = await Membership.findOne({
      user: targetUserId,
      workspace: workspaceId,
    }).populate("user"); // ✅ for username

    if (!target) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    // 🔥 GET CHANNEL (IMPORTANT)
    // 🚨 RULES

    // =============================
    // OWNER → can remove anyone
    // =============================
    if (current.role === "OWNER") {

      await createAuditLog({

        workspaceId,

        actorId:
          session.user.id,

        action:
          "member_removed",

        targetType:
          "member",

        targetId:
          targetUserId,

        metadata: {

          removedByRole:
            current.role,

          targetRole:
            target.role,

          targetUsername:
            target.user.username,

        },

      });

      await target.deleteOne();

      const actionText = `${current.user.username} removed ${target.user.username} from the workspace`;

      // 🔥 CREATE SYSTEM MESSAGE
      await createWorkspaceActivityMessage({
        content: actionText,
        senderId: session.user.id,
        workspaceId,
      });

      // 🔥 EMIT SOCKET
      return NextResponse.json({ success: true });
    }

    // =============================
    // ADMIN → can remove only MEMBERS
    // =============================
    if (current.role === "ADMIN" && target.role === "MEMBER") {

      await createAuditLog({

        workspaceId,

        actorId:
          session.user.id,

        action:
          "member_removed",

        targetType:
          "member",

        targetId:
          targetUserId,

        metadata: {

          removedByRole:
            current.role,

          targetRole:
            target.role,

          targetUsername:
            target.user.username,

        },

      });

      await target.deleteOne();

      const actionText = `${current.user.username} removed ${target.user.username} from workspace`;

      await createWorkspaceActivityMessage({
        content: actionText,
        senderId: session.user.id,
        workspaceId,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Not allowed" },
      { status: 403 }
    );
  } catch (error) {
    console.error("REMOVE MEMBER ERROR:", error);

    return handleApiError(
      error
    );
  }
}
