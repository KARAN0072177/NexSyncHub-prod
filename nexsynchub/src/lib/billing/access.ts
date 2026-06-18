import Membership from "@/models/Membership";
import Workspace from "@/models/Workspace";

export async function getWorkspaceAccess({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) {
  const [workspace, membership] =
    await Promise.all([
      Workspace.findById(
        workspaceId
      ),
      Membership.findOne({
        workspace: workspaceId,
        user: userId,
      }),
    ]);

  return {
    workspace,
    membership,
    role: membership?.role || null,
    isOwner: membership?.role === "OWNER",
    canView: Boolean(membership),
  };
}
