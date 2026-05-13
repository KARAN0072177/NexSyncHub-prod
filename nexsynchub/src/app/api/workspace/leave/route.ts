import { NextResponse } from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { connectDB }
  from "@/lib/db";

import Membership
  from "@/models/Membership";

export async function DELETE(
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
    if (
      membership.role === "owner"
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