import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import Workspace from "@/models/Workspace";
import "@/models/User";

import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // 🔐 Ensure user is part of workspace
    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // 🔥 Fetch members
    const members = await Membership.find({ workspace: workspaceId })
      .populate("user", "username email")
      .lean();

    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET MEMBERS ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}