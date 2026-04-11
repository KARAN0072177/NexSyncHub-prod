import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Workspace from "@/models/Workspace";
import Membership from "@/models/Membership";
import { createWorkspaceSchema } from "@/lib/validators/workspace";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    await connectDB();

    // 🔐 Auth check
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🧠 Parse body
    const body = await req.json();

    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, isPrivate } = parsed.data;

    // 🏢 Create workspace
    const workspace = await Workspace.create({
      name,
      owner: session.user.id,
      isPrivate: isPrivate ?? true, // Default to private if not provided
    });

    // 👑 Create OWNER membership
    await Membership.create({
      user: session.user.id,
      workspace: workspace._id,
      role: "OWNER",
    });

    return NextResponse.json(
      {
        message: "Workspace created successfully",
        workspace,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE WORKSPACE ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}