import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about NexSyncHub's mission to keep workspaces from forgetting context, bringing channels, tickets, media, and activity timelines together.",
  alternates: {
    canonical: "https://nexsynchub.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
