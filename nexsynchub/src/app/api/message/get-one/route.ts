import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");

  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  const message = await Message.findById(messageId)
    .populate("sender", "username")
    .lean();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ message });
}