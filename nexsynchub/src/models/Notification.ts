import mongoose, { Schema, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    // 👤 Who will receive this
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🧠 Type of notification
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_comment",
        "task_updated",
        "mention",
        "system",
      ],
      required: true,
    },

    // 📝 Main message content
    content: {
      type: String,
      required: true,
    },

    // 🔗 Deep link (VERY IMPORTANT)
    link: {
      type: String, // e.g. /dashboard/.../tasks?taskId=...
      required: true,
    },

    // 📌 Optional references (for future expansion)
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },

    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },

    // 👁️ Read state
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Notification ||
  mongoose.model("Notification", NotificationSchema);