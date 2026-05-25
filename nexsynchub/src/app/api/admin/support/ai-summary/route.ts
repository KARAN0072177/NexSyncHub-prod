import { NextResponse }
    from "next/server";

import { getServerSession }
    from "next-auth";

import OpenAI
    from "openai";

import {
    authOptions,
} from "@/lib/auth-options";

import {
    requireAdmin,
} from "@/lib/permissions";

import { requireAuth } from "@/lib/auth-guard";

const openai =
    new OpenAI({

        apiKey:
            process.env.OPENAI_API_KEY,

    });

export async function POST(
    req: Request
) {

    try {

        // 🔐 Session
        const session =
            await requireAuth();

        // 🔐 Admin check
        await requireAdmin(
            session.user.id
        );

        // 🔥 Body
        const body =
            await req.json();

        const {

            subject,

            message,

            category,

            attachments,

        } = body;

        let attachmentAnalysis =
            "";

        // 🔥 Process attachments
        for (
            const file of (
                attachments || []
            )
        ) {

            try {

                // 🔥 IMAGE ANALYSIS
                if (
                    file.mimeType?.startsWith(
                        "image/"
                    )
                    &&
                    file.url
                ) {

                    const imageResponse =
                        await openai.chat.completions.create({

                            model:
                                "gpt-4.1-mini",

                            messages: [

                                {

                                    role:
                                        "user",

                                    content: [

                                        {

                                            type:
                                                "text",

                                            text:
                                                `
Analyze this support attachment image.

Describe:
- what UI/page/screen is visible
- possible issue shown
- important details
- useful support observations                        `,

                                        },

                                        {

                                            type:
                                                "image_url",

                                            image_url: {

                                                url:
                                                    file.url,

                                            },

                                        },

                                    ],

                                },

                            ],

                        });

                    attachmentAnalysis += `

Image (${file.filename}):

${imageResponse.choices[0]
                            ?.message?.content}

`;

                }

                // 🔥 PDF ANALYSIS
                else if (
                    file.mimeType ===
                    "application/pdf"
                ) {

                    // 🔥 Dynamic import
                    const pdfParse =
                        (
                            await import(
                                "pdf-parse/lib/pdf-parse.js"
                            )
                        ).default;

                    const response =
                        await fetch(
                            file.url
                        );

                    const arrayBuffer =
                        await response.arrayBuffer();

                    const pdfData =
                        await pdfParse(

                            Buffer.from(
                                arrayBuffer
                            )

                        );

                    attachmentAnalysis += `

PDF (${file.filename}):

${pdfData.text.slice(
                        0,
                        6000
                    )}

`;

                }

                // 🔥 TEXT / LOG FILES
                else if (

                    file.mimeType?.includes(
                        "text"
                    )

                    ||

                    file.filename?.endsWith(
                        ".log"
                    )

                ) {

                    const response =
                        await fetch(
                            file.url
                        );

                    const text =
                        await response.text();

                    attachmentAnalysis += `

Text File (${file.filename}):

${text.slice(
                        0,
                        6000
                    )}

`;

                }

            } catch (err) {

                console.error(
                    "ATTACHMENT AI ERROR:",
                    err
                );

            }

        }

        // 🔥 Final AI summary
        const completion =
            await openai.chat.completions.create({

                model:
                    "gpt-4.1-mini",

                temperature:
                    0.3,

                messages: [

                    {

                        role:
                            "system",

                        content:
                            `
You are an AI support operations assistant for NexSyncHub.

Generate concise operational summaries for admins.

Your response should include:
- Issue Summary
- Attachment Analysis
- Urgency
- Recommended Action

Keep response practical and operational.
              `,

                    },

                    {

                        role:
                            "user",

                        content:
                            `

CATEGORY:
${category}

SUBJECT:
${subject}

USER MESSAGE:
${message}

ATTACHMENT ANALYSIS:
${attachmentAnalysis}

              `,

                    },

                ],

            });

        return NextResponse.json({

            success: true,

            summary:
                completion.choices[0]
                    ?.message?.content,

        });

    } catch (error) {

        console.error(
            "AI SUPPORT SUMMARY ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to generate AI summary",
            },
            {
                status: 500,
            }
        );

    }

}