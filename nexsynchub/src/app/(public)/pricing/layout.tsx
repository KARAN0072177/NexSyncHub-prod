import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description: "Find the perfect NexSyncHub workspace plan. Start for free or choose a Pro or Business tier for advanced AI-driven workspace intelligence.",
  alternates: {
    canonical: "https://nexsynchub.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
