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
  requireSuperAdmin,
} from "@/lib/super-admin";

import {
  handleApiError,
} from "@/lib/api-error";

import {
  createSecurityLog,
} from "@/lib/security";

import {
  sendRoleUpdateEmail,
} from "@/lib/moderation-email";

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

    // 🔐 Super admin only
    await requireSuperAdmin(
      session.user.id
    );

    const {

      role,
      reason,

    } = await req.json();

    const { userId } =
      await params;

    // 🔥 Fetch target user
    const user =
      await User.findById(
        userId
      );

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

    // ❌ Cannot modify super admins
    if (
      user.role ===
      "super_admin"
    ) {

      return NextResponse.json(

        {
          error:
            "Cannot modify super admin",
        },

        {
          status: 403,
        }

      );

    }

    // ❌ Prevent self modification
    if (
      user._id.toString() ===
      session.user.id
    ) {

      return NextResponse.json(

        {
          error:
            "You cannot modify yourself",
        },

        {
          status: 400,
        }

      );

    }

    // ❌ Invalid role
    if (
      ![
        "admin",
        "user",
      ].includes(role)
    ) {

      return NextResponse.json(

        {
          error:
            "Invalid role",
        },

        {
          status: 400,
        }

      );

    }

    const oldRole =
      user.role;

    // 🔥 Update role
    user.role = role;

    await user.save();

    // 🔥 Security log
    await createSecurityLog({

      userId:
        user._id.toString(),

      action:

        role === "admin"

          ? "user_promoted_to_admin"

          : "admin_demoted_to_user",

      metadata: {

        moderatedBy:
          session.user.id,

        oldRole,

        newRole:
          role,

        reason,

      },

    });

    // 🔥 Send email
    await sendRoleUpdateEmail({

      email:
        user.email,

      username:
        user.username,

      role,

      reason,

    });

    return NextResponse.json({

      success: true,

    });

  } catch (error) {

    console.error(
      "ADMIN ROLE UPDATE ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}