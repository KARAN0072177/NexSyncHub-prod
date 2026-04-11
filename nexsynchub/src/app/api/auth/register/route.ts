import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validators/auth";
import { generateVerificationToken } from "@/lib/tokens";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await connectDB();

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
    await User.create({
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expires,
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