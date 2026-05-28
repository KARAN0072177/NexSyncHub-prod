import mongoose, { Schema, models, model } from "mongoose";

export interface IChannel {
  name: string;
  workspace: mongoose.Types.ObjectId;
  type: "TEXT" | "VOICE";
  isSystem: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["TEXT", "VOICE"],
      default: "TEXT",
    },

    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Unique channel per workspace
ChannelSchema.index({ name: 1, workspace: 1 }, { unique: true });

const Channel =
  models.Channel || model<IChannel>("Channel", ChannelSchema);

export default Channel;
