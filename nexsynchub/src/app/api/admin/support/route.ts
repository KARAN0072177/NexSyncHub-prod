import { NextResponse }
  from "next/server";

import {
  connectDB,
} from "@/lib/db";

import {
  requireAdmin,
} from "@/lib/permissions";

import SupportTicket
  from "@/models/SupportTicket";

import {
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

import {
  s3,
} from "@/lib/s3";

import { requireAuth } from "@/lib/auth-guard";

export async function GET() {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await requireAuth();

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Fetch tickets
    // 🔥 Fetch tickets
    const rawTickets =
      await SupportTicket.find()

        .populate(

          "user",

          "username email avatar role"

        )

        .populate(

          "handledBy",

          "username email avatar"

        )

        .sort({
          createdAt: -1,
        })

        .lean();

    // 🔥 Generate signed URLs
    const tickets =
      await Promise.all(

        rawTickets.map(
          async (ticket: any) => {

            const attachments =
              await Promise.all(

                (
                  ticket.attachments || []
                ).map(
                  async (
                    file: any
                  ) => {

                    // ✅ Old public URLs
                    if (
                      file.url
                    ) {

                      return file;

                    }

                    // ❌ Missing key
                    if (
                      !file.key
                    ) {

                      return file;

                    }

                    // 🔥 Create signed URL
                    const command =
                      new GetObjectCommand({

                        Bucket:
                          process.env
                            .AWS_BUCKET_NAME!,

                        Key:
                          file.key,

                      });

                    const signedUrl =
                      await getSignedUrl(

                        s3,
                        command,

                        {

                          expiresIn:
                            3600,

                        }

                      );

                    return {

                      ...file,

                      url:
                        signedUrl,

                    };

                  }
                )
              );

            return {

              ...ticket,

              attachments,

            };

          }
        )
      );

    return NextResponse.json({

      success: true,

      tickets,

    });

  } catch (error) {

    console.error(
      "ADMIN SUPPORT FETCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong",
      },
      {
        status: 500,
      }
    );

  }

}