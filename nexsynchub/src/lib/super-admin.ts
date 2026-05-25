import User
  from "@/models/User";

export async function requireSuperAdmin(
  userId: string
) {

  const user =
    await User.findById(
      userId
    );

  if (
    !user ||
    user.role !==
    "super_admin"
  ) {

    throw new Error(
      "Super admin access required"
    );

  }

  return user;

}