import mongoose, { Schema, models, model } from "mongoose";

export interface IWorkspace {
  name: string;
  owner: mongoose.Types.ObjectId;
  isPrivate: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Workspace =
  models.Workspace || model<IWorkspace>("Workspace", WorkspaceSchema);

export default Workspace;