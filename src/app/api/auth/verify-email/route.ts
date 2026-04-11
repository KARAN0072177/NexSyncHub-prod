import { connectDB } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 400 }
            );
        }

        // 🔐 Hash incoming token
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 🔍 Find user
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Token expired or invalid" },
                { status: 400 }
            );
        }

        // ✅ Update user
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        return NextResponse.json({
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("VERIFY ERROR:", error);

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}