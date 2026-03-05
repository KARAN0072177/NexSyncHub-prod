import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Exchange code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        }),
    });

    const tokenData = await tokenRes.json();

    const accessToken = tokenData.access_token;

    // Get Google profile
    const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const profile = await profileRes.json();

    const email = profile.email;

    // Find existing user
    let user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                emailVerified: true,
            },
        });
    }

    // Create JWT
    const token = await createJWT({ userId: user.id });

    const redirectPath = user.username ? "/dashboard" : "/setup-profile";

    const res = NextResponse.redirect(new URL(redirectPath, req.url));

    res.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res;
}