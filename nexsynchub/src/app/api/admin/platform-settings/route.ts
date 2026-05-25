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

import {
  getPlatformSettings,
} from "@/lib/platform-settings";

export async function GET() {

  try {

    await connectDB();

    const session =
      await requireAuth();

    await requireSuperAdmin(
      session.user.id
    );

    const settings =
      await getPlatformSettings();

    return NextResponse.json({

      success: true,

      settings,

    });

  } catch (error) {

    return handleApiError(
      error
    );

  }

}

export async function PATCH(
  req: NextRequest
) {

  try {

    await connectDB();

    const session =
      await requireAuth();

    await requireSuperAdmin(
      session.user.id
    );

    const body =
      await req.json();

    const {
      allowRegistrations,
    } = body;

    const settings =
      await getPlatformSettings();

    settings.allowRegistrations =
      allowRegistrations;

    await settings.save();

    return NextResponse.json({

      success: true,

    });

  } catch (error) {

    return handleApiError(
      error
    );

  }

}