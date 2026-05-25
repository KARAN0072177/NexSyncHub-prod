import {
  redis,
} from "@/lib/redis";

// 🔥 Workspace invite feature
export async function
canUseWorkspaceInvites() {

  const enabled =

    await redis.get<boolean>(

      "allow_workspace_invites"

    );

  // 🔥 Default allow
  return enabled !== false;

}