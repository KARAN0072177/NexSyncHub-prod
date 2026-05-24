import { NextResponse }
  from "next/server";

import OpenAI
  from "openai";

const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,

  });

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const {

      category,

      subject,

      message,

    } = body;

    // ❌ Validate
    if (
      !subject?.trim()
      ||
      !message?.trim()
    ) {

      return NextResponse.json(
        {
          error:
            "Subject and message required",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Category-aware instructions
    const categoryInstructions = {

      bug_report:
        `
        Focus on:
        - clearer issue explanation
        - reproduction details
        - expected vs actual behavior
        `,

      billing:
        `
        Focus on:
        - payment clarity
        - transaction concerns
        - account impact
        `,

      feedback:
        `
        Focus on:
        - constructive feedback
        - organized suggestions
        `,

      feature_request:
        `
        Focus on:
        - feature usefulness
        - workflow improvement
        `,

      workspace_report:
        `
        Focus on:
        - moderation clarity
        - factual reporting
        `,

      account_support:
        `
        Focus on:
        - account access clarity
        - login or verification details
        `,

      general:
        `
        Focus on:
        - professional wording
        - clarity
        `,

      other:
        `
        Focus on:
        - concise explanation
        `,

    };

    // 🔥 AI Prompt
    const prompt = `

You are an AI assistant for NexSyncHub support.

Rewrite the support request professionally and clearly.

IMPORTANT RULES:
- Keep original meaning
- Do NOT invent details
- Do NOT hallucinate
- Do NOT exaggerate
- Make message concise and professional
- Improve readability
- Keep technical accuracy

CATEGORY CONTEXT:
${categoryInstructions[
  category as keyof typeof categoryInstructions
] || ""}

ORIGINAL SUBJECT:
${subject}

ORIGINAL MESSAGE:
${message}

Return ONLY valid JSON:

{
  "enhancedSubject": "...",
  "enhancedMessage": "..."
}

`;

    // 🔥 OpenAI request
    const completion =
      await openai.chat.completions.create({

        model:
          "gpt-4.1-mini",

        temperature:
          0.4,

        messages: [

          {

            role:
              "system",

            content:
              "You rewrite SaaS support tickets professionally.",

          },

          {

            role:
              "user",

            content:
              prompt,

          },

        ],

      });

    const content =
      completion.choices[0]
        ?.message?.content;

    if (!content) {

      return NextResponse.json(
        {
          error:
            "AI failed to generate response",
        },
        {
          status: 500,
        }
      );

    }

    // 🔥 Parse AI JSON
    const parsed =
      JSON.parse(content);

    return NextResponse.json({

      success: true,

      enhancedSubject:
        parsed.enhancedSubject,

      enhancedMessage:
        parsed.enhancedMessage,

    });

  } catch (error) {

    console.error(
      "SUPPORT AI ENHANCE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to enhance message",
      },
      {
        status: 500,
      }
    );

  }

}