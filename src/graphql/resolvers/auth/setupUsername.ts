import { prisma } from "@/lib/prisma";

export const setupUsername = async (_: any, args: any) => {
  const { email, username } = args;

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    throw new Error("Username already taken");
  }

  const user = await prisma.user.update({
    where: { email },
    data: { username },
  });

  return {
    id: user.id,
    username: user.username,
  };
};