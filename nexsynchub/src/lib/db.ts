import "@/lib/dns";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
cached.promise = mongoose.connect(MONGODB_URI, {
  bufferCommands: false,
  family: 4,
  serverSelectionTimeoutMS: 5000,
  directConnection: false,
});
  }

  cached.conn = await cached.promise;
  return cached.conn;
}