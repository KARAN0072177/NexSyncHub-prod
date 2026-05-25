import {
  NextRequest,
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

// 🔥 Severity helper
function getLogSeverity(
  action: string
) {

  // 🚨 Dangerous
  if (

    action.includes(
      "banned"
    )

    ||

    action.includes(
      "unsafe"
    )

  ) {

    return "danger";

  }

  // ⚠️ Warning
  if (

    action.includes(
      "failed"
    )

    ||

    action.includes(
      "suspicious"
    )

  ) {

    return "warning";

  }

  // ℹ️ Informational
  return "info";

}

export async function GET(
  req: NextRequest
) {

  try {

    await connectDB();

    // 🔐 Auth
    const session =
      await requireAuth();

    // 🔐 Super admin only
    await requireSuperAdmin(
      session.user.id
    );

    // 🔥 Query params
    const {
      searchParams,
    } = new URL(
      req.url
    );

    const page =
      Number(
        searchParams.get(
          "page"
        )
      ) || 1;

    const limit =
      Number(
        searchParams.get(
          "limit"
        )
      ) || 20;

    const search =
      searchParams.get(
        "search"
      ) || "";

    const type =
      searchParams.get(
        "type"
      ) || "all";

    const skip =
      (page - 1) * limit;

    // 🔥 Query
    const query: any = {};

    // 🔍 Search
    if (search) {

      query.$or = [

        {
          action: {
            $regex:
              search,
            $options:
              "i",
          },
        },

      ];

    }

    // 🔥 Type filters
    if (
      type !== "all"
    ) {

      if (
        type ===
        "security"
      ) {

        query.action = {

          $in: [

            "auth_login_failed",

            "unsafe_chat_attachment",

            "unsafe_support_attachment",

            "unsafe_avatar_upload",

            "unsafe_workspace_avatar_upload",

            "unsafe_workspace_name",

          ],

        };

      }

      else if (
        type ===
        "moderation"
      ) {

        query.action = {

          $in: [

            "user_temp_banned",

            "user_permanently_banned",

            "user_unbanned",

          ],

        };

      }

      else if (
        type ===
        "governance"
      ) {

        query.action = {

          $in: [

            "user_promoted_to_admin",

            "admin_demoted_to_user",

          ],

        };

      }

      else if (
        type ===
        "ai"
      ) {

        query.action = {

          $in: [

            "ai_suspicious_activity",

          ],

        };

      }

    }

    // 🔥 Total count
    const total =
      await SecurityLog.countDocuments(
        query
      );

    // 🔥 Fetch logs
    const logs =
      await SecurityLog.find(
        query
      )

        .populate(

          "user",

          "username email avatar role"

        )

        .sort({
          createdAt: -1,
        })

        .skip(skip)

        .limit(limit)

        .lean();

    // 🔥 Normalize
    const normalizedLogs =
      logs.map((log: any) => ({

        id:
          log._id,

        action:
          log.action,

        severity:
          getLogSeverity(
            log.action
          ),

        targetUser:
          log.user

            ? {

              id:
                log.user._id,

              username:
                log.user.username,

              email:
                log.user.email,

              avatar:
                log.user.avatar,

              role:
                log.user.role,

            }

            : null,

        metadata:
          log.metadata || {},

        createdAt:
          log.createdAt,

      }));

    return NextResponse.json({

      success: true,

      logs:
        normalizedLogs,

      pagination: {

        page,

        limit,

        total,

        totalPages:
          Math.ceil(
            total / limit
          ),

      },

    });

  } catch (error) {

    console.error(
      "GOVERNANCE LOGS ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}