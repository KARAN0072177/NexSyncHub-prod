import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { createSecurityLog }
  from "@/lib/security";

export async function POST(
  req: Request
) {

  try {

    const session =
      await getServerSession(
        authOptions
      );

    if (
      !session?.user?.id
    ) {

      return NextResponse.json({
        success: true,
      });

    }

    const ip =

      req.headers.get(
        "x-forwarded-for"
      )

      ||

      "Unknown";

    const userAgent =

      req.headers.get(
        "user-agent"
      )

      ||

      "Unknown";

    // 🔥 Security log
    await createSecurityLog({

      userId:
        session.user.id,

      action:
        "auth_logout",

      ip,

      userAgent,

    });

    return NextResponse.json({

      success: true,

    });

  } catch (error) {

    console.error(
      "LOGOUT SECURITY ERROR:",
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