import {
  NextResponse,
} from "next/server";

import {
  connectDB,
} from "@/lib/db";

import {
  getPlatformSettings,
} from "@/lib/platform-settings";

export async function GET() {

  await connectDB();

  const settings =
    await getPlatformSettings();

  return NextResponse.json({

    announcement: {

      enabled:
        settings.announcementEnabled,

      text:
        settings.announcementText,

      type:
        settings.announcementType,

      startAt:
        settings.announcementStartAt,

      endAt:
        settings.announcementEndAt,

    },

  });

}