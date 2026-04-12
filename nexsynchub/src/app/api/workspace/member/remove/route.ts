import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import Message from "@/models/Message";
import Channel from "@/models/Channel";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, targetUserId } = await req.json();

    if (!workspaceId || !targetUserId) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    const current = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    }).populate("user"); // ✅ for username

    if (!current) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const target = await Membership.findOne({
      user: targetUserId,
      workspace: workspaceId,
    }).populate("user"); // ✅ for username

    if (!target) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    // 🔥 GET CHANNEL (IMPORTANT)
    const channel = await Channel.findOne({ workspace: workspaceId });

    // 🚨 RULES

    // =============================
    // OWNER → can remove anyone
    // =============================
    if (current.role === "OWNER") {
      await target.deleteOne();

      const actionText = `${current.user.username} removed ${target.user.username} from the workspace`;

      // 🔥 CREATE SYSTEM MESSAGE
      const systemMessage = await Message.create({
        content: actionText,
        channel: channel._id,
        sender: session.user.id,
        type: "system",
      });

      const plainMessage = JSON.parse(JSON.stringify(systemMessage));

      // 🔥 EMIT SOCKET
      await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel._id,
          message: plainMessage,
        }),
      });

      return NextResponse.json({ success: true });
    }

    // =============================
    // ADMIN → can remove only MEMBERS
    // =============================
    if (current.role === "ADMIN" && target.role === "MEMBER") {
      await target.deleteOne();

      const actionText = `${current.user.username} removed ${target.user.username} from workspace`;

      const systemMessage = await Message.create({
        content: actionText,
        channel: channel._id,
        sender: session.user.id,
        type: "system",
      });

      await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel._id,
          message: systemMessage,
        }),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Not allowed" },
      { status: 403 }
    );
  } catch (error) {
    console.error("REMOVE MEMBER ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}