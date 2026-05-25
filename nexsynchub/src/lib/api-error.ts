import { NextResponse }
  from "next/server";

export function handleApiError(
  error: any
) {

  console.error(error);

  // 🔥 Structured errors
  try {

    const parsed =
      JSON.parse(
        error.message
      );

    // 🔥 Ban response
    if (
      parsed.code ===
      "ACCOUNT_BANNED"
    ) {

      return NextResponse.json(

        parsed,

        {
          status: 403,
        }

      );

    }

  } catch {}

  // ❌ Fallback
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