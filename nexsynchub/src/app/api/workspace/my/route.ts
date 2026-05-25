import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import "@/models/Workspace";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    await connectDB();

    // 🔐 Auth check
    const session =
      await requireAuth();

    // 🔍 Find memberships
    const memberships = await Membership.find({
      user: session.user.id,
    })
      .populate({
        path: "workspace",
        select: "name avatar owner isPrivate createdAt",
      })
      .lean();

    // 🧠 Format response (clean API)
    const workspaces = memberships.map((m: any) => ({
      _id: m.workspace._id,
      name: m.workspace.name,
      avatar: m.workspace.avatar,
      owner: m.workspace.owner,
      isPrivate: m.workspace.isPrivate,
      role: m.role,
      createdAt: m.workspace.createdAt,
    }));

    return NextResponse.json({
      workspaces,
    });
  } catch (error) {
    console.error("GET WORKSPACES ERROR:", error);

    return handleApiError(
      error
    );
  }
}