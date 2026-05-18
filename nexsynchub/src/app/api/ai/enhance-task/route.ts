import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { openai }
  from "@/lib/openai";

export async function POST(
  req: Request
) {

  try {

    // 🔐 Auth check
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

    // 🔥 Parse body
    const body =
      await req.json();

    const {
      text,
    } = body;

    if (!text?.trim()) {

      return NextResponse.json(
        {
          error:
            "Text is required",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 AI enhancement
    const completion =
      await openai.chat.completions.create({

        model:
          "gpt-4.1-mini",

        messages: [

          {
            role: "system",

            content:

              `You are an assistant helping improve SaaS task descriptions.

Expand short tasks into professional, clear, concise engineering task descriptions.

Keep response under 120 words.

Do not use markdown.`,

          },

          {
            role: "user",

            content:
              text,

          },

        ],

        temperature: 0.5,

      });

    const enhancedText =

      completion.choices[0]
        ?.message?.content

      ||

      text;

    return NextResponse.json({

      success: true,

      text:
        enhancedText,

    });

  } catch (error) {

    console.error(
      "AI TASK ENHANCE ERROR:",
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