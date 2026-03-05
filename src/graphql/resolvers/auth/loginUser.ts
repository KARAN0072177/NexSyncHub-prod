import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/hash";
import { createJWT } from "@/lib/auth/jwt";

export const loginUser = async (_: any, args: any, context: any) => {
    const { identifier, password } = args;

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier },
            ],
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.passwordHash) {
        throw new Error("Invalid login method");
    }

    const valid = await comparePassword(password, user.passwordHash);

    if (!valid) {
        throw new Error("Incorrect password");
    }

    if (!user.emailVerified) {
        throw new Error("Email not verified");
    }

    const token = await createJWT({ userId: user.id });

    context.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return {
        id: user.id,
        email: user.email,
        username: user.username,
    };
};