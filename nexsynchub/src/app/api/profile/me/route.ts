import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔍 Find current user
    const user = await User.findById(
      session.user.id
    ).select(
      `
      username
      email
      displayName
      bio
      avatar
      createdAt
      `
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Clean response
    return NextResponse.json({
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
      "PROFILE FETCH ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );

  }

}