import PlatformSettings
  from "@/models/PlatformSettings";

export async function
  getPlatformSettings() {

  let settings =

    await PlatformSettings.findOne();

  // 🔥 Create singleton
  if (!settings) {

    settings =
      await PlatformSettings.create({

        allowRegistrations:
          true,

        maintenanceMode:
          false,

        allowWorkspaceInvites:
          true,

        allowWorkspaceCreation:
          true,

        announcementEnabled:
          false,

        announcementText:
          "",

        announcementType:
          "info",

        announcementStartAt:
          null,

        announcementEndAt:
          null,

      });

  }

  // 🔥 Backfill missing fields
  if (
    settings.allowWorkspaceInvites ===
    undefined
  ) {

    settings.allowWorkspaceInvites =
      true;
  }

  if (
    settings.allowWorkspaceCreation ===
    undefined
  ) {

    settings.allowWorkspaceCreation =
      true;

  }

  await settings.save();

  return settings;

}