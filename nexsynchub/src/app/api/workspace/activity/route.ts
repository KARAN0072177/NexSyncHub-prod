import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // 🔐 Check membership
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

    // 🔥 Get all channels of workspace
    const channels = await Channel.find({ workspace: workspaceId }).select("_id");

    const channelIds = channels.map((c) => c._id);

    // 🔥 Fetch activity messages
    const activities = await Message.find({
      type: "task_activity",
      channel: { $in: channelIds },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username")
      .populate("task", "title")
      .lean();

    return NextResponse.json({ activities });
  } catch (err) {
    console.error("GET WORKSPACE ACTIVITY ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}