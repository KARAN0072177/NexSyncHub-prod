import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

export interface IAuditLog {
  workspace:
    mongoose.Types.ObjectId;

  actor:
    mongoose.Types.ObjectId;

  action: string;

  targetType: string;

  targetId?:
    mongoose.Types.ObjectId;

  metadata?: Record<
    string,
    any
  >;

  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema =
  new Schema<IAuditLog>(
    {
      workspace: {
        type:
          Schema.Types.ObjectId,

        ref: "Workspace",

        required: true,

        index: true,
      },

      actor: {
        type:
          Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      // 🔥 Example:
      // channel_deleted
      // workspace_renamed
      // member_promoted

      action: {
        type: String,

        required: true,

        trim: true,

        index: true,
      },

      // 🔥 Example:
      // channel
      // task
      // workspace
      // member

      targetType: {
        type: String,

        required: true,

        trim: true,
      },

      // 🔥 Optional related entity

      targetId: {
        type:
          Schema.Types.ObjectId,
      },

      // 🔥 Flexible extra data

      metadata: {
        type: Schema.Types.Mixed,

        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

const AuditLog =
  models.AuditLog ||

  model<IAuditLog>(
    "AuditLog",
    AuditLogSchema
  );

export default AuditLog;