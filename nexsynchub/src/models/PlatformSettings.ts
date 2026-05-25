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