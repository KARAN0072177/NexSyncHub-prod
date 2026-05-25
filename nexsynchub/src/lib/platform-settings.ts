import PlatformSettings
  from "@/models/PlatformSettings";

// 🔥 Get platform settings
export async function
getPlatformSettings() {

  let settings =

    await PlatformSettings.findOne();

  // 🔥 Auto create
  if (!settings) {

    settings =

      await PlatformSettings.create({

        allowRegistrations: true,

      });

  }

  return settings;

}