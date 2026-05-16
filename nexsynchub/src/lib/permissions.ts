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

// 🔥 Require platform admin
export async function requireAdmin(
  userId: string
) {

  const allowed =
    await isAdmin(userId);

  if (!allowed) {

    throw new Error(
      "Admin access required"
    );

  }

}

// 🔥 Require super admin
export async function requireSuperAdmin(
  userId: string
) {

  const allowed =
    await isSuperAdmin(userId);

  if (!allowed) {

    throw new Error(
      "Super admin access required"
    );

  }

}