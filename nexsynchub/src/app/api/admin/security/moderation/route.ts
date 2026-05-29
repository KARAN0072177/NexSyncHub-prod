// src/app/api/admin/security/moderation/route.ts

import { NextResponse }
  from "next/server";

import { requireAuth } from "@/lib/auth-guard";

import { connectDB }
  from "@/lib/db";

import SecurityLog
  from "@/models/SecurityLog";

import {
  requireAdmin,
} from "@/lib/permissions";
import { handleApiError } from "@/lib/api-error";
import {
  getSignedFileUrl,
} from "@/lib/s3";

type ModerationLogMetadata = {
  evidenceKey?: string;
  evidenceUrl?: string;
  [key: string]: unknown;
};

type ModerationLog = {
  metadata?: ModerationLogMetadata;
  [key: string]: unknown;
};

export async function GET() {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await requireAuth();

    await requireAdmin(
      session.user.id
    );

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Fetch moderation events
    const logs =
      await SecurityLog.find({

        action: {

          $in: [

            "unsafe_avatar_upload",

            "unsafe_workspace_name",

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

        .limit(100)

        .lean();

    const logsWithEvidence =
      await Promise.all(
        (logs as ModerationLog[]).map(
          async (log) => {
            if (!log.metadata?.evidenceKey) {
              return {
                ...log,
                signedEvidenceUrl:
                  log.metadata?.evidenceUrl ||
                  null,
              };
            }

            try {
              return {
                ...log,
                signedEvidenceUrl:
                  await getSignedFileUrl(
                    log.metadata.evidenceKey
                  ),
              };
            } catch (error) {
              console.error(
                "MODERATION SIGNED EVIDENCE ERROR:",
                error
              );

              return {
                ...log,
                signedEvidenceUrl:
                  log.metadata.evidenceUrl ||
                  null,
              };
            }
          }
        )
      );

    return NextResponse.json({

      success: true,

      logs:
        logsWithEvidence,

    });

  } catch (error) {

    console.error(
      "MODERATION LOGS ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }

}
