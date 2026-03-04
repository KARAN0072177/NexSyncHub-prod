import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/hash";
import { generateToken } from "@/lib/auth/tokens";

export const registerUser = async (_: any, args: any) => {
  const { email, password } = args;

  // check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // hash password
  const passwordHash = await hashPassword(password);

  // create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  // create verification token
  const token = generateToken();

  await prisma.verificationToken.create({
    data: {
      email,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

  // later we send email here

  return {
    id: user.id,
    email: user.email,
  };
};