import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJWT } from "@/lib/auth/jwt";
import { isDisposableEmail } from "@/lib/auth/isDisposableEmail";

export async function GET(req: NextRequest) {
  console.log("---- MICROSOFT OAUTH CALLBACK START ----");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("oauth_state")?.value;

  console.log("CODE:", code);
  console.log("STATE (query):", state);
  console.log("STATE (cookie):", storedState);

  if (!state || state !== storedState) {
    console.log("STATE MISMATCH - Redirecting to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!code) {
    console.log("NO CODE RECEIVED - Redirecting to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("Exchanging code for token...");

  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    }
  );

  const tokenData = await tokenRes.json();

  console.log("TOKEN RESPONSE:", tokenData);

  const accessToken = tokenData.access_token;

  if (!accessToken) {
    console.log("NO ACCESS TOKEN - Redirecting to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("Fetching Microsoft profile...");

  const profileRes = await fetch(
    "https://graph.microsoft.com/v1.0/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const profile = await profileRes.json();

  console.log("MICROSOFT PROFILE:", profile);

  const email =
    profile.mail || profile.userPrincipalName;

  console.log("EXTRACTED EMAIL:", email);

  if (!email || isDisposableEmail(email)) {
    console.log("INVALID OR DISPOSABLE EMAIL - Redirecting");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const microsoftId = profile.id;

  console.log("MICROSOFT ID:", microsoftId);

  let user;

  console.log("Checking existing Microsoft account...");

  const existingAccount = await prisma.account.findFirst({
    where: {
      provider: "microsoft",
      providerAccountId: microsoftId,
    },
  });

  if (existingAccount) {
    console.log("Existing account found");

    user = await prisma.user.findUnique({
      where: { id: existingAccount.userId },
    });
  } else {
    console.log("No Microsoft account found, checking email...");

    user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("Creating new user");

      user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
        },
      });
    }

    console.log("Linking Microsoft account");

    await prisma.account.create({
      data: {
        userId: user.id,
        provider: "microsoft",
        providerAccountId: microsoftId,
      },
    });
  }

  console.log("Generating JWT...");

  await prisma.user.update({
    where: { id: user!.id },
    data: { lastLoginProvider: "microsoft" },
  });

  const token = await createJWT({ userId: user!.id });

  const redirectPath = user?.username ? "/dashboard" : "/setup-profile";

  console.log("Redirecting user to:", redirectPath);

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

  console.log("---- MICROSOFT OAUTH SUCCESS ----");

  return res;
}