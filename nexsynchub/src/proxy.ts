import {
  withAuth,
} from "next-auth/middleware";

export default withAuth(

  function proxy(req) {

    const token =
      req.nextauth.token;

    console.log(
      "PROXY TOKEN:",
      token
    );

    const role =
      token?.role as string;

    const pathname =
      req.nextUrl.pathname;

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
    callbacks: {

      authorized:
        ({ token }) =>
          !!token,

    },
  }

);

export const config = {

  matcher: [

    "/admin/:path*",

  ],

};