import mongoose, { Schema, models, model } from "mongoose";

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export interface IMembership {
  user: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  role: Role;

  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER"],
      default: "MEMBER",
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Prevent duplicate membership
MembershipSchema.index({ user: 1, workspace: 1 }, { unique: true });

const Membership =
  models.Membership || model<IMembership>("Membership", MembershipSchema);

export default Membership;