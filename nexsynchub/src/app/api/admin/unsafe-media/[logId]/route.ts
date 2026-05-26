import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import SecurityLog from "@/models/SecurityLog";

import { requireAuth } from "@/lib/auth-guard";

import { requireSuperAdmin } from "@/lib/super-admin";

export async function DELETE(
  req: Request,
  context: {
    params: Promise<{
      logId: string;
    }>;
  }
) {

  try {

    await connectDB();

    const session =
      await requireAuth();

    await requireSuperAdmin(
      session.user.id
    );

    const { logId } =
      await context.params;

    const log =
      await SecurityLog.findById(
        logId
      );

    if (!log) {

      return NextResponse.json(
        {
          error: "Log not found",
        },
        {
          status: 404,
        }
      );

    }

    await SecurityLog.findByIdAndDelete(
      logId
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "DELETE UNSAFE MEDIA ERROR:",
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