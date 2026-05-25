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

import { requireAuth } from "@/lib/auth-guard";

import { createAuditLog } from "@/lib/audit";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(
    req: Request
) {

    try {

        await connectDB();

        // 🔐 Session
        const session =
            await requireAuth();

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

        await createAuditLog({

            workspaceId:
                String(channel.workspace),

            actorId:
                session.user.id,

            action:
                "channel_deleted",

            targetType:
                "channel",

            targetId:
                String(channel._id),

            metadata: {

                channelName:
                    channel.name,

            },

        });

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

        return handleApiError(
            error
        );
    }

}