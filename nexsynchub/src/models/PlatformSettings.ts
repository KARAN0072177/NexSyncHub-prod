import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

const PlatformSettingsSchema =
  new Schema(

    {

      allowRegistrations: {

        type: Boolean,

        default: true,

      },

      maintenanceMode: {

        type: Boolean,

        default: false,

      },

    },

    {
      timestamps: true,
    }

  );

export default

  models.PlatformSettings ||

  model(
    "PlatformSettings",
    PlatformSettingsSchema
  );