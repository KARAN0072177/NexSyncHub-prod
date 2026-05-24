import { getServerSession }
  from "next-auth";

import { authOptions }
  from "@/lib/auth-options";

import { checkBan }
  from "@/lib/check-ban";

export async function requireAuth() {

  // 🔐 Session
  const session =
    await getServerSession(
      authOptions
    );

  // ❌ Unauthorized
  if (
    !session?.user?.id
  ) {

    throw new Error(
      "Unauthorized"
    );

  }

  // 🔥 Ban check
  await checkBan(
    session.user.id
  );

  return session;

}