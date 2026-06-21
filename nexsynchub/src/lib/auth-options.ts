import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createSecurityLog, verifyTurnstile } from "@/lib/security";
import {
  clearLoginFailures,
  formatRetryAfter,
  getLoginIpLock,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

type UserRole = "user" | "admin" | "super_admin";

type AuthUser = {
  id?: string;
  username?: string | null;
  avatar?: string | null;
  role?: UserRole | null;
};

type SessionUserWithAppFields = {
  id: string;
  username?: unknown;
  avatar?: unknown;
  role: UserRole;
};

function getRequestIp(req: { headers?: Record<string, string | string[] | undefined> }) {
  const forwardedFor = req.headers?.["x-forwarded-for"];
  const forwardedForValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;

  return forwardedForValue?.split(",")[0]?.trim() || "Unknown";
}

function getRequestUserAgent(req: { headers?: Record<string, string | string[] | undefined> }) {
  const userAgent = req.headers?.["user-agent"];

  return Array.isArray(userAgent)
    ? userAgent[0] || "Unknown"
    : userAgent || "Unknown";
}

async function throwRateLimitError({
  email,
  ip,
  retryAfterSeconds,
  userAgent,
}: {
  email: string;
  ip: string;
  retryAfterSeconds: number;
  userAgent: string;
}) {
  await createSecurityLog({
    action: "auth_login_blocked_rate_limited",
    ip,
    userAgent,
    metadata: {
      email,
      retryAfterSeconds,
    },
  });

  throw new Error(
    `Too many failed login attempts. Try again in ${formatRetryAfter(
      retryAfterSeconds
    )}.`
  );
}
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
        turnstileToken: {},
      },

      async authorize(credentials, req) {
        await connectDB();

        const ip = getRequestIp(req);
        const userAgent = getRequestUserAgent(req);
        const normalizedEmail = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password || "");
        const turnstileToken = String(credentials?.turnstileToken || "");

        await verifyTurnstile(turnstileToken, ip);

        const ipLock = await getLoginIpLock(ip);
        if (ipLock.locked) {
          await throwRateLimitError({
            email: normalizedEmail,
            ip,
            retryAfterSeconds: ipLock.retryAfterSeconds,
            userAgent,
          });
        }

        const user = await User.findOne({
          email: normalizedEmail,
        });

        if (!user) {
          const rateLimit = await recordLoginFailure(ip);

          await createSecurityLog({
            action: "auth_login_failed",
            ip,
            userAgent,
            metadata: {
              email: normalizedEmail,
              failedAttempts: rateLimit.attempts,
              rateLimited: rateLimit.locked,
              reason: "User not found",
            },
          });

          if (rateLimit.locked) {
            await throwRateLimitError({
              email: normalizedEmail,
              ip,
              retryAfterSeconds: rateLimit.retryAfterSeconds,
              userAgent,
            });
          }

          throw new Error("Invalid credentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          const rateLimit = await recordLoginFailure(ip);

          await createSecurityLog({
            userId: user._id.toString(),
            action: "auth_login_failed",
            ip,
            userAgent,
            metadata: {
              email: normalizedEmail,
              failedAttempts: rateLimit.attempts,
              rateLimited: rateLimit.locked,
              reason: "Wrong password",
            },
          });

          if (rateLimit.locked) {
            await throwRateLimitError({
              email: normalizedEmail,
              ip,
              retryAfterSeconds: rateLimit.retryAfterSeconds,
              userAgent,
            });
          }

          throw new Error("Invalid credentials");
        }

        if (!user.isEmailVerified) {
          throw new Error("Please verify your email first");
        }

        if (user.isBanned) {
          if (user.banExpiresAt && new Date() > new Date(user.banExpiresAt)) {
            user.isBanned = false;
            user.banReason = "";
            user.banExpiresAt = null;
            user.bannedBy = null;

            await user.save();
          } else {
            await createSecurityLog({
              userId: user._id.toString(),
              action: "auth_login_blocked_banned",
              ip,
              userAgent,
              metadata: {
                expiresAt: user.banExpiresAt || null,
                reason: user.banReason || "Banned account",
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

        await clearLoginFailures(ip);

        await createSecurityLog({
          userId: user._id.toString(),
          action: "auth_login",
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
        const authUser = user as AuthUser;

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
          session.user as typeof session.user & SessionUserWithAppFields;

        sessionUser.id = typeof token.id === "string" ? token.id : "";
        sessionUser.username = token.username;
        sessionUser.avatar = token.avatar;
        sessionUser.role =
          token.role === "admin" || token.role === "super_admin"
            ? token.role
            : "user";
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};
