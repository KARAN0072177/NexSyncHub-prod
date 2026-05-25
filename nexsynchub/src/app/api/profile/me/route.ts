import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import { requireAuth } from "@/lib/auth-guard";

import User from "@/models/User";
import { handleApiError } from "@/lib/api-error";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Get session
    const session =
      await requireAuth();

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

    return handleApiError(
      error
    );
  }

}