import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore the core features of NexSyncHub including channels, realtime ticket loops, safety moderation, media hub archives, activity timelines, and granular role management.",
  alternates: {
    canonical: "https://nexsynchub.com/features",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
