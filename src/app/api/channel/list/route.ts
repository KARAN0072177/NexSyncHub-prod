import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    // 🔐 Check membership
    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const channels = await Channel.find({
      workspace: workspaceId,
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("GET CHANNELS ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}