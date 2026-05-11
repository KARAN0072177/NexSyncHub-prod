import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

export async function PATCH(
  req: NextRequest
) {

  try {

    await connectDB();

    // 🔐 Session check
    const session = await getServerSession(
      authOptions
    );

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      displayName,
      bio,
    } = body;

    // 🔍 Find current user
    const user = await User.findById(
      session.user.id
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Update allowed fields only
    user.displayName =
      displayName?.trim() || "";

    user.bio =
      bio?.trim() || "";

    await user.save();

    return NextResponse.json({
      success: true,

      profile: {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {

    console.error(
      "PROFILE UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );

  }

}