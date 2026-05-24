import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

export interface IUser {
  email: string;

  password: string;

  isEmailVerified: boolean;

  // 🔥 Platform role
  role:
    | "user"
    | "admin"
    | "super_admin";

  username?: string | null;

  // 🔥 Profile fields
  displayName?: string | null;

  bio?: string | null;

  avatar?: string | null;

  emailVerificationToken?: string;

  emailVerificationExpires?: Date;

  isBanned: boolean;

  banReason?: string;

  banExpiresAt?: Date | null;

  bannedBy?: mongoose.Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

const UserSchema =
  new Schema<IUser>(
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

      // 🔥 Platform role
      role: {
        type: String,

        enum: [
          "user",
          "admin",
          "super_admin",
        ],

        default: "user",

        index: true,
      },

      username: {
        type: String,

        unique: true,

        sparse: true,

        lowercase: true,

        trim: true,
      },

      // 🔥 Display name
      displayName: {
        type: String,

        trim: true,

        maxlength: 50,
      },

      // 🔥 Short profile bio
      bio: {
        type: String,

        trim: true,

        maxlength: 160,
      },

      // 🔥 Avatar image URL
      avatar: {
        type: String,
      },

      emailVerificationToken: {
        type: String,
      },

      emailVerificationExpires: {
        type: Date,
      },

      isBanned: {
        type: Boolean,
        default: false,
      },

      banReason: {
        type: String,
        default: "",
      },

      banExpiresAt: {
        type: Date,
        default: null,
      },

      bannedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
    }
  );

// Prevent model overwrite
// in dev (Next.js hot reload)

const User =
  models.User ||

  model<IUser>(
    "User",
    UserSchema
  );

export default User;