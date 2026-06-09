import { signOut }
  from "next-auth/react";

export async function logout(
  callbackUrl = "/login"
) {

  try {

    // 🔥 Create security log
    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );

  } catch (error) {

    console.error(
      "LOGOUT LOG ERROR:",
      error
    );

  }

  // 🔥 Actual logout
  await signOut({

    callbackUrl,

  });

}
