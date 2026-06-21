import Footer from "@/components/Footer";
import NewsletterConfirmationPopup from "@/components/NewsletterConfirmationPopup";
import PublicNavbar from "@/components/PublicNavbar";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "NexSyncHub | Real-time Collaboration Workspace",
    template: "%s | NexSyncHub",
  },
  description: "NexSyncHub brings chat, tasks, documents, and workspaces into one calm, fast, and focused environment. Built for teams that ship.",
  alternates: {
    canonical: "https://nexsynchub.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NexSyncHub",
  "url": "https://nexsynchub.com",
  "logo": "https://nexsynchub.com/favicon.ico",
  "description": "Real-time team collaboration workspace bringing chat, tasks, documents, and workspaces into one calm, fast, and focused environment.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNavbar />

      <main>
        {children}
      </main>

      <Footer />

      <Suspense fallback={null}>
        <NewsletterConfirmationPopup />
      </Suspense>
    </div>
  );
}

