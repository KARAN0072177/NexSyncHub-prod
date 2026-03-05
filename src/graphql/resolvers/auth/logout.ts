export const logout = async (_: any, __: any, context: any) => {
  context.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return true;
};