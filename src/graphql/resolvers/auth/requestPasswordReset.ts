import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/auth/generateOtp";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordResetEmail";

export const requestPasswordReset = async (_: any, args: any) => {
    const { identifier } = args;

    const user = await prisma.user.findFirst({
        where: {
            OR: [{ email: identifier }, { username: identifier }],
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const otp = generateOtp();

    await prisma.passwordResetToken.deleteMany({
        where: {
            user: { id: user.id },
        },
    });

    await prisma.passwordResetToken.create({
        data: {
            user: {
                connect: { id: user.id },
            },
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
    });

    await sendPasswordResetEmail(user.email, otp);

    return true;
};