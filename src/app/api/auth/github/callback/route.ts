import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJWT } from "@/lib/auth/jwt";
import { isDisposableEmail } from "@/lib/auth/isDisposableEmail";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const storedState = req.cookies.get("oauth_state")?.value;

    if (!state || state !== storedState) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Exchange code for access token
    const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_REDIRECT_URI,
            }),
        }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Get GitHub user profile
    const profileRes = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const profile = await profileRes.json();

    // Get user emails
    const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const emails = await emailRes.json();

    const primaryEmail = emails.find((e: any) => e.primary)?.email;

    if (!primaryEmail) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 🚫 Block disposable emails
    if (isDisposableEmail(primaryEmail)) {
        return NextResponse.redirect(
            new URL("/login?error=disposable_email", req.url)
        );
    }

    const githubId = profile.id.toString();

    let user;

    // Check if GitHub account already linked
    const existingAccount = await prisma.account.findFirst({
        where: {
            provider: "github",
            providerAccountId: githubId,
        },
    });

    if (existingAccount) {
        user = await prisma.user.findUnique({
            where: { id: existingAccount.userId },
        });
    } else {
        user = await prisma.user.findUnique({
            where: { email: primaryEmail },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: primaryEmail,
                    emailVerified: true,
                },
            });
        }

        await prisma.account.create({
            data: {
                userId: user.id,
                provider: "github",
                providerAccountId: githubId,
            },
        });
    }

    const token = await createJWT({ userId: user!.id });

    const redirectPath = user?.username ? "/dashboard" : "/setup-profile";

    const res = NextResponse.redirect(new URL(redirectPath, req.url));

    res.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    res.cookies.set("oauth_state", "", {
        expires: new Date(0),
        path: "/",
    });

    return res;
}