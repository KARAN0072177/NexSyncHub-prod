import { Redis } from "@upstash/redis";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const MAINTENANCE_CACHE_TTL_MS = 15_000;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

let maintenanceCache: {
  value: boolean;
  expiresAt: number;
} | null = null;

async function getMaintenanceMode() {
  const now = Date.now();

  if (maintenanceCache && maintenanceCache.expiresAt > now) {
    return maintenanceCache.value;
  }

  if (!redis) {
    return false;
  }

  try {
    const rawMaintenance = await redis.get("maintenance_mode");
    const value = rawMaintenance === true || rawMaintenance === "true";

    maintenanceCache = {
      value,
      expiresAt: now + MAINTENANCE_CACHE_TTL_MS,
    };

    return value;
  } catch (error) {
    console.error("MAINTENANCE MODE READ ERROR:", error);
    return maintenanceCache?.value ?? false;
  }
}

export default withAuth(
  async function proxy(req) {
    const token = req.nextauth.token;
    const role = token?.role as string;
    const pathname = req.nextUrl.pathname;

    const isMaintenance = await getMaintenanceMode();

    // 1. Generate a cryptographically random UUID and convert to base64
    const nonce = btoa(crypto.randomUUID());
    const isDev = process.env.NODE_ENV === "development";

    // 2. Parse app and socket connection parameters
    const socketOrigin = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const wsOrigin = socketOrigin ? socketOrigin.replace(/^http/, "ws") : "";

    // 3. Define strict Content Security Policy directives
    const scriptDirectives = [
      "'self'",
      `'nonce-${nonce}'`,
      isDev ? "'unsafe-eval'" : "", // Allowed ONLY in development for local HMR
      "https://challenges.cloudflare.com",
      "https://js.stripe.com",
      "https://vercel.live",
    ].filter(Boolean).join(" ");

    const connectDirectives = [
      "'self'",
      "https://api.openai.com",
      "https://challenges.cloudflare.com",
      "https://api.stripe.com",
      "https://vercel.live",
      "https://*.vercel.app",
      socketOrigin,
      wsOrigin,
    ].filter(Boolean).join(" ");

    const cspHeader = `
      default-src 'self';
      script-src ${scriptDirectives};
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com data:;
      img-src 'self' data: blob: https:;
      media-src 'self' blob: https:;
      connect-src ${connectDirectives};
      frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://vercel.live;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, " ").trim();

    // 4. Set headers on request context so Server Components can read x-nonce
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", cspHeader);

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // 5. Handle redirects & maintenance states
    if (
      isMaintenance &&
      role !== "admin" &&
      role !== "super_admin" &&
      pathname !== "/maintenance" &&
      pathname !== "/api/stripe/webhook" &&
      !pathname.startsWith("/api/auth") &&
      pathname !== "/login"
    ) {
      if (pathname.startsWith("/api/")) {
        response = NextResponse.json(
          { error: "Platform is under maintenance" },
          { status: 503 }
        );
      } else {
        response = NextResponse.redirect(new URL("/maintenance", req.url));
      }
    } else if (!isMaintenance && pathname === "/maintenance") {
      response = NextResponse.redirect(new URL("/", req.url));
    } else if (pathname.startsWith("/admin")) {
      if (role !== "admin" && role !== "super_admin") {
        response = NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Apply the Content-Security-Policy to response headers
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  },
  {
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        if (
          pathname.startsWith("/api/auth") ||
          pathname === "/api/stripe/webhook" ||
          pathname === "/api/platform/public-settings" ||
          pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/verify-email" ||
          pathname === "/forgot-password" ||
          pathname === "/verify-reset-otp" ||
          pathname === "/reset-password" ||
          pathname === "/invite" ||
          pathname === "/features" ||
          pathname === "/about" ||
          pathname === "/pricing" ||
          pathname === "/support-center" ||
          pathname === "/maintenance" ||
          pathname === "/" ||
          pathname === "/sitemap.xml" ||
          pathname === "/robots.txt" ||
          pathname === "/manifest.webmanifest"
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};