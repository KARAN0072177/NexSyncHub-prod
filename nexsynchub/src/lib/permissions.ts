import Membership from "@/models/Membership";

import User from "@/models/User";

// 🔥 Get workspace membership
export async function getMembership(
  workspaceId: string,
  userId: string
) {

  return await Membership.findOne({
    workspace: workspaceId,
    user: userId,
  });

}

// 🔥 Workspace admin check
export function isWorkspaceAdmin(
  role?: string
) {

  return (
    role === "owner" ||
    role === "admin"
  );

}

// 🔥 Workspace owner check
export function isWorkspaceOwner(
  role?: string
) {

  return role === "owner";

}

// 🔥 Platform admin check
export async function isAdmin(
  userId: string
) {

  const user =
    await User.findById(userId)
      .select("role");

  return (
    user?.role === "admin" ||
    user?.role === "super_admin"
  );

}

// 🔥 Platform super admin check
export async function isSuperAdmin(
  userId: string
) {

  const user =
    await User.findById(userId)
      .select("role");

  return (
    user?.role === "super_admin"
  );

}