import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api-error";

export async function PATCH() {
  try {
    await connectDB();

    const session =
      await requireAuth();

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

    return handleApiError(
      err
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}