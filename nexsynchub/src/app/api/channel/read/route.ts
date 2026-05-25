import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import Channel from "@/models/Channel";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: Request) {
  await connectDB();

  const session =
    await requireAuth();

  const { channelId } = await req.json();

  if (!channelId) {
    return NextResponse.json(
      { error: "channelId required" },
      { status: 400 }
    );
  }

  const channel = await Channel.findById(channelId);

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  await Membership.findOneAndUpdate(
    {
      user: session.user.id,
      workspace: channel.workspace, // ✅ correct
    },
    {
      lastReadAt: new Date(),
    }
  );

  await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channelId,
      event: "message_seen",
      data: {
        userId: session.user.id,
        timestamp: new Date(),
      },
    }),
  });

  return NextResponse.json({ success: true });
}