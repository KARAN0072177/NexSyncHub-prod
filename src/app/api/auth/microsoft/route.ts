import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    response_mode: "query",
    scope: "openid profile email User.Read",
    state,
  });

  const microsoftAuthURL =
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" +
    params.toString();

  const res = NextResponse.redirect(microsoftAuthURL);

  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
  });

  return res;
}