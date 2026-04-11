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

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const channelId = searchParams.get("channelId");
    const cursor = searchParams.get("cursor"); // messageId

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId required" },
        { status: 400 }
      );
    }

    // 🔍 Check channel
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // 🔐 Check membership
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

    const PAGE_SIZE = 20;

    const query: any = { channel: channelId };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    // 🔥 Fetch messages
    const rawMessages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(PAGE_SIZE)
      .populate("sender", "username email")
      .lean();

    // 🔥 Fetch all members of workspace
    const members = await Membership.find({
      workspace: channel.workspace,
    })
      .select("user lastReadAt")
      .lean();

    // 🔥 Add seenCount to each message
    const messages = rawMessages.map((msg: any) => {
      const seenCount = members.filter((m: any) => {
        return (
          m.user.toString() !== msg.sender._id.toString() && // ❗ exclude sender
          m.lastReadAt &&
          new Date(m.lastReadAt) > new Date(msg.createdAt)
        );
      }).length;

      return {
        ...msg,
        seenCount,
      };
    });

    return NextResponse.json({
      messages: messages.reverse(), // oldest → newest
      nextCursor:
        messages.length === PAGE_SIZE
          ? messages[messages.length - 1]._id
          : null,
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}