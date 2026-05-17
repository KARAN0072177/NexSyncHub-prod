import mongoose, {

  Schema,

  models,

  model,

} from "mongoose";

export interface ISecurityLog {

  user?:
    mongoose.Types.ObjectId;

  action: string;

  ip?: string;

  userAgent?: string;

  metadata?: Record<
    string,
    any
  >;

  createdAt: Date;

  updatedAt: Date;

}

const SecurityLogSchema =
  new Schema<ISecurityLog>(

    {

      // 🔥 Optional
      // because failed login
      // may happen before auth

      user: {

        type:
          Schema.Types.ObjectId,

        ref: "User",

        default: null,

        index: true,

      },

      // 🔥 Example:
      // auth_login
      // auth_logout
      // auth_register
      // auth_login_failed

      action: {

        type: String,

        required: true,

        trim: true,

        index: true,

      },

      // 🔥 Request IP

      ip: {
        type: String,
      },

      // 🔥 Browser/device

      userAgent: {
        type: String,
      },

      // 🔥 Flexible metadata

      metadata: {

        type:
          Schema.Types.Mixed,

        default: {},

      },

    },

    {

      timestamps: true,

    }

  );

const SecurityLog =

  models.SecurityLog ||

  model<ISecurityLog>(

    "SecurityLog",

    SecurityLogSchema

  );

export default SecurityLog;