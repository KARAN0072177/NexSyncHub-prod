// /src/models/PlatformSettings.ts

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

            allowWorkspaceInvites: {

                type: Boolean,

                default: true,

            },

            allowWorkspaceCreation: {

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