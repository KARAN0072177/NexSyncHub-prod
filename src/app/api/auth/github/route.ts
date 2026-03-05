import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: "read:user user:email",
    state,
  });

  const githubAuthURL =
    "https://github.com/login/oauth/authorize?" + params.toString();

  const res = NextResponse.redirect(githubAuthURL);

  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return res;
}