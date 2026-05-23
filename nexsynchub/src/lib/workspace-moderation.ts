import OpenAI
  from "openai";

const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,

  });

// 🔥 Suspicious keywords
const suspiciousKeywords = [

  "porn",
  "nude",
  "sex",
  "cartel",
  "drugs",
  "terror",
  "isis",
  "cocaine",
  "meth",
  "fraud",
  "scam",

];

// 🔥 Fast keyword check
function containsSuspiciousKeyword(
  text: string
) {

  const lower =
    text.toLowerCase();

  return suspiciousKeywords.some(
    (word) =>
      lower.includes(word)
  );

}

// 🔥 AI moderation
export async function
moderateWorkspaceName(
  workspaceName: string
) {

  // ✅ Skip AI if clean
  if (
    !containsSuspiciousKeyword(
      workspaceName
    )
  ) {

    return {
      safe: true,
    };

  }

  // 🔥 AI classification
  const completion =

    await openai.chat.completions.create({

      model:
        "gpt-4o-mini",

      temperature: 0,

      max_tokens: 5,

      messages: [

        {

          role: "system",

          content: `

You are a workspace safety classifier.

Determine if a workspace name violates community safety rules.

BLOCK if it includes:
- pornography
- explicit sexual content
- illegal criminal organizations
- terrorism/extremism
- drug trafficking
- scams/fraud
- hate groups

Respond ONLY with:
SAFE

or

BLOCKED

          `,

        },

        {

          role: "user",

          content:
            `Workspace Name: "${workspaceName}"`,

        },

      ],

    });

  const result =

    completion.choices[0]
      .message.content
      ?.trim();

  return {

    safe:
      result === "SAFE",

  };

}