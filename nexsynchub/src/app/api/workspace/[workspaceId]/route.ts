import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import Workspace from "@/models/Workspace";

import Membership from "@/models/Membership";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";

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
      await getServerSession(authOptions);

    if (
      !session ||
      !session.user?.id
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

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
    });

  } catch (error) {

    console.error(
      "GET WORKSPACE ERROR:",
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