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

import { requireAuth } from "@/lib/auth-guard";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await requireAuth();

    await requireAdmin(
      session.user.id
    );

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Fetch auth logs
    const logs =
      await SecurityLog.find({

        action: {

          $in: [

            "auth_login",

            "auth_login_failed",

            "auth_register",

            "auth_logout",

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
      "AUTH LOGS ERROR:",
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