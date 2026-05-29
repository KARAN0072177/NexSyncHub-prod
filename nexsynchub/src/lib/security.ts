import SecurityLog
  from "@/models/SecurityLog";
import {
  getSignedFileUrl,
} from "@/lib/s3";

type SecurityLogMetadata =
  Record<string, unknown> & {
    evidenceKey?: string;
  };

type SecurityLogRealtimePayload =
  Record<string, unknown> & {
    metadata?: SecurityLogMetadata;
    signedEvidenceUrl?: string;
  };

interface CreateSecurityLogParams {

  userId?: string;

  action: string;

  ip?: string;

  userAgent?: string;

  metadata?: SecurityLogMetadata;

}

// 🔥 Centralized security logger
export async function createSecurityLog({

  userId,

  action,

  ip,

  userAgent,

  metadata = {},

}: CreateSecurityLogParams) {

  try {

    // 🔥 Create log
    const log =
      await SecurityLog.create({

        user:
          userId || null,

        action,

        ip,

        userAgent,

        metadata,

      });

    // 🔥 Populate user
    const populatedLog =
      (await SecurityLog.findById(
        log._id
      )

        .populate(
          "user",
          "username email role avatar"
        )

        .lean()) as SecurityLogRealtimePayload | null;

    let realtimeLog =
      populatedLog;

    if (
      populatedLog?.metadata?.evidenceKey
    ) {
      try {
        realtimeLog = {
          ...populatedLog,
          signedEvidenceUrl:
            await getSignedFileUrl(
              populatedLog.metadata.evidenceKey
            ),
        };
      } catch (error) {
        console.error(
          "SECURITY LOG SIGNED EVIDENCE ERROR:",
          error
        );
      }
    }

    // 🔥 Emit realtime event
    const socketServerUrl =
      process.env.SOCKET_SERVER_URL ||
      process.env.NEXT_PUBLIC_SOCKET_URL;

    if (socketServerUrl) {
      try {
        await fetch(
          `${socketServerUrl}/emit`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              event:
                "admin_security_log_created",
              data:
                realtimeLog,
              channelId:
                "admin_global",
            }),
          }
        );
      } catch (error) {
        console.error(
          "SECURITY LOG REALTIME EMIT ERROR:",
          error
        );
      }
    }

    return realtimeLog;

  } catch (error) {

    console.error(
      "SECURITY LOG ERROR:",
      error
    );

  }

}
