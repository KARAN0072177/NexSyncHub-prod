import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { usernameSchema } from "@/lib/validators/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { use } from "react";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const parsed = usernameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    // 🔍 Check if username already exists
    const existing = await User.findOne({ username });

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // ✅ Update current user
    await User.findByIdAndUpdate(session.user.id, {
      username,
    });

    return NextResponse.json({
      message: "Username set successfully",
      username,
    });
  } catch (error) {
    console.error("SET USERNAME ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}