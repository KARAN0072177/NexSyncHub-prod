import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";



import { createSecurityLog } from "@/lib/security";

type AuthUser = {
  id?: string;
  username?: string | null;
  avatar?: string | null;
  role?: UserRole | null;
};

type UserRole =
  | "user"
  | "admin"
  | "super_admin";

type SessionUserWithAppFields = {
  id: string;
  username?: unknown;
  avatar?: unknown;
  role: UserRole;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials, req) {
        await connectDB();

        // 🔥 Log login attempt

        const forwardedFor =
          req?.headers?.["x-forwarded-for"] as string;

        const ip =
          forwardedFor?.split(",")[0]?.trim() ||
          "Unknown";

        const userAgent =
          (req?.headers?.["user-agent"] as string) ||
          "Unknown";

        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await User.findOne({ email });

        if (!user) {

          // 🔥 Security log
          await createSecurityLog({

            action:
              "auth_login_failed",

            ip,

            userAgent,

            metadata: {

              email,

              reason:
                "User not found",

            },

          });

          throw new Error(
            "Invalid credentials"
          );

        }

        if (!user.isEmailVerified) {
          throw new Error("Please verify your email first");
        }

        // 🔥 Banned user check
        if (
          user.isBanned
        ) {

          // 🔥 Temp suspension expired
          if (
            user.banExpiresAt
            &&
            new Date() >
            new Date(
              user.banExpiresAt
            )
          ) {

            user.isBanned = false;

            user.banReason = "";

            user.banExpiresAt = null;

            user.bannedBy = null;

            await user.save();

          } else {

            // 🔥 Security log
            await createSecurityLog({

              userId:
                user._id.toString(),

              action:
                "auth_login_blocked_banned",

              ip,

              userAgent,

              metadata: {

                reason:
                  user.banReason ||

                  "Banned account",

                expiresAt:
                  user.banExpiresAt ||

                  null,

              },

            });

            throw new Error(

              user.banExpiresAt

                ? `Your account is suspended until ${new Date(
                  user.banExpiresAt
                ).toLocaleString()}.`

                : "Your account has been permanently banned."

            );

          }

        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

          // 🔥 Security log
          await createSecurityLog({

            userId:
              user._id.toString(),

            action:
              "auth_login_failed",

            ip,

            userAgent,

            metadata: {

              email,

              reason:
                "Wrong password",

            },

          });

          throw new Error(
            "Invalid credentials"
          );

        }

        // 🔥 Security log
        await createSecurityLog({

          userId:
            user._id.toString(),

          action:
            "auth_login",

          ip,

          userAgent,

        });

        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username || null,
          avatar: user.avatar || null,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser =
          user as AuthUser;

        token.id = authUser.id || "";
        token.username = authUser.username;
        token.avatar = authUser.avatar;
        token.role = authUser.role || "user";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const sessionUser =
          session.user as typeof session.user &
            SessionUserWithAppFields;

        sessionUser.id =
          typeof token.id === "string"
            ? token.id
            : "";
        sessionUser.username = token.username;
        sessionUser.avatar = token.avatar;
        sessionUser.role =
          token.role === "admin" ||
          token.role === "super_admin"
            ? token.role
            : "user";
      }
      return session;
    },
  },

  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET,
};
