import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Channel from "@/models/Channel";
import Membership from "@/models/Membership";
import "@/models/User";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// 🔥 S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

export async function GET(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const channelId = searchParams.get("channelId");
    const cursor = searchParams.get("cursor");

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId required" },
        { status: 400 }
      );
    }

    // 🔍 Check channel
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // 🔐 Check membership
    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: channel.workspace,
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const PAGE_SIZE = 20;

    const query: any = { channel: channelId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // 🔥 Fetch messages
    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .populate("sender", "username email")
      .lean();

    // 🔥 Fetch members (for seen count)
    const members = await Membership.find({
      workspace: channel.workspace,
    })
      .select("user lastReadAt")
      .lean();

    // 🔥 Process messages
    const messagesWithUrls = await Promise.all(
      rawMessages.map(async (msg: any) => {
        // 🔥 Handle attachments (OLD + NEW)
        const attachments = await Promise.all(
          (msg.attachments || []).map(async (att: any) => {
            try {
              // ✅ OLD DATA (already has URL)
              if (att.url && !att.key) {
                return att;
              }

              // ❌ No key → skip
              if (!att.key) return null;

              // ✅ NEW DATA → generate signed URL
              const command = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: att.key,
              });

              const signedUrl = await getSignedUrl(s3, command, {
                expiresIn: 3600,
              });

              return {
                ...att,
                url: signedUrl,
              };
            } catch (err) {
              console.error("ATTACHMENT ERROR:", err);
              return null;
            }
          })
        );

        // 🔥 Remove null attachments
        const filteredAttachments = attachments.filter(Boolean);

        // 🔥 Calculate seenCount
        const seenCount = members.filter((m: any) => {
          return (
            m.user.toString() !== msg.sender._id.toString() &&
            m.lastReadAt &&
            new Date(m.lastReadAt) > new Date(msg.createdAt)
          );
        }).length;

        return {
          ...msg,
          attachments: filteredAttachments,
          seenCount,
        };
      })
    );

    return NextResponse.json({
      messages: messagesWithUrls.reverse(), // oldest → newest
      nextCursor:
        messagesWithUrls.length === PAGE_SIZE
          ? messagesWithUrls[messagesWithUrls.length - 1].createdAt
          : null,
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}