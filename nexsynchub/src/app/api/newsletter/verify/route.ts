import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { hashNewsletterToken } from "@/lib/newsletter-tokens";
import { newsletterTokenSchema } from "@/lib/validators/newsletter";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

function redirectToNewsletterStatus(
  req: Request,
  status: "confirmed" | "invalid"
) {
  const url = new URL("/", req.url);
  url.searchParams.set(
    "newsletter",
    status
  );

  return NextResponse.redirect(url);
}

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
      return redirectToNewsletterStatus(
        req,
        "invalid"
      );
    }

    const hashedToken =
      hashNewsletterToken(parsed.data.token);

    const subscriber =
      await NewsletterSubscriber.findOne({
        verificationToken: hashedToken,
        verificationTokenExpiresAt: {
          $gt: new Date(),
        },
      });

    if (!subscriber) {
      return redirectToNewsletterStatus(
        req,
        "invalid"
      );
    }

    subscriber.isVerified = true;
    subscriber.isSubscribed = true;
    subscriber.verifiedAt =
      subscriber.verifiedAt || new Date();
    subscriber.verificationToken = undefined;
    subscriber.verificationTokenExpiresAt =
      undefined;
    subscriber.unsubscribedAt = null;

    await subscriber.save();

    return redirectToNewsletterStatus(
      req,
      "confirmed"
    );
  } catch (error) {
    console.error(
      "NEWSLETTER_VERIFY_ERROR:",
      error
    );

    return redirectToNewsletterStatus(
      req,
      "invalid"
    );
  }
}
