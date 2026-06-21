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
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://nexsynchub.com/#organization",
      "name": "NexSyncHub",
      "url": "https://nexsynchub.com",
      "logo": "https://nexsynchub.com/favicon.ico",
      "description": "Real-time team collaboration workspace bringing chat, tasks, documents, and workspaces into one calm, fast, and focused environment."
    },
    {
      "@type": "WebSite",
      "@id": "https://nexsynchub.com/#website",
      "url": "https://nexsynchub.com",
      "name": "NexSyncHub",
      "publisher": {
        "@id": "https://nexsynchub.com/#organization"
      }
    },
    {
      "@type": "ItemList",
      "@id": "https://nexsynchub.com/#navigation",
      "name": "Navigation Menu",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "Features",
          "url": "https://nexsynchub.com/features"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "Pricing",
          "url": "https://nexsynchub.com/pricing"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "About",
          "url": "https://nexsynchub.com/about"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "Support Center",
          "url": "https://nexsynchub.com/support-center"
        }
      ]
    }
  ]
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

