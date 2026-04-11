import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Invite from "@/models/Invite";
import Membership from "@/models/Membership";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    const invite = await Invite.findOne({ token });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite" },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite expired" },
        { status: 400 }
      );
    }

    // 🔍 Check if already member
    const existing = await Membership.findOne({
      user: session.user.id,
      workspace: invite.workspace,
    });

    if (existing) {
      return NextResponse.json({
        message: "Already a member",
      });
    }

    // ✅ Create membership
    await Membership.create({
      user: session.user.id,
      workspace: invite.workspace,
      role: invite.role,
    });

    return NextResponse.json({
      message: "Joined workspace successfully",
    });
  } catch (error) {
    console.error("ACCEPT INVITE ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}