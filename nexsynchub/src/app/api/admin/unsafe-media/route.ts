import {
  NextResponse,
} from "next/server";

import {
  connectDB,
} from "@/lib/db";

import {
  requireAuth,
} from "@/lib/auth-guard";

import {
  requireSuperAdmin,
} from "@/lib/super-admin";

import {
  handleApiError,
} from "@/lib/api-error";

import SecurityLog
  from "@/models/SecurityLog";

import {

  getSignedFileUrl,

} from "@/lib/s3";

type UnsafeMediaLog = {
  metadata?: {
    evidenceKey?: string;
    evidenceUrl?: string;
  };
};

export async function GET() {

  try {

    await connectDB();

    // 🔐 Auth
    const session =
      await requireAuth();

    // 🔐 Super admin only
    await requireSuperAdmin(
      session.user.id
    );

    // 🔥 Fetch unsafe logs
    const logs =
      await SecurityLog.find({

        action: {

          $in: [

            "unsafe_avatar_upload",

            "unsafe_workspace_avatar_upload",

            "unsafe_support_attachment",

            "unsafe_chat_attachment",

          ],

        },

      })

        .populate(

          "user",

          "username email avatar role"

        )

        .sort({
          createdAt: -1,
        })

        .lean();

    // 🔥 Attach signed URLs
    const logsWithSignedUrls =

      await Promise.all(

        logs.map(

          async (log: UnsafeMediaLog) => {

            let signedEvidenceUrl =
              null;

            // 🔥 Evidence exists
            if (
              log.metadata?.evidenceKey
            ) {

              signedEvidenceUrl =

                await getSignedFileUrl(

                  log.metadata.evidenceKey

                );

            }

            return {

              ...log,

              signedEvidenceUrl:
                signedEvidenceUrl ||
                log.metadata?.evidenceUrl ||
                null,

            };

          }

        )

      );

    return NextResponse.json({

      success: true,

      logs:
        logsWithSignedUrls,

    });

  } catch (error) {

    console.error(
      "UNSAFE MEDIA ERROR:",
      error
    );

    return handleApiError(
      error
    );

  }

}
