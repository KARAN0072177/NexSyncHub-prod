// src/app/api/admin/security/moderation/route.ts

import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { connectDB }
  from "@/lib/db";

import SecurityLog
  from "@/models/SecurityLog";

import {
  requireAdmin,
} from "@/lib/permissions";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await getServerSession(
        authOptions
      );

    if (
      !session?.user?.id
    ) {

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

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Fetch moderation events
    const logs =
      await SecurityLog.find({

        action: {

          $in: [

            "unsafe_avatar_upload",

            "unsafe_workspace_name",

            "unsafe_workspace_avatar_upload",

            "unsafe_support_attachment",

            "unsafe_chat_attachment",

          ],

        },

      })

        .populate(
          "user",
          "username email avatar role"
        )

        .sort({
          createdAt: -1,
        })

        .limit(100)

        .lean();

    return NextResponse.json({

      success: true,

      logs,

    });

  } catch (error) {

    console.error(
      "MODERATION LOGS ERROR:",
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