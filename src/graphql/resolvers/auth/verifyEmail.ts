import { prisma } from "@/lib/prisma";

export const verifyEmail = async (_: any, args: any) => {
  const { token } = args;

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    throw new Error("Invalid token");
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new Error("Token expired");
  }

  // update user
  await prisma.user.update({
    where: { email: verificationToken.email },
    data: { emailVerified: true },
  });

  // delete token after use
  await prisma.verificationToken.delete({
    where: { token },
  });

  return true;
};