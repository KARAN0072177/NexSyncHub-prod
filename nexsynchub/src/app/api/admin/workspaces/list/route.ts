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

import Channel
  from "@/models/Channel";

import Task
  from "@/models/Task";

import {
  requireAdmin,
} from "@/lib/permissions";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  req: Request
) {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await requireAuth();

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Fetch workspaces
    const workspaces =
      await Workspace.find()

        .sort({
          createdAt: -1,
        })

        .lean();

    // 🔥 Enrich data
    const enriched =
      await Promise.all(

        workspaces.map(
          async (
            workspace: any
          ) => {

            const [

              members,

              channels,

              tasks,

              owner,

            ] = await Promise.all([

              Membership.countDocuments({
                workspace:
                  workspace._id,
              }),

              Channel.countDocuments({
                workspace:
                  workspace._id,
              }),

              Task.countDocuments({
                workspace:
                  workspace._id,
              }),

              Membership.findOne({

                workspace:
                  workspace._id,

                role: "OWNER",

              }).populate(
                "user",
                "username email"
              ),

            ]);

            return {

              ...workspace,

              members,

              channels,

              tasks,

              owner:
                owner?.user || null,

            };

          }
        )

      );

    return NextResponse.json({

      success: true,

      workspaces:
        enriched,

    });

  } catch (error) {

    console.error(
      "ADMIN WORKSPACES ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }

}