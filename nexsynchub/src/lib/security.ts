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

    await SecurityLog.create({

      user:
        userId || null,

      action,

      ip,

      userAgent,

      metadata,

    });

  } catch (error) {

    console.error(
      "SECURITY LOG ERROR:",
      error
    );

  }

}