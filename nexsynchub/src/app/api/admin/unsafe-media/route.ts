import {
  NextResponse,
} from "next/server";

import {
  connectDB,
} from "@/lib/db";

import {
  requireAuth,
} from "@/lib/auth-guard";

import {
  requireSuperAdmin,
} from "@/lib/super-admin";

import {
  handleApiError,
} from "@/lib/api-error";

import SecurityLog
  from "@/models/SecurityLog";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Auth
    const session =
      await requireAuth();

    // 🔐 Super admin only
    await requireSuperAdmin(
      session.user.id
    );

    // 🔥 Fetch unsafe logs
    const logs =
      await SecurityLog.find({

        action: {

          $in: [

            "unsafe_avatar_upload",

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

        .lean();

    return NextResponse.json({

      success: true,

      logs,

    });

  } catch (error) {

    console.error(
      "UNSAFE MEDIA ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}