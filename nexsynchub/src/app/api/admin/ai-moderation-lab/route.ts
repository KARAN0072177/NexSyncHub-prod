import {
  NextRequest,
  NextResponse,
} from "next/server";

import OpenAI
  from "openai";

import {
  requireAuth,
} from "@/lib/auth-guard";

import {
  requireSuperAdmin,
} from "@/lib/super-admin";

import {
  handleApiError,
} from "@/lib/api-error";

const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,

  });

export async function POST(
  req: NextRequest
) {

  try {

    // 🔐 Auth
    const session =
      await requireAuth();

    // 🔐 Super admin only
    await requireSuperAdmin(
      session.user.id
    );

    // 🔥 Form data
    const formData =
      await req.formData();

    const file =
      formData.get(
        "image"
      ) as File;

    // ❌ No file
    if (!file) {

      return NextResponse.json(

        {
          error:
            "Image required",
        },

        {
          status: 400,
        }

      );

    }

    // 🔥 Convert to base64
    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    const base64 =
      buffer.toString(
        "base64"
      );

    // 🔥 AI moderation analysis
    const completion =
      await openai.chat.completions.create({

        model:
          "gpt-4o-mini",

        response_format: {

          type:
            "json_object",

        },

        messages: [

          {

            role:
              "system",

            content:

              `You are an expert AI moderation analyst assisting human trust & safety teams.

Analyze the uploaded image carefully for any unsafe content, including:
- Explicit nudity or sexual content
- Graphic violence or gore
- Hate speech, harassment, or extremist symbols
- Illegal activities or illicit substances
- Spam, scams, or deceptive content

Provide a highly professional, human-readable analysis. The summary should read like a formal incident report. The recommendation should provide clear, actionable steps for a human moderator.

Return ONLY valid JSON strictly adhering to this format:

{
  "isExplicit": boolean,
  "confidence": number (0-100),
  "severity": "none" | "low" | "medium" | "high" | "critical",
  "summary": "A detailed, professional explanation of what the image contains and why it was flagged (or why it is safe). Write in clear, complete sentences.",
  "labels": [
    "List of specific detected concepts, e.g., 'weapons', 'nudity', 'text', 'safe'"
  ],
  "recommendation": "A clear, actionable next step for the human moderator (e.g., 'Approve image', 'Ban user account', 'Delete media and issue warning')."
}`,

          },

          {

            role:
              "user",

            content: [

              {

                type:
                  "text",

                text:
                  "Analyze this image for moderation review.",

              },

              {

                type:
                  "image_url",

                image_url: {

                  url:

                    `data:${file.type};base64,${base64}`,

                },

              },

            ],

          },

        ],

      });

    const result =
      JSON.parse(

        completion
          .choices[0]
          .message
          .content || "{}"

      );

    return NextResponse.json({

      success: true,

      analysis:
        result,

    });

  } catch (error) {

    console.error(
      "AI MODERATION LAB ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}