import {
  NextRequest,
  NextResponse,
} from "next/server";

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

    // 🔥 Fetch messages with attachments
    const messages =
      await Message.find({

        attachments: {

          $exists: true,

          $ne: [],

        },

      })

        .populate(

          "sender",

          "username avatar"

        )

        .populate(

          "channel",

          "name workspace"

        )

        .sort({

          createdAt: -1,

        })

        .lean();

    // 🔥 Filter only workspace files
    const workspaceMessages =

      messages.filter(

        (message: any) =>

          message.channel?.workspace?.toString() ===
          workspaceId

      );

    // 🔥 Transform files
    const files =
      await Promise.all(

        workspaceMessages.flatMap(

          async (
            message: any
          ) => {

            return Promise.all(

              message.attachments.map(

                async (
                  attachment: any
                ) => {

                  const signedUrl =

                    await getSignedFileUrl(

                      attachment.key

                    );

                  return {

                    id:
                      `${message._id}-${attachment.key}`,

                    key:
                      attachment.key,

                    type:
                      attachment.type,

                    name:
                      attachment.name ||

                      "Unnamed File",

                    size:
                      attachment.size ||

                      0,

                    url:
                      signedUrl,

                    uploadedAt:
                      message.createdAt,

                    uploadedBy: {

                      id:
                        message.sender?._id,

                      username:
                        message.sender?.username,

                      avatar:
                        message.sender?.avatar,

                    },

                    channel: {

                      id:
                        message.channel?._id,

                      name:
                        message.channel?.name,

                    },

                    messageId:
                      message._id,

                  };

                }

              )

            );

          }

        )

      );

    return NextResponse.json({

      success: true,

      files:
        files.flat(),

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