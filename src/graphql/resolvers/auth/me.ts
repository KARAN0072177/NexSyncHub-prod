import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth/jwt";

export const me = async (_: any, __: any, context: any) => {
  const token = context.cookies.get("token")?.value;

  if (!token) return null;

  try {
    const payload: any = await verifyJWT(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        accounts: true,
      },
    });

    return user;
  } catch {
    return null;
  }
};