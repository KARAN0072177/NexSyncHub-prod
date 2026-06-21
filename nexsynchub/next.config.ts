import type { NextConfig } from "next";

const getOrigin = (value?: string) => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const socketOrigin = getOrigin(process.env.NEXT_PUBLIC_SOCKET_URL);
const socketWsOrigin = socketOrigin?.replace(/^http/, "ws");
const appOrigin =
  getOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
  getOrigin(process.env.APP_URL) ||
  "https://nex-sync-hub-prod.vercel.app";

const awsRegion = process.env.AWS_REGION || "us-east-1";
const awsBucketName = process.env.AWS_BUCKET_NAME;
const s3Origins = [
  awsBucketName
    ? `https://${awsBucketName}.s3.${awsRegion}.amazonaws.com`
    : null,
  `https://*.s3.${awsRegion}.amazonaws.com`,
  "https://*.s3.amazonaws.com",
].filter(Boolean);

const csp = [
  ["default-src", "'self'"],
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://vercel.live",
    "https://challenges.cloudflare.com",
  ],
  [
    "style-src",
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
  ],
  ["font-src", "'self'", "https://fonts.gstatic.com", "data:"],
  ["img-src", "'self'", "data:", "blob:", "https:", ...s3Origins],
  ["media-src", "'self'", "blob:", ...s3Origins],
  [
    "connect-src",
    "'self'",
    appOrigin,
    "https://api.openai.com",
    "https://vercel.live",
    "https://*.vercel.app",
    "https://*.amazonaws.com",
    "https://challenges.cloudflare.com",
    socketOrigin,
    socketWsOrigin,
  ].filter(Boolean),
  [
    "frame-src",
    "'self'",
    "https://vercel.live",
    "https://challenges.cloudflare.com",
  ],
  ["object-src", "'none'"],
  ["base-uri", "'self'"],
  [
    "child-src",
    "'self'",
    "https://challenges.cloudflare.com",
  ],
  ["form-action", "'self'"],
  ["frame-ancestors", "'none'"],
  ["upgrade-insecure-requests"],
]
  .map((directive) => directive.join(" "))
  .join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
