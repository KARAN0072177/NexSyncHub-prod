import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import "@/models/Workspace";
import WorkspaceClient from "./WorkspaceClient";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getAuthSession();
  const { workspaceId } = await params;

  // ❌ Not logged in
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  await connectDB();

  // 🔐 Check membership
  const membership = await Membership.findOne({
    user: session.user.id,
    workspace: workspaceId,
  }).populate("workspace");

  // ❌ Not a member
  if (!membership) {
    redirect("/dashboard");
  }

  const workspace = membership.workspace as any;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">
        {workspace.name}
      </h1>

      <p className="text-gray-500">
        Role: {membership.role}
      </p>

      <WorkspaceClient
        workspaceId={workspaceId}
        role={membership.role}
      />
    </div>
  );
}