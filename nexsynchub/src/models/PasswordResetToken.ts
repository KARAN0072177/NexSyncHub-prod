import mongoose, {
  Schema,
  model,
  models,
} from "mongoose";

export interface IPasswordResetToken {

  user:
    mongoose.Types.ObjectId;

  otpHash: string;

  expiresAt: Date;

  verified: boolean;

  createdAt: Date;

  updatedAt: Date;

}

const PasswordResetTokenSchema =
  new Schema<IPasswordResetToken>(

    {

      user: {

        type:
          Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,

      },

      otpHash: {

        type: String,

        required: true,

      },

      expiresAt: {

        type: Date,

        required: true,

      },

      verified: {

        type: Boolean,

        default: false,

      },

    },

    {
      timestamps: true,
    }
  );

// 🔥 Auto-delete expired docs
PasswordResetTokenSchema.index(

  {
    expiresAt: 1,
  },

  {
    expireAfterSeconds: 0,
  }
);

const PasswordResetToken =

  models.PasswordResetToken ||

  model<IPasswordResetToken>(

    "PasswordResetToken",

    PasswordResetTokenSchema
  );

export default PasswordResetToken;