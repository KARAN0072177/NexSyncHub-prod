import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import "@/models/User";

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
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId required" },
        { status: 400 }
      );
    }

    // 🔥 Get target message
    const target = await Message.findById(messageId)
      .populate("sender", "username email")
      .lean();

    if (!target) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // 🔐 Check access (VERY IMPORTANT)
    const channel = await Channel.findById(target.channel);

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: channel.workspace,
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const LIMIT = 5;

    // 🔥 Messages BEFORE
    const before = await Message.find({
      channel: target.channel,
      createdAt: { $lt: target.createdAt },
    })
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .populate("sender", "username email")
      .lean();

    // 🔥 Messages AFTER
    const after = await Message.find({
      channel: target.channel,
      createdAt: { $gt: target.createdAt },
    })
      .sort({ createdAt: 1 })
      .limit(LIMIT)
      .populate("sender", "username email")
      .lean();

    // 🔥 Final ordered messages
    const messages = [
      ...before.reverse(), // oldest → newest
      target,
      ...after,
    ];

    return NextResponse.json({
      messages,
      targetId: target._id,
    });
  } catch (error) {
    console.error("GET CONTEXT ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}