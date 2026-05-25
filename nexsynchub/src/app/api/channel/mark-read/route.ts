import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import ChannelRead from "@/models/ChannelRead";
import Membership from "@/models/Membership";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const body = await req.json();

    const { channelId } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID required" },
        { status: 400 }
      );
    }

    // 🔐 Verify membership
    const membership =
      await Membership.findOne({
        user: session.user.id,
      });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // 🔥 Update read state
    await ChannelRead.findOneAndUpdate(
      {
        user: session.user.id,
        channel: channelId,
      },
      {
        lastReadAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(
      "MARK CHANNEL READ ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }
}