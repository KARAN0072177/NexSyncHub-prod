import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import Workspace from "@/models/Workspace";

import Membership from "@/models/Membership";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
    }>;
  }
) {
  try {

    await connectDB();

    const session =
      await requireAuth();

    const { workspaceId } =
      await params;

    // 🔥 Check membership
    const membership =
      await Membership.findOne({
        workspace: workspaceId,
        user: session.user.id,
      });

    if (!membership) {
      return NextResponse.json(
        {
          error: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    // 🔥 Get workspace
    const workspace =
      await Workspace.findById(
        workspaceId
      ).lean();

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

    return NextResponse.json({
      workspace,
      role: membership.role,
    });

  } catch (error) {

    console.error(
      "GET WORKSPACE ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }
}