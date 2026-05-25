import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Invite from "@/models/Invite";
import Membership from "@/models/Membership";

import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const { token } = await req.json();

    const invite = await Invite.findOne({ token });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite" },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite expired" },
        { status: 400 }
      );
    }

    // 🔍 Check if already member
    const existing = await Membership.findOne({
      user: session.user.id,
      workspace: invite.workspace,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "You are already a member of this workspace",
          workspaceId: invite.workspace
        },
        { status: 400 }
      );
    }

    // ✅ Create membership
    await Membership.create({
      user: session.user.id,
      workspace: invite.workspace,
      role: invite.role,
    });

    return NextResponse.json({
      message: "Joined workspace successfully",
      workspaceId: invite.workspace
    });
  } catch (error) {
    console.error("ACCEPT INVITE ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}