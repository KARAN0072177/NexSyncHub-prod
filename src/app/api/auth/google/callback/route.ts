import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Exchange code for access token
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

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Fetch Google user profile
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
  const googleId = profile.id;

  let user;

  // 1️⃣ Check if Google account already linked
  const existingAccount = await prisma.account.findFirst({
    where: {
      provider: "google",
      providerAccountId: googleId,
    },
  });

  if (existingAccount) {
    // Returning Google user
    user = await prisma.user.findUnique({
      where: { id: existingAccount.userId },
    });
  } else {
    // 2️⃣ Check if user exists with same email
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 3️⃣ Create new user
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
        },
      });
    }

    // 4️⃣ Link Google account
    await prisma.account.create({
      data: {
        userId: user.id,
        provider: "google",
        providerAccountId: googleId,
      },
    });
  }

  // Create JWT session
  const token = await createJWT({ userId: user!.id });

  // Decide redirect based on username
  const redirectPath = user?.username ? "/dashboard" : "/setup-profile";

  const res = NextResponse.redirect(new URL(redirectPath, req.url));

  res.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res;
}