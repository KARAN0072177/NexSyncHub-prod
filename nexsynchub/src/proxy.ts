import {
  withAuth,
} from "next-auth/middleware";

import {
  Redis,
} from "@upstash/redis";

const redis =
  new Redis({

    url:
      process.env
        .UPSTASH_REDIS_REST_URL!,

    token:
      process.env
        .UPSTASH_REDIS_REST_TOKEN!,

  });

export default withAuth(

  async function proxy(req) {

    const token =
      req.nextauth.token;

    const role =
      token?.role as string;

    const pathname =
      req.nextUrl.pathname;

    // 🔥 Maintenance mode (Strict boolean/string parsing)
    const rawMaintenance =

      await redis.get(
        "maintenance_mode"
      );

    const isMaintenance = rawMaintenance === true || rawMaintenance === "true";

    // 🔥 Maintenance protection
    if (

      isMaintenance

      &&

      role !== "admin"

      &&

      role !== "super_admin"

      &&

      pathname !== "/maintenance"

      &&

      !pathname.startsWith("/api/auth")

      &&

      pathname !== "/login"

    ) {

      // Return JSON for API routes instead of an HTML redirect
      if (pathname.startsWith("/api/")) {
        return Response.json({ error: "Platform is under maintenance" }, { status: 503 });
      }

      return Response.redirect(

        new URL(
          "/maintenance",
          req.url
        )

      );

    }

    // 🔥 Redirect out of maintenance if it's off
    if (!isMaintenance && pathname === "/maintenance") {
      return Response.redirect(new URL("/", req.url));
    }

    // 🔥 Protect admin routes
    if (
      pathname.startsWith(
        "/admin"
      )
    ) {

      // ❌ Block normal users
      if (
        role !== "admin" &&
        role !== "super_admin"
      ) {

        return Response.redirect(
          new URL(
            "/dashboard",
            req.url
          )
        );

      }

    }

  },

  {
    secret:
      process.env.NEXTAUTH_SECRET ||
      process.env.AUTH_SECRET,

    callbacks: {

      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        // Allow public access to these routes so middleware can handle them
        if (
          pathname.startsWith("/api/auth") ||
          pathname === "/api/platform/public-settings" ||
          pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/verify-email" ||
          pathname === "/forgot-password" ||
          pathname === "/verify-reset-otp" ||
          pathname === "/reset-password" ||
          pathname === "/invite" ||
          pathname === "/features" ||
          pathname === "/support-center" ||
          pathname === "/maintenance" ||
          pathname === "/"
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

    "/((?!_next/static|_next/image|favicon.ico).*)",

  ],

};
