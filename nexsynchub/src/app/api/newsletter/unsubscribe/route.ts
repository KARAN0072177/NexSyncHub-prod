import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { hashNewsletterToken } from "@/lib/newsletter-tokens";
import { newsletterTokenSchema } from "@/lib/validators/newsletter";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(req.url);
    const parsed =
      newsletterTokenSchema.safeParse({
        token: searchParams.get("token"),
      });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    const subscriber =
      await NewsletterSubscriber.findOne({
        unsubscribeToken:
          hashNewsletterToken(
            parsed.data.token
          ),
      });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();

    await subscriber.save();

    return NextResponse.json({
      message:
        "You have been unsubscribed.",
    });
  } catch (error) {
    console.error(
      "NEWSLETTER_UNSUBSCRIBE_ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
