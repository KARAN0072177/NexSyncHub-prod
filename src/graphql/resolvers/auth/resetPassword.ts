import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/hash";
import { sendPasswordChangedEmail } from "@/lib/email/sendPasswordChangedEmail";

export const resetPassword = async (_: any, args: any) => {
  const { email, password } = args;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  await sendPasswordChangedEmail(email);

  return true;
};