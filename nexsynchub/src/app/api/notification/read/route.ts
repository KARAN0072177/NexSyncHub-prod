import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();

    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId required" },
        { status: 400 }
      );
    }

    await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: session.user.id,
      },
      { isRead: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MARK READ ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}