import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validators/auth";
import { generateVerificationToken } from "@/lib/tokens";
import PlatformSettings from "@/models/PlatformSettings";
import { getPlatformSettings } from "@/lib/platform-settings";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/mail";

import { createSecurityLog } from "@/lib/security";

export async function POST(req: Request) {
  try {
    await connectDB();

    // 🔥 Platform settings
    const settings =
      await getPlatformSettings();

    // ❌ Registrations disabled
    if (
      !settings.allowRegistrations
    ) {

      return NextResponse.json(

        {
          error:
            "Registrations are currently disabled",
        },

        {
          status: 403,
        }

      );

    }

    const ip =

      req.headers.get(
        "x-forwarded-for"
      )

      ||

      "Unknown";

    const userAgent =

      req.headers.get(
        "user-agent"
      )

      ||

      "Unknown";

    const body = await req.json();

    // ✅ Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Email exists but not verified. Please check your inbox." },
          { status: 400 }
        );
      }
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔑 Generate verification token
    const { token, hashedToken, expires } = generateVerificationToken();

    // 💾 Create user
    const user =
      await User.create({
        email,
        password: hashedPassword,
        isEmailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: expires,
      });

    // 🔥 Security log
    await createSecurityLog({

      userId:
        user._id.toString(),

      action:
        "auth_register",

      ip,

      userAgent,

      metadata: {

        email,

      },

    });

    // after user creation
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      {
        message: "Verification email sent",
        redirect: "/login",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}