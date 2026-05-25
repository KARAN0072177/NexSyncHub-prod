// Next.js API route for joining a workspace (public only)

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import Workspace from "@/models/Workspace";

import { createAuditLog } from "@/lib/audit";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const workspace = await Workspace.findById(workspaceId);

    // ❗ Only allow PUBLIC
    if (!workspace || workspace.isPrivate) {
      return NextResponse.json(
        { error: "Workspace not joinable" },
        { status: 400 }
      );
    }

    // 🔁 Already joined?
    const existing = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already joined",
      });
    }

    // ✅ Join
    const membership =
      await Membership.create({
        user: session.user.id,
        workspace: workspaceId,
        role: "MEMBER",
      });

    await createAuditLog({

      workspaceId,

      actorId:
        session.user.id,

      action:
        "member_joined",

      targetType:
        "member",

      targetId:
        session.user.id,

      metadata: {

        role:
          membership.role,

      },

    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("JOIN WORKSPACE ERROR:", error);

    return handleApiError(
      error
    );
  }
}