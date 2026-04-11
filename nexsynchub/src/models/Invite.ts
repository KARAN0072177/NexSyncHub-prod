import mongoose, { Schema, model, models } from "mongoose";

export interface IInvite {
  workspace: mongoose.Types.ObjectId;
  token: string;
  role: "ADMIN" | "MEMBER";
  expiresAt: Date;
  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "MEMBER"],
      default: "MEMBER",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invite = models.Invite || model<IInvite>("Invite", InviteSchema);

export default Invite;