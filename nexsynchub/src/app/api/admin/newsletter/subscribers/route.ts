import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { requireAdmin } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-error";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

type SubscriberFilter = {
  email?: {
    $regex: string;
    $options: string;
  };
  isVerified?: boolean;
  isSubscribed?: boolean;
  source?: string;
};

export async function GET(req: Request) {
  try {
    await connectDB();

    const session = await requireAuth();
    await requireAdmin(session.user.id);

    const { searchParams } = new URL(req.url);
    const search =
      searchParams.get("search")?.trim() || "";
    const status =
      searchParams.get("status") || "all";
    const source =
      searchParams.get("source") || "all";
    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );
    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 20,
        5
      ),
      100
    );
    const skip = (page - 1) * limit;

    const filter: SubscriberFilter = {};

    if (search) {
      filter.email = {
        $regex: search,
        $options: "i",
      };
    }

    if (status === "verified") {
      filter.isVerified = true;
      filter.isSubscribed = true;
    }

    if (status === "pending") {
      filter.isVerified = false;
      filter.isSubscribed = true;
    }

    if (status === "unsubscribed") {
      filter.isSubscribed = false;
    }

    if (source !== "all") {
      filter.source = source;
    }

    const [
      subscribers,
      total,
      totalSubscribers,
      verifiedSubscribers,
      pendingSubscribers,
      unsubscribedSubscribers,
      sources,
    ] = await Promise.all([
      NewsletterSubscriber.find(filter)
        .select(
          [
            "email",
            "isVerified",
            "isSubscribed",
            "source",
            "tags",
            "preferences",
            "lastEmailSentAt",
            "verifiedAt",
            "unsubscribedAt",
            "createdAt",
            "updatedAt",
          ].join(" ")
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsletterSubscriber.countDocuments(filter),
      NewsletterSubscriber.countDocuments(),
      NewsletterSubscriber.countDocuments({
        isVerified: true,
        isSubscribed: true,
      }),
      NewsletterSubscriber.countDocuments({
        isVerified: false,
        isSubscribed: true,
      }),
      NewsletterSubscriber.countDocuments({
        isSubscribed: false,
      }),
      NewsletterSubscriber.distinct("source"),
    ]);

    return NextResponse.json({
      success: true,
      subscribers,
      stats: {
        total: totalSubscribers,
        verified: verifiedSubscribers,
        pending: pendingSubscribers,
        unsubscribed:
          unsubscribedSubscribers,
      },
      sources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "ADMIN_NEWSLETTER_SUBSCRIBERS_ERROR:",
      error
    );

    return handleApiError(error);
  }
}
