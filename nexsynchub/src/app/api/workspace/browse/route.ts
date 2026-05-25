import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Workspace from "@/models/Workspace";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    await connectDB();

    const workspaces = await Workspace.find({
      isPrivate: false, // ✅ ONLY PUBLIC
    }).select("name avatar description createdAt");

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("BROWSE WORKSPACES ERROR:", error);

    return handleApiError(
      error
    );
  }
}