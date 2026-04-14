import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import Workspace from "@/models/Workspace";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const workspace = await Workspace.findById(workspaceId);

    // ❗ Only allow PUBLIC
    if (!workspace || workspace.isPrivate) {
      return NextResponse.json(
        { error: "Workspace not joinable" },
        { status: 400 }
      );
    }

    // 🔁 Already joined?
    const existing = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already joined",
      });
    }

    // ✅ Join
    await Membership.create({
      user: session.user.id,
      workspace: workspaceId,
      role: "MEMBER",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("JOIN WORKSPACE ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}