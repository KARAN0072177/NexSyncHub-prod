import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";
import { getWorkspaceActivityChannel } from "@/lib/workspace-activity";

export async function GET(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    // 🔐 Check membership
    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: workspaceId,
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await getWorkspaceActivityChannel(String(workspaceId));

    const channels = await Channel.find({
      workspace: workspaceId,
    })
      .sort({ isSystem: -1, createdAt: 1 })
      .lean();

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("GET CHANNELS ERROR:", error);

    return handleApiError(
      error
    );
  }
}
