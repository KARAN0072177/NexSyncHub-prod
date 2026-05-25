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

            announcementEnabled: {

                type: Boolean,

                default: false,

            },

            announcementText: {

                type: String,

                default: "",

            },

            announcementType: {

                type: String,

                enum: [

                    "info",
                    "warning",
                    "danger",
                    "success",

                ],

                default: "info",

            },

            announcementStartAt: {

                type: Date,

                default: null,

            },

            announcementEndAt: {

                type: Date,

                default: null,

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