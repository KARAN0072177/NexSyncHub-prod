import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Invite from "@/models/Invite";
import Membership from "@/models/Membership";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateInviteToken } from "@/lib/invite-token";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await req.json();

    // 🔍 Check membership (only OWNER/ADMIN can invite)
    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    const token = generateInviteToken();

    const invite = await Invite.create({
      workspace: workspaceId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      createdBy: session.user.id,
    });

    return NextResponse.json({
      inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`,
    });
  } catch (error) {
    console.error("CREATE INVITE ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}