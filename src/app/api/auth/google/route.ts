import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const googleAuthURL =
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();

  return NextResponse.redirect(googleAuthURL);
}