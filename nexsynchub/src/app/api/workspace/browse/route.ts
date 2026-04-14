import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Workspace from "@/models/Workspace";

export async function GET() {
  try {
    await connectDB();

    const workspaces = await Workspace.find({
      isPrivate: false, // ✅ ONLY PUBLIC
    }).select("name createdAt");

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("BROWSE WORKSPACES ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}