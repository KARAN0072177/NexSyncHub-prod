import Footer from "@/components/Footer";
import NewsletterConfirmationPopup from "@/components/NewsletterConfirmationPopup";
import PublicNavbar from "@/components/PublicNavbar";
import { Suspense } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
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
