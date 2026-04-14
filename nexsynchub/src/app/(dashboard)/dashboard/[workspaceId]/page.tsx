import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Membership from "@/models/Membership";
import "@/models/Workspace";
import WorkspaceClient from "./WorkspaceClient";
import { Building2, Shield, User } from "lucide-react";

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

  const roleDisplay = membership.role.charAt(0).toUpperCase() + membership.role.slice(1);
  const isAdmin = membership.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="h-full flex flex-col">
        {/* Workspace Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {workspace.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${
                      isAdmin
                        ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                        : "bg-gray-500/10 text-gray-300 border-gray-500/30"
                    }`}
                >
                  {isAdmin ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {roleDisplay}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">Workspace ID: {workspaceId.slice(-6)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace Client */}
        <div className="flex-1">
          <WorkspaceClient workspaceId={workspaceId} role={membership.role} />
        </div>
      </div>
    </div>
  );
}