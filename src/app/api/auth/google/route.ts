import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const googleAuthURL =
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();

  const res = NextResponse.redirect(googleAuthURL);

  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return res;
}