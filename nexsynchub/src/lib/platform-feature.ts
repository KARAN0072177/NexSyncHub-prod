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

// 🔥 Workspace creation feature

export async function
canCreateWorkspace() {

  const enabled =

    await redis.get<boolean>(

      "allow_workspace_creation"

    );

  return enabled !== false;

}