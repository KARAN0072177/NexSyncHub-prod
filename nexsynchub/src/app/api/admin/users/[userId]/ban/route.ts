import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  connectDB,
} from "@/lib/db";

import User
  from "@/models/User";

import {
  requireAuth,
} from "@/lib/auth-guard";

import {
  requireAdmin,
} from "@/lib/permissions";

import {
  createSecurityLog,
} from "@/lib/security";

export async function PATCH(

  req: NextRequest,

  {
    params,
  }: {
    params: Promise<{
      userId: string;
    }>;
  }

) {

  try {

    await connectDB();

    // 🔐 Auth
    const session =
      await requireAuth();

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Request body
    const body =
      await req.json();

    const {
      type,
      reason,
      durationDays,
    } = body;

    // 🔥 Params
    const { userId } =
      await params;

    // 🔥 Fetch user
    const user =
      await User.findById(
        userId
      );

    // ❌ User not found
    if (!user) {

      return NextResponse.json(
        {
          error:
            "User not found",
        },
        {
          status: 404,
        }
      );

    }

    // ❌ Cannot ban super admin
    if (
      user.role ===
      "super_admin"
    ) {

      return NextResponse.json(
        {
          error:
            "Cannot ban super admin",
        },
        {
          status: 403,
        }
      );

    }

    // ❌ Prevent self-ban
    if (
      user._id.toString() ===
      session.user.id
    ) {

      return NextResponse.json(
        {
          error:
            "You cannot ban yourself",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Temporary suspension
    if (
      type === "temporary"
    ) {

      // ❌ Invalid duration
      if (
        !durationDays ||
        durationDays <= 0
      ) {

        return NextResponse.json(
          {
            error:
              "Invalid duration",
          },
          {
            status: 400,
          }
        );

      }

      const expiresAt =
        new Date();

      expiresAt.setDate(
        expiresAt.getDate() +
        durationDays
      );

      user.isBanned = true;

      user.banReason =
        reason;

      user.banExpiresAt =
        expiresAt;

      user.bannedBy =
        session.user.id;

    }

    // 🔥 Permanent ban
    else if (
      type === "permanent"
    ) {

      user.isBanned = true;

      user.banReason =
        reason;

      user.banExpiresAt =
        null;

      user.bannedBy =
        session.user.id;

    }

    // 🔥 Unban
    else if (
      type === "unban"
    ) {

      user.isBanned = false;

      user.banReason = "";

      user.banExpiresAt =
        null;

      user.bannedBy =
        null;

    }

    // ❌ Invalid type
    else {

      return NextResponse.json(
        {
          error:
            "Invalid action type",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Save user
    await user.save();

    // 🔥 Security log
    await createSecurityLog({

      userId:
        user._id.toString(),

      action:

        type === "unban"

          ? "user_unbanned"

          : type === "temporary"

            ? "user_temp_banned"

            : "user_permanently_banned",

      metadata: {

        moderatedBy:
          session.user.id,

        reason,

        durationDays,

      },

    });

    // ✅ Success
    return NextResponse.json({

      success: true,

    });

  } catch (error) {

    console.error(
      "BAN USER ERROR:",
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