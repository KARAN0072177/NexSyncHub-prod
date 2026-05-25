import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { connectDB }
  from "@/lib/db";

import Workspace
  from "@/models/Workspace";

import Membership
  from "@/models/Membership";

import Notification
  from "@/models/Notification";

import Task
  from "@/models/Task";

import AuditLog
  from "@/models/AuditLog";

import { requireAuth } from "@/lib/auth-guard";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await requireAuth();

    // 🔥 User memberships
    const memberships =
      await Membership.find({

        user:
          session.user.id,

      });

    const workspaceIds =
      memberships.map(

        (m) =>
          m.workspace

      );

    // 🔥 Stats
    const [

      workspaceCount,

      unreadNotifications,

      pendingTasks,

      recentActivity,

    ] = await Promise.all([

      Workspace.countDocuments({

        _id: {
          $in:
            workspaceIds,
        },

      }),

      Notification.countDocuments({

        user:
          session.user.id,

        isRead:
          false,

      }),

      Task.countDocuments({

        assignee:
          session.user.id,

        status: {

          $ne:
            "done",

        },

      }),

      AuditLog.find({

        workspaceId: {

          $in:
            workspaceIds,

        },

      })

        .populate(

          "actor",

          "username avatar"

        )

        .sort({

          createdAt: -1,

        })

        .limit(15)

        .lean(),

    ]);

    return NextResponse.json({

      success: true,

      stats: {

        workspaceCount,

        unreadNotifications,

        pendingTasks,

      },

      recentActivity,

    });

  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
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