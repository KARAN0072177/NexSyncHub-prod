import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await Notification.find({
      user: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(10); // latest 10

    const unreadCount = await Notification.countDocuments({
      user: session.user.id,
      isRead: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("NOTIFICATION ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}