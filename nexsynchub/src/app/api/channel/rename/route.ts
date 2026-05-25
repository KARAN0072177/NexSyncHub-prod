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

import {requireAuth} from "@/lib/auth-guard";

import { createAuditLog } from "@/lib/audit";

export async function PATCH(
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
            name,
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

        if (!name?.trim()) {

            return NextResponse.json(
                {
                    error:
                        "Channel name required",
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

        const oldName = channel.name;

        // 🔥 Rename
        channel.name =
            name.trim();

        await channel.save();

        await createAuditLog({

            workspaceId:
                String(channel.workspace),

            actorId:
                session.user.id,

            action:
                "channel_renamed",

            targetType:
                "channel",

            targetId:
                String(channel._id),

            metadata: {

                oldName,

                newName:
                    channel.name,

            },

        });

        return NextResponse.json({

            success: true,

            channel,

        });

    } catch (error) {

        console.error(
            "RENAME CHANNEL ERROR:",
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