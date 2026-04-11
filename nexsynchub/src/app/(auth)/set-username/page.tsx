import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SetUsernameClient from "./SetUsernameClient";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export default async function SetUsernamePage() {
  const session = await getAuthSession();

  // ❌ Not logged in
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  await connectDB();

  // 🔥 ALWAYS check DB (not session)
  const user = await User.findById(session.user.id);

  // ❌ User deleted / not found
  if (!user) {
    redirect("/login");
  }

  // ❌ Already has username
  if (user.username) {
    redirect("/dashboard");
  }

  // ✅ Allowed
  return <SetUsernameClient />;
}