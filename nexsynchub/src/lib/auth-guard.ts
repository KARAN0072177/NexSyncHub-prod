import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkBan } from "@/lib/check-ban";
import { connectDB } from "@/lib/db";

export async function requireAuth() {
  await connectDB();

  // 🔐 Session
  const session = await getServerSession(authOptions);

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