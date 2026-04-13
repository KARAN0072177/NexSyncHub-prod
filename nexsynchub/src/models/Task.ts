import mongoose, { Schema, models, model } from "mongoose";

export interface ITask {
  title: string;
  description?: string;

  workspace: mongoose.Types.ObjectId;
  channel?: mongoose.Types.ObjectId;

  createdBy: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;

  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";

  dueDate?: Date;

  linkedMessage?: mongoose.Types.ObjectId; // 🔥 from chat

  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    dueDate: {
      type: Date,
    },

    linkedMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Prevent empty title
TaskSchema.pre("validate", function (this: any) {
  if (!this.title || this.title.trim() === "") {
    throw new Error("Task title is required");
  }
});

const Task = models.Task || model<ITask>("Task", TaskSchema);

export default Task;