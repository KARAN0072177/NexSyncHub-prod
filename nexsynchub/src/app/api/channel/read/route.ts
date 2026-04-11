import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Channel from "@/models/Channel";

export async function POST(req: Request) {
  await connectDB();

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ success: true });
}