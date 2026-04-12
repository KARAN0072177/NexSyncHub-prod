import mongoose, { Schema, models, model } from "mongoose";

export interface IAttachment {
  key: string;
  type: "image" | "video" | "file";
  name?: string;
  size?: number;
}

export interface IMessage {
  content?: string;
  attachments: IAttachment[];

  channel: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;

  type: "user" | "system"; // ✅ NEW

  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    key: { type: String, required: true },

    type: {
      type: String,
      enum: ["image", "video", "file"],
      required: true,
    },

    name: String,
    size: Number,
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      trim: true,
    },

    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔥 NEW FIELD
    type: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Prevent empty messages (BUT allow system messages)
MessageSchema.pre("validate", function (this: any) {
  if (this.type === "system") return; // ✅ allow system messages

  if (!this.content && this.attachments.length === 0) {
    throw new Error("Message cannot be empty");
  }
});

const Message =
  models.Message || model<IMessage>("Message", MessageSchema);

export default Message;