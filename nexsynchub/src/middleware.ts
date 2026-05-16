import { withAuth }
  from "next-auth/middleware";

export default withAuth(

  function middleware(req) {

    const role =
      req.nextauth.token?.role;

    const pathname =
      req.nextUrl.pathname;

    // 🔥 Protect admin routes
    if (
      pathname.startsWith(
        "/admin"
      )
    ) {

      // ❌ Not admin
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