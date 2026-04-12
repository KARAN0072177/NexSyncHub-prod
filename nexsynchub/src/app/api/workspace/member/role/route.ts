import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, targetUserId, role } = await req.json();

    if (!workspaceId || !targetUserId || !role) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    // 🔐 Current user membership
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
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // 🚨 RBAC RULES

    // Only OWNER can promote/demote/admin/transfer
    if (role === "ADMIN" || role === "MEMBER") {
      if (current.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only owner can change roles" },
          { status: 403 }
        );
      }

      target.role = role;
      await target.save();

      return NextResponse.json({ success: true });
    }

    // 🔥 TRANSFER OWNERSHIP
    if (role === "OWNER") {
      if (current.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only owner can transfer ownership" },
          { status: 403 }
        );
      }

      // downgrade current owner
      current.role = "ADMIN";
      await current.save();

      // promote target
      target.role = "OWNER";
      await target.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 }
    );
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}