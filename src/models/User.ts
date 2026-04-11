import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  email: string;
  password: string;
  isEmailVerified: boolean;

  username?: string | null;

  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    username: {
      type: String,
      unique: true,
      sparse: true, // allows null values but enforces uniqueness when set
      lowercase: true,
      trim: true,
    },

    emailVerificationToken: {
      type: String,
    },

    emailVerificationExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in dev (Next.js hot reload issue)
const User = models.User || model<IUser>("User", UserSchema);

export default User;