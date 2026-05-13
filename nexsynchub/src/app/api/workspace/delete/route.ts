// to delete a workspace
// (only for owners)
// and all related data

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

import Message
    from "@/models/Message";

import Task
    from "@/models/Task";

export async function DELETE(
    req: Request
) {

    try {

        await connectDB();

        // 🔐 Session
        const session =
            await getServerSession(
                authOptions
            );

        if (!session?.user?.id) {

            return NextResponse.json(
                {
                    error: "Unauthorized",
                },
                {
                    status: 401,
                }
            );

        }

        // 🔥 Body
        const body =
            await req.json();

        const {
            workspaceId,
        } = body;

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

                user: session.user.id,

                workspace: workspaceId,

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

        // ❌ Only owner
        const role =
            membership.role.toLowerCase();

        // ❌ Only owner
        if (
            role !== "owner"
        ) {

            return NextResponse.json(
                {
                    error:
                        "Only workspace owner can delete workspace",
                },
                {
                    status: 403,
                }
            );

        }

        // 🔥 Find all channels
        const channels =
            await Channel.find({
                workspace: workspaceId,
            });

        // 🔥 Extract channel IDs
        const channelIds =
            channels.map(
                (ch) => ch._id
            );

        // 🔥 Delete messages FIRST
        await Message.deleteMany({
            channel: {
                $in: channelIds,
            },
        });

        // 🔥 Delete channels
        await Channel.deleteMany({
            workspace: workspaceId,
        });

        // 🔥 Delete memberships
        await Membership.deleteMany({
            workspace: workspaceId,
        });

        // 🔥 Delete tasks
        await Task.deleteMany({
            workspace: workspaceId,
        });

        // 🔥 Finally delete workspace
        await Workspace.findByIdAndDelete(
            workspaceId
        );

        return NextResponse.json({

            success: true,

            message:
                "Workspace deleted successfully",

        });

    } catch (error) {

        console.error(
            "DELETE WORKSPACE ERROR:",
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