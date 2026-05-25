// src/app/api/admin/ai-enhance-moderation/route.ts

import { NextResponse }
    from "next/server";

import OpenAI
    from "openai";

import {
    requireAuth,
} from "@/lib/auth-guard";

import {
    requireAdmin,
} from "@/lib/permissions";

const openai =
    new OpenAI({

        apiKey:
            process.env.OPENAI_API_KEY,

    });

export async function POST(
    req: Request
) {

    try {

        const session =
            await requireAuth();

        await requireAdmin(
            session.user.id
        );

        const {
            reason,
            type,
        } = await req.json();

        if (!reason) {

            return NextResponse.json(

                {
                    error:
                        "Reason required",
                },

                {
                    status: 400,
                }

            );

        }

        const completion =
            await openai.chat.completions.create({

                model:
                    "gpt-4o-mini",

                messages: [

                    {

                        role:
                            "system",

                        content:
                            `You are an expert Trust & Safety specialist for NexSyncHub.
Your task is to rewrite raw, informal moderation notes into highly professional, corporate, and policy-focused statements.
The response must be a single, polished paragraph suitable for formal email notices and permanent audit logs.
Do NOT invent details or exaggerate. Maintain the core meaning but elevate the tone.
Respond ONLY with the final rewritten text. Do not include conversational filler.`,

                    },

                    {

                        role:
                            "user",

                        content:
                            `Moderation Action: ${type}\nRaw Reason: ${reason}\n\nRewrite this professionally.`,

                    },

                ],

                temperature: 0.4,

            });

        const enhanced =
            completion.choices?.[0]
                ?.message?.content;

        return NextResponse.json({

            success: true,

            reason:
                enhanced || reason,

        });

    } catch (error) {

        console.error(
            "AI MODERATION ERROR:",
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