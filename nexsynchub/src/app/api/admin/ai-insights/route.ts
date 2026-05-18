import { NextResponse }
    from "next/server";

import { getServerSession }
    from "next-auth";

import { authOptions }
    from "@/lib/auth-options";

import { connectDB }
    from "@/lib/db";

import { openai }
    from "@/lib/openai";

import AuditLog
    from "@/models/AuditLog";

import SecurityLog
    from "@/models/SecurityLog";

import {
    requireAdmin,
} from "@/lib/permissions";

import AIInsightCache
    from "@/models/AIInsightCache";

export async function GET(req: Request) {

    const {
        searchParams,
    } = new URL(req.url);

    const forceRefresh =

        searchParams.get(
            "refresh"
        ) === "true";

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

        // 🔥 Fetch recent logs
        const securityLogs =
            await SecurityLog.find()

                .sort({
                    createdAt: -1,
                })

                .limit(20)

                .lean();

        const auditLogs =
            await AuditLog.find()

                .sort({
                    createdAt: -1,
                })

                .limit(20)

                .lean();

        // 🔥 Build compact telemetry summary
        const telemetry = [

            ...securityLogs.map(
                (log) =>

                    `SECURITY: ${log.action}`
            ),

            ...auditLogs.map(
                (log) =>

                    `AUDIT: ${log.action}`
            ),

        ].join("\n");

        // 🔥 Check latest cache
        const cache =

            await AIInsightCache
                .findOne()
                .sort({
                    generatedAt: -1,
                });

        // 🔥 Cache validity
        const THIRTY_MINUTES =

            1000 * 60 * 30;

        const isFresh =

            cache &&

            Date.now() -

            new Date(
                cache.generatedAt
            ).getTime()

            < THIRTY_MINUTES;

        // ✅ Return cached insights
        if (
            isFresh &&
            !forceRefresh
        ) {

            return NextResponse.json({

                success: true,

                insights:
                    cache.insights,

                cached: true,

                generatedAt:
                    cache.generatedAt,

            });

        }

        // 🔥 AI analysis
        const completion =
            await openai.chat.completions.create({

                model:
                    "gpt-4o-mini",

                messages: [

                    {
                        role: "system",

                        content:

                            `You are an expert Chief Information Security Officer (CISO) and Platform Operations Manager.
Analyze the provided platform data and generate a comprehensive list of all highly actionable, structured insights discovered from the telemetry data. Do not artificially limit the number of insights; generate as many as the data warrants.

FORMATTING RULES:
1. Separate each distinct insight with exactly TWO NEWLINES (\\n\\n). Do NOT use numbers like 1., 2., etc. to separate them.
2. For each insight, start with a concise, bolded title, followed by a short summary.
3. Use bullet points for specific impact metrics or recommendations.
4. Keep the tone professional, urgent if necessary, and highly readable.

Example Output Format:
**Security Alert: Spike in Failed Logins**
We detected a 45% increase in failed login attempts from unknown IP addresses over the last 24 hours.
* **Impact:** Potential brute-force attack in progress.
* **Action Needed:** Temporarily lower the threshold for account lockouts.

**Growth Milestone: Record Registrations**
New user registrations have grown by 15% week-over-week.
* **Impact:** Increased load on database.
* **Action Needed:** Monitor queue health and scale up background workers.`,
                    },

                    {
                        role: "user",

                        content:

                            `Recent platform telemetry:

${telemetry}`,
                    },

                ],

                temperature: 0.3,

                max_tokens: 1500,

            });

        const insights =

            completion.choices[0]
                ?.message?.content

            ||

            "No insights available.";

        // 🔥 Save fresh cache
        await AIInsightCache.create({

            insights,

        });

        return NextResponse.json({

            success: true,

            insights,

        });

    } catch (error) {

        console.error(
            "AI INSIGHTS ERROR:",
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