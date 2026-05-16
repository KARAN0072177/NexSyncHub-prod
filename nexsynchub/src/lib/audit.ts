import AuditLog
  from "@/models/AuditLog";

interface CreateAuditLogParams {

  workspaceId: string;

  actorId: string;

  action: string;

  targetType: string;

  targetId?: string;

  metadata?: Record<
    string,
    any
  >;

}

// 🔥 Centralized audit logger
export async function createAuditLog({

  workspaceId,

  actorId,

  action,

  targetType,

  targetId,

  metadata = {},

}: CreateAuditLogParams) {

  try {

    // 🔥 Create audit
    const audit =
      await AuditLog.create({

        workspace:
          workspaceId,

        actor:
          actorId,

        action,

        targetType,

        targetId,

        metadata,

      });

    // 🔥 Populate audit
    const populatedAudit =
      await AuditLog.findById(
        audit._id
      )

        .populate(
          "actor",
          "username avatar email"
        )

        .populate(
          "workspace",
          "name"
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
            "admin_audit_created",

          data:
            populatedAudit,

          // 🔥 global room
          channelId:
            "admin_global",

        }),

      }
    );

  } catch (error) {

    console.error(
      "AUDIT LOG ERROR:",
      error
    );

  }

}