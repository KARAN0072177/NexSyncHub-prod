import {
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

    // 🔥 Fetch users
    const users =
      await User.find({})

        .select(

          "username email role avatar createdAt isBanned"

        )

        .sort({
          createdAt: -1,
        })

        .lean();

    return NextResponse.json({

      success: true,

      users,

    });

  } catch (error) {

    console.error(
      "ADMIN MANAGEMENT LIST ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}