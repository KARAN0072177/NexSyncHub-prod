import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import Message from "@/models/Message";
import Membership from "@/models/Membership";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(
    req: Request
) {

    try {

        await connectDB();

        const session =
            await requireAuth();

        const body =
            await req.json();

        const {
            messageId,
            emoji,
        } = body;

        if (
            !messageId ||
            !emoji
        ) {

            return NextResponse.json(
                {
                    error:
                        "Message ID and emoji required",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Find message
        const message =
            await Message.findById(
                messageId
            );

        if (!message) {

            return NextResponse.json(
                {
                    error:
                        "Message not found",
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

        if (!message.reactions) {
            message.reactions = [];
        }

        // 🔥 Find reaction
        const existingReaction =
            message.reactions.find(
                (r: any) =>
                    r.emoji === emoji
            );

        // ✅ Reaction exists
        if (existingReaction) {

            const alreadyReacted =
                existingReaction.users.some(
                    (id: any) =>
                        String(id) ===
                        String(session.user.id)
                );

            // 🔥 Remove reaction
            if (alreadyReacted) {

                existingReaction.users =
                    existingReaction.users.filter(
                        (id: any) =>
                            String(id) !==
                            String(session.user.id)
                    );

                // 🔥 Remove emoji if empty
                if (
                    existingReaction.users
                        .length === 0
                ) {

                    message.reactions =
                        message.reactions.filter(
                            (r: any) =>
                                r.emoji !== emoji
                        );

                }

            }

            // 🔥 Add reaction
            else {

                existingReaction.users.push(
                    session.user.id
                );

            }

        }

        // ✅ New emoji reaction
        else {

            message.reactions.push({
                emoji,
                users: [session.user.id],
            });

        }

        message.markModified(
            "reactions"
        );

        await message.save();

        // 🔥 Emit reaction update via WebSocket

        await fetch(
            `${process.env.NEXT_PUBLIC_SOCKET_URL}/emit`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    channelId:
                        String(message.channel),

                    event:
                        "message_reaction_update",

                    data: {
                        messageId:
                            message._id,

                        reactions:
                            message.reactions,
                    },
                }),
            }
        );

        return NextResponse.json({

            success: true,

            messageId:
                message._id,

            reactions:
                message.reactions,

        });

    } catch (error) {

        console.error(
            "REACTION ERROR:",
            error
        );

        return handleApiError(
            error
        );
    }

}