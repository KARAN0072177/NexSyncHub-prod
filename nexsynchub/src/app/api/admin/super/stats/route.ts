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

import User
  from "@/models/User";

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

    // 🔥 Users
    const [

      totalAdmins,

      totalSuperAdmins,

      totalBannedUsers,

    ] = await Promise.all([

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        role: "super_admin",
      }),

      User.countDocuments({
        isBanned: true,
      }),

    ]);

    // 🔥 Security threats
    const totalSecurityThreats =
      await SecurityLog.countDocuments({

        action: {

          $in: [

            "auth_login_failed",

            "unsafe_chat_attachment",

            "unsafe_support_attachment",

            "unsafe_workspace_name",

            "unsafe_avatar_upload",

            "unsafe_workspace_avatar_upload",

          ],

        },

      });

    // 🔥 AI flags (future)
    const totalAIFlags =
      await SecurityLog.countDocuments({

        action:
          "ai_suspicious_activity",

      });

    // 🔥 Unsafe uploads
    const [

      unsafeAvatars,

      unsafeWorkspaceAvatars,

      unsafeSupportAttachments,

      unsafeChatAttachments,

    ] = await Promise.all([

      SecurityLog.countDocuments({

        action:
          "unsafe_avatar_upload",

      }),

      SecurityLog.countDocuments({

        action:
          "unsafe_workspace_avatar_upload",

      }),

      SecurityLog.countDocuments({

        action:
          "unsafe_support_attachment",

      }),

      SecurityLog.countDocuments({

        action:
          "unsafe_chat_attachment",

      }),

    ]);

    return NextResponse.json({

      success: true,

      stats: {

        totalAdmins,

        totalSuperAdmins,

        totalBannedUsers,

        totalSecurityThreats,

        totalAIFlags,

        unsafeUploads: {

          avatars:
            unsafeAvatars,

          workspaceAvatars:
            unsafeWorkspaceAvatars,

          supportAttachments:
            unsafeSupportAttachments,

          chatAttachments:
            unsafeChatAttachments,

        },

      },

    });

  } catch (error) {

    console.error(
      "SUPER ADMIN STATS ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}