import User
  from "@/models/User";

export async function checkBan(
  userId: string
) {

  // 🔥 Fetch user
  const user =
    await User.findById(
      userId
    );

  // 🔥 User not found
  if (!user) {

    throw new Error(
      "User not found"
    );

  }

  // 🔥 Not banned
  if (!user.isBanned) {

    return;

  }

  // 🔥 Temporary suspension expired
  if (
    user.banExpiresAt
    &&
    new Date() >
    new Date(
      user.banExpiresAt
    )
  ) {

    user.isBanned = false;

    user.banReason = "";

    user.banExpiresAt = null;

    user.bannedBy = null;

    await user.save();

    return;

  }

  // 🔥 Active ban
  throw new Error(

    user.banExpiresAt

      ? `Your account is suspended until ${new Date(
          user.banExpiresAt
        ).toLocaleString()}.`

      : "Your account has been permanently banned."

  );

}