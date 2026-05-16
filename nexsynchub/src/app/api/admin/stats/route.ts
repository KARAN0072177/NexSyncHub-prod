import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { connectDB }
  from "@/lib/db";

import User
  from "@/models/User";

import Workspace
  from "@/models/Workspace";

import Channel
  from "@/models/Channel";

import Task
  from "@/models/Task";

import Message
  from "@/models/Message";

import {
  requireAdmin,
} from "@/lib/permissions";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await getServerSession(
        authOptions
      );

    if (
      !session?.user?.id
    ) {

      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );

    }

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Parallel counts
    const [

      totalUsers,

      totalWorkspaces,

      totalChannels,

      totalTasks,

      totalMessages,

      verifiedUsers,

      admins,

      superAdmins,

    ] = await Promise.all([

      User.countDocuments(),

      Workspace.countDocuments(),

      Channel.countDocuments(),

      Task.countDocuments(),

      Message.countDocuments(),

      User.countDocuments({
        isEmailVerified: true,
      }),

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        role: "super_admin",
      }),

    ]);

    return NextResponse.json({

      success: true,

      stats: {

        totalUsers,

        totalWorkspaces,

        totalChannels,

        totalTasks,

        totalMessages,

        verifiedUsers,

        admins,

        superAdmins,

      },

    });

  } catch (error) {

    console.error(
      "ADMIN STATS ERROR:",
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