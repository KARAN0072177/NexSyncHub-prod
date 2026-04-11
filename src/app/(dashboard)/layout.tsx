import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  // ❌ Not logged in
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(session.user.id);

  // ❌ User deleted
  if (!user) {
    redirect("/login");
  }

  // ❌ Username not set
  if (!user.username) {
    redirect("/set-username");
  }

  return <>{children}</>;
}