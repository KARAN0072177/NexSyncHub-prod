export function normalizeAppUrl(url?: string | null) {
  if (!url) return "";

  return url.replace(/\/+$/, "");
}

export function getAppUrl() {
  const explicitUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (explicitUrl) {
    return normalizeAppUrl(explicitUrl);
  }

  if (vercelUrl) {
    return normalizeAppUrl(
      vercelUrl.startsWith("http")
        ? vercelUrl
        : `https://${vercelUrl}`
    );
  }

  return "http://localhost:3000";
}

export function getRequestAppUrl(req: Request) {
  const forwardedHost =
    req.headers.get("x-forwarded-host");

  const forwardedProto =
    req.headers.get("x-forwarded-proto") ||
    "https";

  if (forwardedHost) {
    return normalizeAppUrl(
      `${forwardedProto}://${forwardedHost}`
    );
  }

  return normalizeAppUrl(
    new URL(req.url).origin
  );
}
