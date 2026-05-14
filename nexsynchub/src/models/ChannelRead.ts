import mongoose, {
    Schema,
    models,
    model,
} from "mongoose";

export interface IChannelRead {

    user:
    mongoose.Types.ObjectId;

    channel:
    mongoose.Types.ObjectId;

    lastReadAt: Date;

}

const ChannelReadSchema =
    new Schema<IChannelRead>(
        {

            user: {
                type:
                    Schema.Types.ObjectId,

                ref: "User",

                required: true,

                index: true,
            },

            channel: {
                type:
                    Schema.Types.ObjectId,

                ref: "Channel",

                required: true,

                index: true,
            },

            lastReadAt: {
                type: Date,

                default:
                    Date.now,
            },

        },
        {
            timestamps: true,
        }
    );

// 🔥 Prevent duplicates
ChannelReadSchema.index(
    {
        user: 1,
        channel: 1,
    },
    {
        unique: true,
    }
);

const ChannelRead =
    models.ChannelRead ||

    model<IChannelRead>(
        "ChannelRead",
        ChannelReadSchema
    );

export default ChannelRead;