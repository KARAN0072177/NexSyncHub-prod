// to delete a channel and all related messages

import { NextResponse }
    from "next/server";

import { getServerSession }
    from "next-auth";

import { authOptions }
    from "@/lib/auth-options";

import { connectDB }
    from "@/lib/db";

import Channel
    from "@/models/Channel";

import Membership
    from "@/models/Membership";

import Message
    from "@/models/Message";

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
            channelId,
        } = body;

        // 🔥 Validate
        if (!channelId) {

            return NextResponse.json(
                {
                    error:
                        "Channel ID required",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Find channel
        const channel =
            await Channel.findById(
                channelId
            );

        if (!channel) {

            return NextResponse.json(
                {
                    error:
                        "Channel not found",
                },
                {
                    status: 404,
                }
            );

        }

        // 🔐 Membership check
        const membership =
            await Membership.findOne({

                user: session.user.id,

                workspace:
                    channel.workspace,

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

        // ❌ Only owner/admin
        // 🔥 Normalize role
        const role =
            membership.role.toLowerCase();

        // ❌ Only owner/admin
        const allowedRoles = [
            "owner",
            "admin",
        ];

        if (
            !allowedRoles.includes(
                role
            )
        ) {

            return NextResponse.json(
                {
                    error:
                        "Insufficient permissions",
                },
                {
                    status: 403,
                }
            );

        }

        // 🔥 Prevent deleting last channel
        const totalChannels =
            await Channel.countDocuments({

                workspace:
                    channel.workspace,

            });

        if (totalChannels <= 1) {

            return NextResponse.json(
                {
                    error:
                        "Workspace must have at least one channel",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Delete messages
        await Message.deleteMany({
            channel: channelId,
        });

        // 🔥 Delete channel
        await Channel.findByIdAndDelete(
            channelId
        );

        return NextResponse.json({

            success: true,

            message:
                "Channel deleted successfully",

        });

    } catch (error) {

        console.error(
            "DELETE CHANNEL ERROR:",
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