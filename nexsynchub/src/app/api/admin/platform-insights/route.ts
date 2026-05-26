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

import Workspace
  from "@/models/Workspace";

import Invite
  from "@/models/Invite";

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

    // 🔥 Last 24h
    const last24h =
      new Date(
        Date.now() -
        24 * 60 * 60 * 1000
      );

    // 🔥 Unsafe uploads
    const unsafeUploads24h =
      await SecurityLog.countDocuments({

        action: {

          $in: [

            "unsafe_avatar_upload",

            "unsafe_workspace_avatar_upload",

            "unsafe_support_attachment",

            "unsafe_chat_attachment",

          ],

        },

        createdAt: {

          $gte:
            last24h,

        },

      });

    // 🔥 Recent bans
    const recentBans24h =
      await SecurityLog.countDocuments({

        action: {

          $in: [

            "user_temp_banned",

            "user_permanently_banned",

          ],

        },

        createdAt: {

          $gte:
            last24h,

        },

      });

    // 🔥 New users
    const newUsers24h =
      await User.countDocuments({

        createdAt: {

          $gte:
            last24h,

        },

      });

    // 🔥 Workspace creations
    const workspaceCreations24h =
      await Workspace.countDocuments({

        createdAt: {

          $gte:
            last24h,

        },

      });

    // 🔥 Invite creations
    const inviteCreations24h =
      await Invite.countDocuments({

        createdAt: {

          $gte:
            last24h,

        },

      });

    return NextResponse.json({

      success: true,

      insights: {

        unsafeUploads24h,

        recentBans24h,

        newUsers24h,

        workspaceCreations24h,

        inviteCreations24h,

      },

    });

  } catch (error) {

    console.error(
      "PLATFORM INSIGHTS ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}