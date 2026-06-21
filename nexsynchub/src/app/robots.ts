import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://nexsynchub.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/features", "/pricing", "/support-center"],
        disallow: [
          "/admin",
          "/dashboard",
          "/api",
          "/invite",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/set-username",
          "/verify-email",
          "/verify-reset-otp",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
