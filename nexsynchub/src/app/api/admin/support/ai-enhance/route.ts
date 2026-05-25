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
import { handleApiError } from "@/lib/api-error";

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

    await requireAdmin(
      session.user.id
    );

    // 🔥 Body
    const body =
      await req.json();

    const {

      type,

      text,

    } = body;

    if (!text?.trim()) {

      return NextResponse.json(
        {
          error:
            "Text required",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Context-aware prompts
    const instruction =

      type === "notes"

        ? `

Rewrite these internal admin notes professionally.

Requirements:
- concise
- operational
- clear
- internal-use tone
- do not exaggerate

`

        : `

Rewrite this customer-facing support resolution professionally.

Requirements:
- empathetic
- professional
- concise
- clear
- customer-friendly
- do not hallucinate

`;

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
              "You are a SaaS support assistant.",

          },

          {

            role:
              "user",

            content:
              `

${instruction}

TEXT:
${text}

              `,

          },

        ],

      });

    return NextResponse.json({

      success: true,

      enhancedText:
        completion.choices[0]
          ?.message?.content,

    });

  } catch (error) {

    console.error(
      "AI ENHANCE ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }

}