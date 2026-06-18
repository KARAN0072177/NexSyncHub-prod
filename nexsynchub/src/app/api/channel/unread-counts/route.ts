import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

import Membership from "@/models/Membership";
import Channel from "@/models/Channel";
import Message from "@/models/Message";
import ChannelRead from "@/models/ChannelRead";

export async function GET(req: Request) {
  try {
    await connectDB();

    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }

    const membership = await Membership.findOne({
      workspace: workspaceId,
      user: session.user.id,
    }).select("_id");

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const channels = await Channel.find({
      workspace: workspaceId,
    })
      .select("_id")
      .lean<{ _id: Types.ObjectId }[]>();

    const unreadCounts: Record<string, number> = {};
    const channelIds = channels.map((channel) => channel._id);

    for (const channelId of channelIds) {
      unreadCounts[String(channelId)] = 0;
    }

    if (channelIds.length === 0) {
      return NextResponse.json({ unreadCounts });
    }

    const readStates = await ChannelRead.find({
      user: session.user.id,
      channel: {
        $in: channelIds,
      },
    })
      .select("channel lastReadAt")
      .lean<{ channel: Types.ObjectId; lastReadAt?: Date }[]>();

    const readStateByChannel = new Map(
      readStates.map((state) => [
        String(state.channel),
        state.lastReadAt || new Date(0),
      ])
    );

    const senderId = Types.ObjectId.isValid(session.user.id)
      ? new Types.ObjectId(session.user.id)
      : session.user.id;

    const unreadConditions = channelIds.map((channelId) => ({
      channel: channelId,
      createdAt: {
        $gt: readStateByChannel.get(String(channelId)) || new Date(0),
      },
    }));

    const rows = await Message.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          channel: {
            $in: channelIds,
          },
          sender: {
            $ne: senderId,
          },
          $or: unreadConditions,
        },
      },
      {
        $group: {
          _id: "$channel",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    for (const row of rows) {
      unreadCounts[String(row._id)] = row.count;
    }

    return NextResponse.json({ unreadCounts });
  } catch (error) {
    console.error("UNREAD COUNT ERROR:", error);
    return handleApiError(error);
  }
}
