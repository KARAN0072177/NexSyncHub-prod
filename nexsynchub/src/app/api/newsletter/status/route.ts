import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { newsletterStatusSchema } from "@/lib/validators/newsletter";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed =
      newsletterStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    const subscriber =
      await NewsletterSubscriber.findOne({
        email: parsed.data.email,
      }).select(
        "isVerified isSubscribed"
      );

    if (!subscriber) {
      return NextResponse.json({
        subscriptionStatus: "not_found",
      });
    }

    if (
      subscriber.isVerified &&
      subscriber.isSubscribed
    ) {
      return NextResponse.json({
        subscriptionStatus: "verified",
      });
    }

    if (!subscriber.isSubscribed) {
      return NextResponse.json({
        subscriptionStatus: "unsubscribed",
      });
    }

    return NextResponse.json({
      subscriptionStatus: "pending_verification",
    });
  } catch (error) {
    console.error(
      "NEWSLETTER_STATUS_ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
