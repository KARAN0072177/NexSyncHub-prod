import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { connectDB }
  from "@/lib/db";

import AuditLog
  from "@/models/AuditLog";

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

    // 🔥 Pagination
    const {
      searchParams,
    } = new URL(req.url);

    const page =
      Number(
        searchParams.get("page")
      ) || 1;

    const limit = 20;

    const skip =
      (page - 1) * limit;

    // 🔥 Fetch audits
    const audits =
      await AuditLog.find()

        .populate(
          "actor",
          "username avatar email"
        )

        .populate(
          "workspace",
          "name"
        )

        .sort({
          createdAt: -1,
        })

        .skip(skip)

        .limit(limit)

        .lean();

    // 🔥 Total count
    const total =
      await AuditLog.countDocuments();

    return NextResponse.json({

      success: true,

      audits,

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
      "ADMIN AUDITS ERROR:",
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