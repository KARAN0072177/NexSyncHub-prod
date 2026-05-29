import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { ticketId } = resolvedParams;

        if (!ticketId) {
            return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
        }

        await connectDB();

        const ticket = await SupportTicket.findOneAndUpdate(
            { _id: ticketId, user: session.user.id },
            { $set: { hasUnreadAdminReply: false } },
            { new: true }
        );

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("MARK READ ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}