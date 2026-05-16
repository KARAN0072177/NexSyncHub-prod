import AuditLog from "@/models/AuditLog";

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

    await AuditLog.create({

      workspace: workspaceId,

      actor: actorId,

      action,

      targetType,

      targetId,

      metadata,

    });

  } catch (error) {

    console.error(
      "AUDIT LOG ERROR:",
      error
    );

  }

}