import { Redis } from "@upstash/redis";
import { withAuth } from "next-auth/middleware";

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
        return Response.json(
          { error: "Platform is under maintenance" },
          { status: 503 }
        );
      }

      return Response.redirect(new URL("/maintenance", req.url));
    }

    if (!isMaintenance && pathname === "/maintenance") {
      return Response.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/admin")) {
      if (role !== "admin" && role !== "super_admin") {
        return Response.redirect(new URL("/dashboard", req.url));
      }
    }
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