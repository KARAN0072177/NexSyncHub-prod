import { getAuthSession } from "@/lib/auth";

import { redirect } from "next/navigation";

import { connectDB } from "@/lib/db";

import Membership from "@/models/Membership";

import "@/models/Workspace";

import {
  Building2,
  Shield,
  User,
} from "lucide-react";

import WorkspaceSidebar
  from "./WorkspaceSidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;

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

    }).populate("workspace");

  // ❌ Not member
  if (!membership) {
    redirect("/dashboard");
  }

  const workspace =
    membership.workspace as any;

  const roleDisplay =
    membership.role.charAt(0)
      .toUpperCase() +
    membership.role.slice(1);

  const isAdmin =
    membership.role === "admin";

  return (

    <div
      className="
      h-screen
      overflow-hidden
      bg-gradient-to-br
      from-gray-950
      via-gray-900
      to-gray-950
      "
    >

      <div className="flex h-full">

        {/* Sidebar */}
        <WorkspaceSidebar
          workspaceId={workspaceId}
          role={membership.role}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Workspace Header */}
          <div
            className="
            flex-shrink-0
            px-6 py-4
            border-b border-gray-800/50
            bg-gray-900/30
            backdrop-blur-sm
            "
          >

            <div className="flex items-center gap-4">

              <div
                className="
                p-2
                bg-indigo-500/10
                rounded-xl
                border border-indigo-500/20
                "
              >

                <Building2
                  className="
                  w-6 h-6
                  text-indigo-400
                  "
                />

              </div>

              <div>

                <h1
                  className="
                  text-2xl
                  font-semibold
                  text-white
                  tracking-tight
                  "
                >
                  {workspace.name}
                </h1>

                <div
                  className="
                  flex items-center
                  gap-2
                  mt-0.5
                  "
                >

                  <span
                    className={`
                    inline-flex
                    items-center gap-1
                    px-2.5 py-0.5
                    rounded-full
                    text-xs font-medium
                    border

                    ${
                      isAdmin
                        ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                        : "bg-gray-500/10 text-gray-300 border-gray-500/30"
                    }
                    `}
                  >

                    {isAdmin ? (

                      <Shield className="w-3 h-3" />

                    ) : (

                      <User className="w-3 h-3" />

                    )}

                    {roleDisplay}

                  </span>

                  <span className="text-xs text-gray-500">
                    •
                  </span>

                  <span className="text-xs text-gray-500">
                    Workspace ID:
                    {" "}
                    {workspaceId.slice(-6)}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* Dynamic Content */}
          <div className="flex-1 min-h-0">
            {children}
          </div>

        </div>

      </div>

    </div>

  );

}
