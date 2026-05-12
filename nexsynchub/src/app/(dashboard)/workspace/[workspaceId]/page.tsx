import { getAuthSession } from "@/lib/auth";

import { redirect } from "next/navigation";

import WorkspaceClient from "./WorkspaceClient";

import { connectDB } from "@/lib/db";

import Membership from "@/models/Membership";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{
    workspaceId: string;
  }>;
}) {

  const session =
    await getAuthSession();

  const { workspaceId } =
    await params;

  // ❌ Not logged in
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  // 🔐 Membership check
  const membership =
    await Membership.findOne({

      user: session.user.id,

      workspace: workspaceId,

    });

  // ❌ Not member
  if (!membership) {
    redirect("/dashboard");
  }

  return (

    <WorkspaceClient
      workspaceId={workspaceId}
      role={membership.role}
    />

  );

}