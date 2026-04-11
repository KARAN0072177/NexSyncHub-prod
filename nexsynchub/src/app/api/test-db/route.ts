import { connectDB } from "../../../lib/db";

export async function GET() {
  try {
    await connectDB();
    return Response.json({ message: "MongoDB connected successfully ✅" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage });
  }
}