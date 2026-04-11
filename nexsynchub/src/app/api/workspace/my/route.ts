import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import "@/models/Workspace";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    await connectDB();

    // 🔐 Auth check
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔍 Find memberships
    const memberships = await Membership.find({
      user: session.user.id,
    })
      .populate({
        path: "workspace",
        select: "name owner isPrivate createdAt",
      })
      .lean();

    // 🧠 Format response (clean API)
    const workspaces = memberships.map((m: any) => ({
      _id: m.workspace._id,
      name: m.workspace.name,
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

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}