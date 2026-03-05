import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth/jwt";

export const setupUsername = async (_: any, args: any, context: any) => {
  const { username } = args;

  const token = context.cookies.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = await verifyJWT(token);

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    throw new Error("Username already taken");
  }

  const user = await prisma.user.update({
    where: { id: payload.userId as string },
    data: { username },
  });

  return {
    id: user.id,
    username: user.username,
  };
};