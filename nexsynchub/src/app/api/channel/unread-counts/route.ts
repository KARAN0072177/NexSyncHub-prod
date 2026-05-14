import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";

import Membership from "@/models/Membership";
import Channel from "@/models/Channel";
import Message from "@/models/Message";
import ChannelRead from "@/models/ChannelRead";

export async function GET(req: Request) {
  try {

    await connectDB();

    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );

    }

    const { searchParams } =
      new URL(req.url);

    const workspaceId =
      searchParams.get("workspaceId");

    if (!workspaceId) {

      return NextResponse.json(
        {
          error:
            "Workspace ID required",
        },
        {
          status: 400,
        }
      );

    }

    // 🔐 Membership check
    const membership =
      await Membership.findOne({
        workspace: workspaceId,
        user: session.user.id,
      });

    if (!membership) {

      return NextResponse.json(
        {
          error:
            "Access denied",
        },
        {
          status: 403,
        }
      );

    }

    // 🔥 Get workspace channels
    const channels =
      await Channel.find({
        workspace: workspaceId,
      }).lean();

    const unreadCounts:
      Record<string, number> = {};

    for (const channel of channels) {

      // 🔥 Read state
      const readState =
        await ChannelRead.findOne({
          user: session.user.id,
          channel: channel._id,
        });

      const lastReadAt =
        readState?.lastReadAt ||
        new Date(0);

      // 🔥 Count unread messages
      const count =
        await Message.countDocuments({
          channel: channel._id,

          createdAt: {
            $gt: lastReadAt,
          },

          // optional:
          // don't count own messages
          sender: {
            $ne: session.user.id,
          },
        });

      unreadCounts[
        String(channel._id)
      ] = count;

    }

    return NextResponse.json({
      unreadCounts,
    });

  } catch (error) {

    console.error(
      "UNREAD COUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong",
      },
      {
        status: 500,
      }
    );

  }
}