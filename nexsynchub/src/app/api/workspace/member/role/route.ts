import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import Message from "@/models/Message";
import Channel from "@/models/Channel"; // ✅ NEW

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, targetUserId, role } = await req.json();

    if (!workspaceId || !targetUserId || !role) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    // 🔐 Current user membership
    const current = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (!current) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const target = await Membership.findOne({
      user: targetUserId,
      workspace: workspaceId,
    }).populate("user"); // ✅ IMPORTANT (to get username)

    if (!target) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // 🔥 GET DEFAULT CHANNEL (IMPORTANT)
    const channel = await Channel.findOne({ workspace: workspaceId });

    // 🚨 RBAC RULES

    // =============================
    // 🔥 PROMOTE / DEMOTE
    // =============================
    if (role === "ADMIN" || role === "MEMBER") {
      if (current.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only owner can change roles" },
          { status: 403 }
        );
      }

      target.role = role;
      await target.save();

      // 🔥 SYSTEM MESSAGE TEXT
      let actionText = "";

      if (role === "ADMIN") {
        actionText = `${session.user.username} promoted ${target.user.username} to Admin`;
      } else if (role === "MEMBER") {
        actionText = `${session.user.username} demoted ${target.user.username} to Member`;
      } else if (role === "OWNER") {
        actionText = `${session.user.username} transferred ownership to ${target.user.username}`;
      }

      // 🔥 CREATE SYSTEM MESSAGE
      const systemMessage = await Message.create({
        content: actionText,
        channel: channel._id,
        sender: session.user.id,
        type: "system",
      });

      // 🔥 EMIT SOCKET
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

    // =============================
    // 🔥 TRANSFER OWNERSHIP
    // =============================
    if (role === "OWNER") {
      if (current.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only owner can transfer ownership" },
          { status: 403 }
        );
      }

      current.role = "ADMIN";
      await current.save();

      target.role = "OWNER";
      await target.save();

      const actionText = `${session.user.username} transferred ownership to ${target.user.username}`;

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
      { error: "Invalid role" },
      { status: 400 }
    );
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}