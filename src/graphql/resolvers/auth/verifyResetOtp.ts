import { prisma } from "@/lib/prisma";

export const verifyResetOtp = async (_: any, args: any) => {
  const { email, otp } = args;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const record = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, otp },
  });

  if (!record) {
    throw new Error("Invalid OTP");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  return true;
};