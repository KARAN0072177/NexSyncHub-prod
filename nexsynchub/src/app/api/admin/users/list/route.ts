import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { connectDB }
  from "@/lib/db";

import User
  from "@/models/User";

import {
  requireAdmin,
} from "@/lib/permissions";

export async function GET(
  req: Request
) {

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

    // 🔥 Search params
    const {
      searchParams,
    } = new URL(req.url);

    const search =
      searchParams.get(
        "search"
      ) || "";

    const page =
      Number(
        searchParams.get(
          "page"
        )
      ) || 1;

    const limit = 20;

    const skip =
      (page - 1) * limit;

    // 🔥 Search filter
    const filter =
      search
        ? {
            $or: [

              {
                username: {
                  $regex: search,
                  $options: "i",
                },
              },

              {
                email: {
                  $regex: search,
                  $options: "i",
                },
              },

            ],
          }
        : {};

    // 🔥 Users
    const users =
      await User.find(filter)

        .select(
          [
            "username",
            "email",
            "role",
            "avatar",
            "isEmailVerified",
            "createdAt",
          ].join(" ")
        )

        .sort({
          createdAt: -1,
        })

        .skip(skip)

        .limit(limit)

        .lean();

    // 🔥 Count
    const total =
      await User.countDocuments(
        filter
      );

    return NextResponse.json({

      success: true,

      users,

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
      "ADMIN USERS ERROR:",
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