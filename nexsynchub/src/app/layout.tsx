import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import AuthProvider
  from "@/providers/SessionProvider";

import GlobalBanProvider
  from "@/components/providers/GlobalBanProvider";

import GlobalAnnouncement
  from "@/components/global/GlobalAnnouncement";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nexsynchub.com"),
  title: {
    default: "NexSyncHub | Real-time Collaboration Workspace",
    template: "%s | NexSyncHub",
  },
  description: "NexSyncHub brings chat, tasks, documents, and workspaces into one calm, fast, and focused environment. Built for teams that ship.",
  keywords: [
    "collaboration",
    "team workspace",
    "real-time chat",
    "task management",
    "media hub",
    "moderation",
    "activity timeline",
    "developer tools",
    "productivity",
  ],
  authors: [{ name: "NexSyncHub Team" }],
  creator: "NexSyncHub",
  publisher: "NexSyncHub",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nexsynchub.com",
    title: "NexSyncHub | Real-time Collaboration Workspace",
    description: "NexSyncHub brings chat, tasks, documents, and workspaces into one calm, fast, and focused environment. Built for teams that ship.",
    siteName: "NexSyncHub",
    images: [
      {
        url: "https://nexsynchub.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "NexSyncHub Team Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexSyncHub | Real-time Collaboration Workspace",
    description: "NexSyncHub brings chat, tasks, documents, and workspaces into one calm, fast, and focused environment. Built for teams that ship.",
    images: ["https://nexsynchub.com/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          nonce={nonce}
        />

        <AuthProvider>

          <GlobalBanProvider>

            <GlobalAnnouncement />

            {/* 🔥 MAIN CONTENT */}
            <main className="flex-1">

              {children}

            </main>

          </GlobalBanProvider>

        </AuthProvider>

      </body>

    </html>

  );

}