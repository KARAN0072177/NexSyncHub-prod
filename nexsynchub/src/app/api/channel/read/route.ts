import { after, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

import Membership from "@/models/Membership";
import Channel from "@/models/Channel";
import ChannelRead from "@/models/ChannelRead";

async function emitMessageSeen(channelId: string, userId: string, readAt: Date) {
  if (!process.env.SOCKET_SERVER_URL) return;

  await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelId,
      event: "message_seen",
      data: {
        userId,
        timestamp: readAt,
      },
    }),
  });
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await requireAuth();
    const { channelId } = await req.json();

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId required" },
        { status: 400 }
      );
    }

    const channel = await Channel.findById(channelId)
      .select("workspace")
      .lean<{ workspace: string } | null>();

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const readAt = new Date();

    const membershipUpdate = await Membership.updateOne(
      {
        user: session.user.id,
        workspace: channel.workspace,
      },
      {
        $set: {
          lastReadAt: readAt,
        },
      }
    );

    if (membershipUpdate.matchedCount === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await ChannelRead.findOneAndUpdate(
      {
        user: session.user.id,
        channel: channelId,
      },
      {
        $set: {
          lastReadAt: readAt,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    after(async () => {
      try {
        await emitMessageSeen(channelId, session.user.id, readAt);
      } catch (error) {
        console.error("MESSAGE SEEN EMIT ERROR:", error);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MARK CHANNEL READ ERROR:", error);
    return handleApiError(error);
  }
}
