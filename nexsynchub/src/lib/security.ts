import SecurityLog
  from "@/models/SecurityLog";

interface CreateSecurityLogParams {

  userId?: string;

  action: string;

  ip?: string;

  userAgent?: string;

  metadata?: Record<
    string,
    any
  >;

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
      await SecurityLog.findById(
        log._id
      )

        .populate(
          "user",
          "username email role avatar"
        )

        .lean();

    // 🔥 Emit realtime event
    await fetch(

      `${process.env.SOCKET_SERVER_URL}/emit`,

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
            populatedLog,

          channelId:
            "admin_global",

        }),

      }

    );

  } catch (error) {

    console.error(
      "SECURITY LOG ERROR:",
      error
    );

  }

}