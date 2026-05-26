import mongoose from "mongoose";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  getCachedSignedFileUrl,

} from "@/lib/s3";

import {
  connectDB,
} from "@/lib/db";

import Message
  from "@/models/Message";

import Membership
  from "@/models/Membership";

import {
  requireAuth,
} from "@/lib/auth-guard";

import {
  handleApiError,
} from "@/lib/api-error";

import {
  getSignedFileUrl,
} from "@/lib/s3";

export async function GET(

  req: NextRequest,

  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
    }>;
  }

) {

  try {

    await connectDB();

    // 🔐 Auth
    const session =
      await requireAuth();

    const {
      workspaceId,
    } = await params;

    // 🔐 Membership check
    const membership =
      await Membership.findOne({

        user:
          session.user.id,

        workspace:
          workspaceId,

      });

    // ❌ Not member
    if (!membership) {

      return NextResponse.json(

        {
          error:
            "Access denied",
        },

        {
          status: 403,
        }

      );

    }

    // 🔥 Aggregation: Process entirely in the database for massive performance gains
    const rawFiles = await Message.aggregate([
      {
        $match: {
          attachments: { $exists: true, $ne: [] },
        },
      },
      {
        $lookup: {
          from: "channels",
          localField: "channel",
          foreignField: "_id",
          as: "channelDoc",
        },
      },
      {
        $unwind: "$channelDoc",
      },
      {
        // 🔥 Critical optimization: DB filters down to ONLY this workspace immediately
        $match: {
          "channelDoc.workspace": new mongoose.Types.ObjectId(workspaceId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "senderDoc",
        },
      },
      {
        $unwind: {
          path: "$senderDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Flattens the array so each file is its own document!
        $unwind: "$attachments",
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          _id: 0,
          id: { $concat: [{ $toString: "$_id" }, "-", "$attachments.key"] },
          key: "$attachments.key",
          type: "$attachments.type",
          name: { $ifNull: ["$attachments.name", "Unnamed File"] },
          size: { $ifNull: ["$attachments.size", 0] },
          uploadedAt: "$createdAt",
          messageId: "$_id",
          uploadedBy: {
            id: "$senderDoc._id",
            username: "$senderDoc.username",
            avatar: "$senderDoc.avatar",
          },
          channel: {
            id: "$channelDoc._id",
            name: "$channelDoc.name",
          },
        },
      },
    ]);

    // 🔥 Sign URLs in parallel (no more nested flatMaps!)
    const files = await Promise.all(
      rawFiles.map(async (file) => ({
        ...file,
        url: await getCachedSignedFileUrl(file.key),
      }))
    );

    return NextResponse.json({

      success: true,

      files,

    });

  } catch (error) {

    console.error(
      "WORKSPACE FILES ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}