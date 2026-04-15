import mongoose, { Schema, models, model } from "mongoose";

export interface ITaskComment {
  content: string;
  task: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },

    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TaskComment =
  models.TaskComment || model<ITaskComment>("TaskComment", TaskCommentSchema);

export default TaskComment;