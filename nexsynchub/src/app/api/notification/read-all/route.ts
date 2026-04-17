import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await Notification.updateMany(
      {
        user: session.user.id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("READ ALL ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}