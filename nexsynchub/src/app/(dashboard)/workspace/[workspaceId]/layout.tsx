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
  accent:   "#3B82F6",
  accentLo: "rgba(59,130,246,0.12)",
  accentMd: "rgba(59,130,246,0.25)",
  surface:  "rgba(15,23,42,0.60)",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  text:     "#F8FAFC",
  muted:    "#94A3B8",
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

          {/* Workspace Header */}
          <div
            className="flex-shrink-0 px-6 py-5 relative z-10"
            style={{
              background: "rgba(3,7,18,0.65)",
              borderBottom: `1px solid ${T.borderHi}`,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)"
            }}
          >

            <div className="flex items-center gap-4">

              <div
                className="p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}
              >

                <Building2
                  size={24}
                  style={{ color: T.accent }}
                />

              </div>

              <div>

                <h1
                  className="text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {workspace.name}
                </h1>

                <div
                  className="flex items-center gap-2.5 mt-1.5"
                >

                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: isAdmin ? T.accentLo : "rgba(255,255,255,0.03)",
                      color: isAdmin ? T.accent : T.muted,
                      border: `1px solid ${isAdmin ? T.accentMd : T.border}`
                    }}
                  >

                    {isAdmin ? (

                      <Shield size={11} />

                    ) : (

                      <User size={11} />

                    )}

                    {roleDisplay}

                  </span>

                  <span style={{ color: T.borderHi }}>
                    •
                  </span>

                  <span className="text-[11px] font-medium" style={{ color: T.muted }}>
                    ID: {workspaceId.slice(-6)}
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
