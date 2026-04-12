import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, targetUserId } = await req.json();

    if (!workspaceId || !targetUserId) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    const current = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (!current) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const target = await Membership.findOne({
      user: targetUserId,
      workspace: workspaceId,
    });

    if (!target) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    // 🚨 RULES

    // OWNER → can remove anyone
    if (current.role === "OWNER") {
      await target.deleteOne();
      return NextResponse.json({ success: true });
    }

    // ADMIN → can remove only MEMBERS
    if (current.role === "ADMIN" && target.role === "MEMBER") {
      await target.deleteOne();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Not allowed" },
      { status: 403 }
    );
  } catch (error) {
    console.error("REMOVE MEMBER ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}