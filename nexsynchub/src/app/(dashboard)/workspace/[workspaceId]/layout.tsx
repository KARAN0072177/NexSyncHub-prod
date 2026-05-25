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

/* ─── design tokens ──────────────────────────────────────────────────────── */
const T = {
  accent: "#3B82F6",
  accentLo: "rgba(59,130,246,0.12)",
  accentMd: "rgba(59,130,246,0.25)",
  surface: "rgba(15,23,42,0.60)",
  border: "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  text: "#F8FAFC",
  muted: "#94A3B8",
};

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
      className="h-screen overflow-hidden"
      style={{ background: "#030712", color: T.text, fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
      `}</style>

      <div className="flex h-full">

        {/* Sidebar */}
        <WorkspaceSidebar
          workspaceId={workspaceId}
          role={membership.role}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Dynamic Content */}
          <div className="flex-1 min-h-0">
            {children}
          </div>

        </div>

      </div>

    </div>

  );

}
