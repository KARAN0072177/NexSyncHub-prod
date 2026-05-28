import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { sendNewsletterVerificationEmail } from "@/lib/newsletter-email";
import {
  createNewsletterUnsubscribeToken,
  createNewsletterVerificationToken,
} from "@/lib/newsletter-tokens";
import { newsletterSubscribeSchema } from "@/lib/validators/newsletter";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

function isDuplicateKeyError(
  error: unknown
): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed =
      newsletterSubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Invalid subscription request",
        },
        { status: 400 }
      );
    }

    const {
      email,
      source = "public_site",
      tags = [],
    } = parsed.data;

    const verification =
      createNewsletterVerificationToken();

    const existingSubscriber =
      await NewsletterSubscriber.findOne({
        email,
      });

    if (existingSubscriber) {
      if (
        existingSubscriber.isSubscribed &&
        existingSubscriber.isVerified
      ) {
        return NextResponse.json(
          {
            subscriptionStatus: "already_verified",
            message:
              "Already verified.",
          },
          { status: 200 }
        );
      }

      existingSubscriber.isSubscribed = true;
      existingSubscriber.verificationToken =
        verification.hashedToken;
      existingSubscriber.verificationTokenExpiresAt =
        verification.expiresAt;
      existingSubscriber.source =
        existingSubscriber.source || source;
      existingSubscriber.tags = Array.from(
        new Set([
          ...existingSubscriber.tags,
          ...tags,
        ])
      );
      existingSubscriber.unsubscribedAt = null;

      if (!existingSubscriber.unsubscribeToken) {
        existingSubscriber.unsubscribeToken =
          createNewsletterUnsubscribeToken()
            .hashedToken;
      }

      await existingSubscriber.save();
      await sendNewsletterVerificationEmail({
        email,
        token: verification.token,
      });

      return NextResponse.json({
        subscriptionStatus: "verification_sent",
        message:
          "Verification email sent.",
      });
    }

    const unsubscribe =
      createNewsletterUnsubscribeToken();

    await NewsletterSubscriber.create({
      email,
      isVerified: false,
      isSubscribed: true,
      verificationToken: verification.hashedToken,
      verificationTokenExpiresAt:
        verification.expiresAt,
      unsubscribeToken: unsubscribe.hashedToken,
      source,
      tags,
    });

    await sendNewsletterVerificationEmail({
      email,
      token: verification.token,
    });

    return NextResponse.json(
      {
        subscriptionStatus: "verification_sent",
        message:
          "Verification email sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          subscriptionStatus: "received",
          message:
            "Subscription request received.",
        },
        { status: 200 }
      );
    }

    console.error(
      "NEWSLETTER_SUBSCRIBE_ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
